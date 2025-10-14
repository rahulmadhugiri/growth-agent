"use client";

import { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  X, 
  CheckCircle, 
  Circle, 
  ExternalLink, 
  Upload,
  Link as LinkIcon,
  FileText,
  Globe,
  ArrowRight,
  Sparkles,
  PlusCircle,
  File,
  AppWindow
} from 'lucide-react';

export default function OnboardingFlow() {
  const { completeOnboarding } = useAuth();
  const [activeTab, setActiveTab] = useState('links');
  const [url, setUrl] = useState('');
  const fileInputRef = useRef(null);
  const [connectedSources, setConnectedSources] = useState(new Set());
  const [uploadedFiles, setUploadedFiles] = useState([]);
  
  // Tabs for the left navigation
  const tabs = [
    { id: 'links', label: 'Links', icon: <LinkIcon size={18} /> },
    { id: 'files', label: 'Files', icon: <File size={18} /> },
    { id: 'connectors', label: 'Connectors', icon: <AppWindow size={18} /> },
  ];

  const connectors = [
    {
      id: 'gmail',
      name: 'Gmail with Calendar',
      description: 'Search, create, and manage your emails and calendar events',
      icon: '📧',
      status: 'available'
    },
    {
      id: 'google-drive',
      name: 'Google Drive',
      description: 'Access your documents, spreadsheets, and presentations',
      icon: '📁',
      status: 'available'
    },
    {
      id: 'github',
      name: 'GitHub',
      description: 'Connect your repositories and track development progress',
      icon: '🐙',
      status: 'available'
    },
    {
      id: 'slack',
      name: 'Slack',
      description: 'Monitor team communications and collaboration',
      icon: '💬',
      status: 'coming-soon'
    },
    {
      id: 'notion',
      name: 'Notion',
      description: 'Connect your workspace and knowledge base',
      icon: '📝',
      status: 'coming-soon'
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      description: 'Connect your account to WhatsApp',
      icon: '💬',
      status: 'coming-soon'
    }
  ];

  const handleConnectorToggle = (connectorId) => {
    const newConnected = new Set(connectedSources);
    if (newConnected.has(connectorId)) {
      newConnected.delete(connectorId);
    } else {
      newConnected.add(connectorId);
    }
    setConnectedSources(newConnected);
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    setUploadedFiles(prev => [...prev, ...files.map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size: file.size,
      type: file.type
    }))]);
  };

  const handleUrlSubmit = (e) => {
    e.preventDefault();
    if (url.trim()) {
      // Simple URL validation
      let validUrl = url;
      if (!validUrl.startsWith('http://') && !validUrl.startsWith('https://')) {
        validUrl = 'https://' + validUrl;
      }

      setUploadedFiles(prev => [...prev, {
        id: Date.now() + Math.random(),
        name: validUrl,
        type: 'url'
      }]);
      setUrl('');
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFinish = () => {
    completeOnboarding();
    
    // Force reload the page to ensure proper state update
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  const handleSkip = () => {
    completeOnboarding();
    
    // Force reload the page to ensure proper state update
    // This helps fix issues with onboarding not showing up
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Render content for the Links tab
  const renderLinksContent = () => {
    return (
      <div className="onboarding-tab-content">
        <h2 className="onboarding-tab-title">Add Links</h2>
        <p className="onboarding-tab-description">Add URLs to websites, articles, or any content you'd like to analyze</p>
        
        <form onSubmit={handleUrlSubmit} className="url-input-form">
          <div className="url-input-container">
            <input
              type="text"
              className="url-input"
              placeholder="Enter a URL (e.g., https://example.com)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <button type="submit" className="url-add-button">
              <PlusCircle size={18} />
            </button>
          </div>
        </form>
        
        {uploadedFiles.filter(file => file.type === 'url').length > 0 && (
          <div className="urls-list">
            <h3 className="urls-list-title">Added Links</h3>
            <div className="urls-list-items">
              {uploadedFiles
                .filter(file => file.type === 'url')
                .map((urlItem) => (
                  <div key={urlItem.id} className="url-item">
                    <Globe size={16} className="url-item-icon" />
                    <a href={urlItem.name} target="_blank" rel="noopener noreferrer" className="url-item-link">
                      {urlItem.name}
                    </a>
                    <button
                      className="url-item-remove"
                      onClick={() => setUploadedFiles(prev => prev.filter(f => f.id !== urlItem.id))}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))
              }
            </div>
          </div>
        )}
      </div>
    );
  };
  
  // Render content for the Files tab
  const renderFilesContent = () => {
    return (
      <div className="onboarding-tab-content">
        <h2 className="onboarding-tab-title">Upload Files</h2>
        <p className="onboarding-tab-description">Add documents, spreadsheets, images, or any other files you'd like to analyze</p>
        
        <div className="file-dropzone" onClick={triggerFileInput}>
          <div className="file-dropzone-icon">
            <Upload size={32} />
          </div>
          <p className="file-dropzone-text">Drag & drop files here or click to browse</p>
          <p className="file-dropzone-hint">Supported formats: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, etc.</p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
        </div>
        
        {uploadedFiles.filter(file => file.type !== 'url').length > 0 && (
          <div className="files-list-container">
            <h3 className="files-list-title">Uploaded Files</h3>
            <div className="files-list-items">
              {uploadedFiles
                .filter(file => file.type !== 'url')
                .map((file) => (
                  <div key={file.id} className="file-list-item">
                    <FileText size={16} className="file-list-item-icon" />
                    <div className="file-list-item-details">
                      <span className="file-list-item-name">{file.name}</span>
                      <span className="file-list-item-size">{formatFileSize(file.size)}</span>
                    </div>
                    <button
                      className="file-list-item-remove"
                      onClick={() => setUploadedFiles(prev => prev.filter(f => f.id !== file.id))}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))
              }
            </div>
          </div>
        )}
      </div>
    );
  };
  
  // Render content for the Connectors tab
  const renderConnectorsContent = () => {
    const availableConnectors = connectors.filter(c => c.status === 'available');
    const comingSoonConnectors = connectors.filter(c => c.status === 'coming-soon');

    return (
      <div className="onboarding-tab-content">
        <h2 className="onboarding-tab-title">Connect Your Apps</h2>
        <p className="onboarding-tab-description">Connect your favorite tools and services to get better insights</p>

        <div className="connectors-section">
          <h3 className="connectors-list-label">Available Connectors</h3>
          <div className="connectors-list-container">
            {availableConnectors.map((connector, index) => (
              <div
                key={connector.id}
                className="connector-list-item"
                style={{
                  borderBottom: index !== availableConnectors.length - 1 ? '1px solid var(--btn-border)' : 'none'
                }}
              >
                <div className="connector-list-left">
                  <div className="connector-list-icon">
                    {connector.icon}
                  </div>
                  <div className="connector-list-info">
                    <div className="connector-list-name">{connector.name}</div>
                    <div className="connector-list-description">{connector.description}</div>
                  </div>
                </div>
                <button
                  className={`connector-list-button ${connectedSources.has(connector.id) ? 'connected' : ''}`}
                  onClick={() => handleConnectorToggle(connector.id)}
                >
                  {connectedSources.has(connector.id) ? 'Connected' : 'Connect'}
                </button>
              </div>
            ))}
          </div>

          {comingSoonConnectors.length > 0 && (
            <>
              <h3 className="connectors-list-label" style={{ marginTop: 'var(--space-2xl)' }}>
                Coming Soon
              </h3>
              <div className="connectors-list-container">
                {comingSoonConnectors.map((connector, index) => (
                  <div
                    key={connector.id}
                    className="connector-list-item disabled"
                    style={{
                      borderBottom: index !== comingSoonConnectors.length - 1 ? '1px solid var(--btn-border)' : 'none'
                    }}
                  >
                    <div className="connector-list-left">
                      <div className="connector-list-icon">
                        {connector.icon}
                      </div>
                      <div className="connector-list-info">
                        <div className="connector-list-name">{connector.name}</div>
                        <div className="connector-list-description">{connector.description}</div>
                      </div>
                    </div>
                    <span className="connector-coming-soon-badge">Soon</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    );
  };
  
  // Render active tab content
  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'links':
        return renderLinksContent();
      case 'files':
        return renderFilesContent();
      case 'connectors':
        return renderConnectorsContent();
      default:
        return renderLinksContent();
    }
  };

  return (
    <div className="onboarding-overlay-new">
      <div className="onboarding-modal-new">
        {/* Header with close button */}
        <div className="onboarding-header-new">
          <h2>Add Sources</h2>
          <button className="onboarding-close-btn" onClick={handleSkip}>
            <X size={20} />
          </button>
        </div>

        {/* Main content with left nav and right content */}
        <div className="onboarding-body-new">
          {/* Left navigation */}
          <div className="onboarding-nav-new">
            {tabs.map(tab => (
              <button 
                key={tab.id}
                className={`onboarding-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="onboarding-nav-icon">{tab.icon}</span>
                <span className="onboarding-nav-label">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Right content */}
          <div className="onboarding-content-new">
            {renderActiveTabContent()}
          </div>
        </div>

        {/* Footer with continue button */}
        <div className="onboarding-footer-new">
          <button className="onboarding-finish-btn" onClick={handleFinish}>
            Finish Setup
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
