"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import {
  fetchSources,
  addLink,
  uploadFile,
  addConnector,
  deleteSource,
  extractLinkMetadata,
  getSourcesCount
} from '../services/sourcesService';

const SourcesContext = createContext();

export function useSource() {
  const context = useContext(SourcesContext);
  if (!context) {
    throw new Error('useSources must be used within a SourcesProvider');
  }
  return context;
}

export function SourcesProvider({ children }) {
  const { currentUser } = useAuth();
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sourcesCount, setSourcesCount] = useState({
    links: 0,
    files: 0,
    connectors: 0,
    total: 0
  });

  // Fetch sources when user logs in
  useEffect(() => {
    if (currentUser) {
      loadSources();
      loadSourcesCount();
    } else {
      setSources([]);
      setSourcesCount({ links: 0, files: 0, connectors: 0, total: 0 });
      setLoading(false);
    }
  }, [currentUser]);

  /**
   * Load all sources for the current user
   */
  async function loadSources(type = null) {
    if (!currentUser) return;

    try {
      setLoading(true);
      setError(null);
      const fetchedSources = await fetchSources(currentUser.uid, type);
      setSources(fetchedSources);
    } catch (err) {
      console.error('Error loading sources:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  /**
   * Load sources count
   */
  async function loadSourcesCount() {
    if (!currentUser) return;

    try {
      const count = await getSourcesCount(currentUser.uid);
      setSourcesCount(count);
    } catch (err) {
      console.error('Error loading sources count:', err);
    }
  }

  /**
   * Add a new link source
   */
  async function addLinkSource(url) {
    if (!currentUser) throw new Error('User not authenticated');

    try {
      setError(null);

      // Extract metadata from URL
      const metadata = await extractLinkMetadata(url);

      // Add to Firebase
      const result = await addLink(currentUser.uid, url, metadata);

      // Reload sources
      await loadSources();
      await loadSourcesCount();

      return result;
    } catch (err) {
      console.error('Error adding link:', err);
      setError(err.message);
      throw err;
    }
  }

  /**
   * Upload a file source
   */
  async function uploadFileSource(file) {
    if (!currentUser) throw new Error('User not authenticated');

    try {
      setError(null);

      // Upload to Firebase Storage and add to Firestore
      const result = await uploadFile(currentUser.uid, file);

      // Reload sources
      await loadSources();
      await loadSourcesCount();

      return result;
    } catch (err) {
      console.error('Error uploading file:', err);
      setError(err.message);
      throw err;
    }
  }

  /**
   * Add a connector source
   */
  async function addConnectorSource(connectorId, connectorName, connectorData = {}) {
    if (!currentUser) throw new Error('User not authenticated');

    try {
      setError(null);

      // Add to Firebase
      const result = await addConnector(currentUser.uid, connectorId, connectorName, connectorData);

      // Reload sources
      await loadSources();
      await loadSourcesCount();

      return result;
    } catch (err) {
      console.error('Error adding connector:', err);
      setError(err.message);
      throw err;
    }
  }

  /**
   * Delete a source
   */
  async function removeSource(sourceId) {
    if (!currentUser) throw new Error('User not authenticated');

    try {
      setError(null);

      // Find the source to check if it has a storage path
      const source = sources.find(s => s.id === sourceId);
      const storagePath = source?.storagePath;

      // Delete from Firebase
      await deleteSource(sourceId, storagePath);

      // Update local state
      setSources(sources.filter(s => s.id !== sourceId));
      await loadSourcesCount();

      return { success: true };
    } catch (err) {
      console.error('Error deleting source:', err);
      setError(err.message);
      throw err;
    }
  }

  /**
   * Get sources by type
   */
  function getSourcesByType(type) {
    return sources.filter(source => source.type === type);
  }

  const value = {
    sources,
    loading,
    error,
    sourcesCount,
    loadSources,
    addLinkSource,
    uploadFileSource,
    addConnectorSource,
    removeSource,
    getSourcesByType
  };

  return (
    <SourcesContext.Provider value={value}>
      {children}
    </SourcesContext.Provider>
  );
}
