import {
  getFirestore,
  collection,
  addDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'firebase/storage';
import app from '../lib/firebase';

const db = getFirestore(app);
const storage = getStorage(app);

/**
 * Firestore Data Structure:
 *
 * Collection: sources
 * Document: {
 *   userId: string,
 *   type: 'links' | 'files' | 'connectors',
 *   name: string,
 *   icon: string (emoji or icon identifier),
 *
 *   // Type-specific fields
 *   url?: string (for links),
 *   metadata?: object (title, description, favicon for links),
 *
 *   fileUrl?: string (Firebase Storage URL for files),
 *   fileName?: string,
 *   fileSize?: number,
 *   fileType?: string,
 *
 *   connectorId?: string (gmail, notion, etc.),
 *   connectorStatus?: 'connected' | 'disconnected' | 'error',
 *   connectorData?: object (connector-specific data),
 *
 *   // Metadata
 *   createdAt: timestamp,
 *   updatedAt: timestamp,
 *
 *   // For future vector embedding
 *   embedded?: boolean,
 *   embeddingId?: string,
 *   lastEmbeddedAt?: timestamp
 * }
 */

// ==================== LINKS ====================

/**
 * Add a new link source
 */
export async function addLink(userId, url, metadata = {}) {
  try {
    const docRef = await addDoc(collection(db, 'sources'), {
      userId,
      type: 'links',
      name: metadata.title || url,
      icon: metadata.favicon || '🔗',
      url,
      metadata,
      embedded: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return { id: docRef.id, success: true };
  } catch (error) {
    console.error('Error adding link:', error);
    throw error;
  }
}

/**
 * Normalize URL to ensure it has a protocol
 */
function normalizeUrl(url) {
  let normalizedUrl = url.trim();

  // If no protocol, add https://
  if (!normalizedUrl.match(/^[a-zA-Z]+:\/\//)) {
    normalizedUrl = 'https://' + normalizedUrl;
  }

  return normalizedUrl;
}

/**
 * Extract metadata from a URL (basic implementation)
 * In production, you'd use a service like LinkPreview or scrape the page
 */
export async function extractLinkMetadata(url) {
  try {
    // Normalize URL first
    const normalizedUrl = normalizeUrl(url);

    // Basic validation
    const urlObj = new URL(normalizedUrl);

    // For now, return basic metadata
    // TODO: Implement proper metadata extraction (title, description, favicon)
    return {
      title: urlObj.hostname.replace('www.', ''),
      description: normalizedUrl,
      favicon: '🔗',
      url: normalizedUrl
    };
  } catch (error) {
    console.error('Error extracting link metadata:', error);
    // Return the original URL if parsing fails
    return {
      title: url,
      description: url,
      favicon: '🔗',
      url: url
    };
  }
}

// ==================== FILES ====================

/**
 * Upload a file to Firebase Storage and add to sources
 */
export async function uploadFile(userId, file) {
  try {
    // Create a unique file path
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name}`;
    const filePath = `users/${userId}/files/${fileName}`;
    const storageRef = ref(storage, filePath);

    const normalizedType = (file.type || 'application/octet-stream').toLowerCase();
    const metadata = { contentType: normalizedType };

    const snapshot = await uploadBytes(storageRef, file, metadata);
    const fileUrl = await getDownloadURL(snapshot.ref);

    // Add to Firestore
    const docRef = await addDoc(collection(db, 'sources'), {
      userId,
      type: 'files',
      name: file.name,
      icon: getFileIcon(normalizedType),
      fileUrl,
      fileName: file.name,
      fileSize: file.size,
      fileType: normalizedType,
      storagePath: filePath,
      embedded: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return {
      id: docRef.id,
      fileUrl,
      success: true
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}

/**
 * Get icon based on file type
 */
function getFileIcon(fileType) {
  const normalizedType = (fileType || '').toLowerCase();
  if (normalizedType.startsWith('image/')) return '🖼️';
  if (normalizedType.startsWith('video/')) return '🎥';
  if (normalizedType.includes('pdf')) return '📄';
  if (normalizedType.includes('word') || normalizedType.includes('document')) return '📝';
  if (normalizedType.includes('sheet') || normalizedType.includes('excel')) return '📊';
  if (normalizedType.includes('presentation') || normalizedType.includes('powerpoint')) return '📽️';
  if (normalizedType.includes('text')) return '📃';
  return '📁';
}

// ==================== CONNECTORS ====================

/**
 * Add a connector source
 */
export async function addConnector(userId, connectorId, connectorName, connectorData = {}) {
  try {
    const connectorIcons = {
      gmail: '📧',
      'google-drive': '📁',
      github: '🐙',
      slack: '💬',
      notion: '📝',
      whatsapp: '💬'
    };

    const docRef = await addDoc(collection(db, 'sources'), {
      userId,
      type: 'connectors',
      name: connectorName,
      icon: connectorIcons[connectorId] || '🔌',
      connectorId,
      connectorStatus: 'connected',
      connectorData,
      embedded: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return { id: docRef.id, success: true };
  } catch (error) {
    console.error('Error adding connector:', error);
    throw error;
  }
}

// ==================== COMMON ====================

/**
 * Fetch all sources for a user
 */
export async function fetchSources(userId, type = null) {
  try {
    let q;
    if (type) {
      q = query(
        collection(db, 'sources'),
        where('userId', '==', userId),
        where('type', '==', type),
        orderBy('createdAt', 'desc')
      );
    } else {
      q = query(
        collection(db, 'sources'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
    }

    const querySnapshot = await getDocs(q);
    const sources = [];

    querySnapshot.forEach((doc) => {
      sources.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return sources;
  } catch (error) {
    console.error('Error fetching sources:', error);
    throw error;
  }
}

/**
 * Delete a source
 */
export async function deleteSource(sourceId, storagePath = null) {
  try {
    // If it's a file, delete from storage first
    if (storagePath) {
      try {
        const storageRef = ref(storage, storagePath);
        await deleteObject(storageRef);
      } catch (storageError) {
        console.error('Error deleting file from storage:', storageError);
        // Continue with Firestore deletion even if storage deletion fails
      }
    }

    // Delete from Firestore
    await deleteDoc(doc(db, 'sources', sourceId));

    return { success: true };
  } catch (error) {
    console.error('Error deleting source:', error);
    throw error;
  }
}

/**
 * Get sources count by type
 */
export async function getSourcesCount(userId) {
  try {
    const sources = await fetchSources(userId);

    return {
      links: sources.filter(s => s.type === 'links').length,
      files: sources.filter(s => s.type === 'files').length,
      connectors: sources.filter(s => s.type === 'connectors').length,
      total: sources.length
    };
  } catch (error) {
    console.error('Error getting sources count:', error);
    throw error;
  }
}
