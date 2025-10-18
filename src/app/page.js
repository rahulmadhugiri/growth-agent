"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useSource } from "../contexts/SourcesContext";
import SplashPage from "../components/SplashPage";
import OnboardingFlow from "../components/OnboardingFlow";
import SettingsModal from "../components/SettingsModal";
import ThemeSwitcher from "../components/ThemeSwitcher";
import { Settings, LogOut, Bot, BarChart3, ArrowUp, Plus, Search, PanelLeft, Database, Plug, Grid2X2, Clock4, X, Inbox, Instagram, Video } from "lucide-react";
import { Line } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend,
  Filler
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Avatar component for profile
function Avatar({ name = "Guest", photoURL }) {
  const [imgOk, setImgOk] = useState(!!photoURL);
  const initial = (name?.trim()?.split(/\s+/)[0]?.[0] ?? "G").toUpperCase();
  const src = photoURL ? photoURL.replace(/=s\d+-c$/, "=s128-c") : undefined;
  return (
    <div className="profile-avatar" aria-label={`${name} avatar`}>
      {src && imgOk ? (
        <img className="profile-avatar-img" src={src} alt={name ?? "User avatar"} onError={() => setImgOk(false)} />
      ) : (
        <div className="profile-avatar-fallback" aria-hidden>{initial}</div>
      )}
    </div>
  );
}

// Agent View Component (Codex-style)
function AgentView({
  message,
  setMessage,
  isLoading,
  response,
  error,
  answerSources,
  metadata,
  onSubmit
}) {
  const textAreaRef = useRef(null);
  const tabsRef = useRef(null);
  const drawerTabsRef = useRef(null);
  const fileInputRef = useRef(null);
  const [activeTaskTab, setActiveTaskTab] = useState("tasks");
  const [selectedRepo, setSelectedRepo] = useState("Sources");
  const [selectedBranch, setSelectedBranch] = useState("Select a Branch");
  const [taskMultiplier, setTaskMultiplier] = useState("1x");
  const [showRepoDropdown, setShowRepoDropdown] = useState(false);
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);
  const [showMultiplierDropdown, setShowMultiplierDropdown] = useState(false);
  const [showSourcesDrawer, setShowSourcesDrawer] = useState(false);
  const [activeSourceTab, setActiveSourceTab] = useState("links");
  const [hoveredSourceId, setHoveredSourceId] = useState(null);
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [isAddingSource, setIsAddingSource] = useState(false);
  const [showAddLinkModal, setShowAddLinkModal] = useState(false);

  // Get sources from context
  const { loading: sourcesLoading, removeSource, addLinkSource, uploadFileSource, getSourcesByType } = useSource();

  const sourceTabs = [
    { id: 'links', label: 'Links' },
    { id: 'files', label: 'Files' },
    { id: 'connectors', label: 'Connectors' },
  ];

  // Get sources filtered by active tab
  const filteredSources = getSourcesByType(activeSourceTab);

  // Handlers for adding sources
  const handleAddLink = async (e) => {
    e?.preventDefault();
    if (!newLinkUrl.trim()) return;

    try {
      setIsAddingSource(true);
      await addLinkSource(newLinkUrl);
      setNewLinkUrl("");
      setShowAddLinkModal(false);
    } catch (error) {
      alert('Failed to add link: ' + error.message);
    } finally {
      setIsAddingSource(false);
    }
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    try {
      setIsAddingSource(true);
      for (const file of files) {
        await uploadFileSource(file);
      }
    } catch (error) {
      alert('Failed to upload file: ' + error.message);
    } finally {
      setIsAddingSource(false);
      if (event?.target) {
        event.target.value = '';
      }
    }
  };

  const handleDeleteSource = async (sourceId) => {
    if (!confirm('Are you sure you want to delete this source?')) return;

    try {
      await removeSource(sourceId);
    } catch (error) {
      alert('Failed to delete source: ' + error.message);
    }
  };

  const handleAddSourceClick = () => {
    if (activeSourceTab === 'files') {
      fileInputRef.current?.click();
    } else if (activeSourceTab === 'links') {
      setShowAddLinkModal(true);
    } else if (activeSourceTab === 'connectors') {
      alert('Connector integration coming soon!');
    }
  };

  const handleSourceClick = (source) => {
    let targetUrl = null;

    if (source.type === 'links' && source.url) {
      targetUrl = source.url;
    } else if (source.type === 'files' && source.fileUrl) {
      targetUrl = source.fileUrl;
    }

    if (!targetUrl) return;

    const resolvedUrl = /^https?:\/\//i.test(targetUrl)
      ? targetUrl
      : `https://${targetUrl}`;

    window.open(resolvedUrl, '_blank', 'noopener,noreferrer');
  };

  const tasks = [
  {
    id: 1,
    title: "Launch Teaser: 'Big Update Coming This Friday 👀'",
    platform: "Instagram",
    date: "Oct 13",
    repo: "Awaiting Approval"
  },
  {
    id: 2,
    title: "Re-engagement Email: 'We've Missed You — Come See What's New!'",
    platform: "Email",
    date: "Oct 13",
    repo: "Pending Review"
  }
  ];

  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = "auto";
      textAreaRef.current.style.height = Math.min(textAreaRef.current.scrollHeight, 200) + "px";
    }
  }, [message]);

  // Animate tab underline
  useEffect(() => {
    if (tabsRef.current) {
      const tabsContainer = tabsRef.current;
      const activeTab = tabsContainer.querySelector('.codex-tab.active');

      if (activeTab) {
        const { offsetLeft, offsetWidth } = activeTab;
        tabsContainer.style.setProperty('--tab-left', `${offsetLeft}px`);
        tabsContainer.style.setProperty('--tab-width', `${offsetWidth}px`);
      }
    }
  }, [activeTaskTab]);

  // Animate drawer tab indicator
  useEffect(() => {
    if (drawerTabsRef.current && showSourcesDrawer) {
      // Use setTimeout to ensure DOM is fully rendered
      setTimeout(() => {
        const tabsElement = drawerTabsRef.current;
        if (!tabsElement) return;

        const activeTab = tabsElement.querySelector('.sources-tab.active');
        const container = tabsElement.parentElement;

        if (activeTab && container) {
          // Get positions relative to the container with padding
          const containerRect = container.getBoundingClientRect();
          const tabRect = activeTab.getBoundingClientRect();

          const offsetLeft = tabRect.left - containerRect.left;
          const offsetWidth = tabRect.width;

          console.log('Setting tab indicator:', offsetLeft, offsetWidth);
          container.style.setProperty('--drawer-tab-left', `${offsetLeft}px`);
          container.style.setProperty('--drawer-tab-width', `${offsetWidth}px`);
        }
      }, 50);
    }
  }, [activeSourceTab, showSourcesDrawer]);

  // Close drawer on Escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") setShowSourcesDrawer(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  return (
    <div className="codex-agent-view">
      <div className="codex-center-content">
        {/* Task Input Area */}
        <div className="codex-task-input-wrapper">
          <div className="codex-task-input-container">
            <textarea
              ref={textAreaRef}
              className="codex-task-input"
              placeholder="Any updates?"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSubmit(e);
                }
              }}
              disabled={isLoading}
              rows={3}
            />

            {/* Bottom Controls */}
            <div className="codex-input-controls">
              {/* <button className="codex-control-btn add-context">
                <Plus size={16} />
              </button> */}

              <div className="codex-selectors">
                <div className="codex-dropdown-wrapper">
                  <button
                    className="codex-selector-btn"
                    onClick={() => setShowSourcesDrawer(true)}
                  >
                    <Database size={14} />
                    <span>Sources</span>
                  </button>
                </div>
              </div>

              <div className="codex-submit-group">
                <button
                  className={`codex-submit-btn ${isLoading ? "loading" : ""}`}
                  onClick={onSubmit}
                  disabled={!message.trim() || isLoading}
                >
                  {isLoading ? (
                    <div className="loading-spinner"></div>
                  ) : (
                    <ArrowUp size={16} strokeWidth={2} />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {(isLoading || response || error) && (
          <div className="agent-response-card" aria-live="polite">
            {isLoading ? (
              <div className="agent-response-loading">
                <div className="loading-spinner"></div>
                <span>Thinking...</span>
              </div>
            ) : error ? (
              <div className="agent-response-error">
                {error}
              </div>
            ) : (
              <>
                <div className="agent-response-text">{response}</div>
                {Array.isArray(answerSources) && answerSources.length > 0 && (
                  <div className="agent-response-sources">
                    <div className="agent-response-sources-title">Sources</div>
                    <ul>
                      {answerSources.slice(0, 3).map((item, index) => {
                        let hostLabel = 'Open source ↗';
                        if (item.url) {
                          try {
                            const urlObj = new URL(item.url);
                            hostLabel = `${urlObj.hostname.replace(/^www\./, '')} ↗`;
                          } catch (err) {
                            hostLabel = 'Open source ↗';
                          }
                        }
                        const typeLabel = item.type
                          ? item.type
                          : null;

                        return (
                          <li key={item.id || item.url || item.title || `source-${index}`}>
                            <span className="agent-response-source-label">
                              {item.title || 'Referenced chunk'}
                            </span>
                            {item.url && (
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {hostLabel}
                              </a>
                            )}
                            {typeLabel && (
                              <span className="agent-response-source-tag">
                                – {typeLabel}
                              </span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
                {metadata && (
                  <div className="agent-response-meta">
                    <span>
                      Built from {metadata.urls_touched ?? 0} pages
                      {Array.isArray(metadata.page_types) && metadata.page_types.length > 0 && (
                        <> across {metadata.page_types.length} content types ({metadata.page_types.join(', ')})</>
                      )}
                      {typeof metadata.unique_quotes === 'number' && metadata.unique_quotes > 0 && (
                        <> • {metadata.unique_quotes} unique quotes</>
                      )}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Task Tabs */}
        <div className="codex-tabs-container">
          <div className="codex-tabs" ref={tabsRef}>
            <button
              className={`codex-tab ${activeTaskTab === "tasks" ? "active" : ""}`}
              onClick={() => setActiveTaskTab("tasks")}
            >
              <span className="tab-indicator"></span>
              To Review
            </button>
            <button
              className={`codex-tab ${activeTaskTab === "code-reviews" ? "active" : ""}`}
              onClick={() => setActiveTaskTab("code-reviews")}
            >
              <span className="tab-indicator"></span>
              In Progress
            </button>
            <button
              className={`codex-tab ${activeTaskTab === "archive" ? "active" : ""}`}
              onClick={() => setActiveTaskTab("archive")}
            >
              Completed
            </button>
          </div>
        </div>

        {/* Task List */}
        <div className="codex-task-list">
          {tasks.map((task) => (
            <div key={task.id} className="codex-task-item">
              <div className="task-indicator"></div>
              <div className="task-content">
                <div className="task-title">{task.title}</div>
                <div className="task-meta">
                  <span>{task.date}</span>
                  <span className="task-separator">·</span>
                  <span>{task.repo}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sources Drawer */}
      {showSourcesDrawer && (
        <>
          {/* Overlay */}
          <div
            className="sources-overlay"
            onClick={() => setShowSourcesDrawer(false)}
          ></div>

          {/* Drawer */}
          <div className="sources-drawer">
            {/* Header with title and close button */}
            <div className="sources-drawer-header">
              <h2 className="sources-drawer-title">Sources</h2>
              <button
                className="sources-close-btn"
                onClick={() => setShowSourcesDrawer(false)}
                aria-label="Close drawer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Tabs with divider line and indicator */}
            <div className="sources-tabs-container">
              <div className="sources-tabs" ref={drawerTabsRef}>
                {sourceTabs.map((tab) => (
                  <button
                    key={tab.id}
                    className={`sources-tab ${activeSourceTab === tab.id ? "active" : ""}`}
                    onClick={() => setActiveSourceTab(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className="sources-tabs-divider"></div>
            </div>

            {/* Content */}
            <div className="sources-drawer-content">
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />

              {/* Add Source Button */}
              <button
                className="add-source-btn"
                onClick={handleAddSourceClick}
                disabled={isAddingSource}
              >
                <Plus size={16} />
                {isAddingSource ? 'Adding...' : 'Add New Source'}
              </button>

              {/* Loading State */}
              {sourcesLoading && (
                <div className="sources-loading">Loading sources...</div>
              )}

              {/* Empty State */}
              {!sourcesLoading && filteredSources.length === 0 && (
                <div className="sources-empty">
                  <div className="sources-empty-icon" aria-hidden>
                    <Inbox size={25} />
                  </div>
                  <p>No {activeSourceTab} added yet.</p>
                </div>
              )}

              {/* Sources List */}
              {!sourcesLoading && filteredSources.length > 0 && (
                <div className="sources-list">
                  {filteredSources.map((source) => (
                    <div
                      key={source.id}
                      className="source-item"
                      onClick={() => handleSourceClick(source)}
                      onMouseEnter={() => setHoveredSourceId(source.id)}
                      onMouseLeave={() => setHoveredSourceId(null)}
                    >
                      <div className="source-item-left">
                        <span className="source-icon">{source.icon}</span>
                        <span className="source-name">{source.name}</span>
                      </div>
                      {hoveredSourceId === source.id && (
                        <button
                          className="source-delete-btn"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleDeleteSource(source.id);
                          }}
                          aria-label={`Delete ${source.name}`}
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Add Link Modal */}
      {showAddLinkModal && (
        <>
          {/* Overlay */}
          <div
            className="sources-overlay"
            onClick={() => {
              setShowAddLinkModal(false);
              setNewLinkUrl("");
            }}
          ></div>

          {/* Modal */}
          <div className="add-link-modal">
            <div className="add-link-modal-header">
              <h3>Add Link</h3>
              <button
                className="sources-close-btn"
                onClick={() => {
                  setShowAddLinkModal(false);
                  setNewLinkUrl("");
                }}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddLink}>
              <div className="add-link-modal-body">
                <label htmlFor="link-url" className="add-link-label">
                  URL
                </label>
                <input
                  id="link-url"
                  type="text"
                  className="add-link-input"
                  placeholder="google.com or https://example.com"
                  value={newLinkUrl}
                  onChange={(e) => setNewLinkUrl(e.target.value)}
                  autoFocus
                  disabled={isAddingSource}
                />
                <p className="add-link-hint">
                  Enter any URL. We'll automatically add https:// if needed.
                </p>
              </div>

              <div className="add-link-modal-footer">
                <button
                  type="button"
                  className="add-link-cancel-btn"
                  onClick={() => {
                    setShowAddLinkModal(false);
                    setNewLinkUrl("");
                  }}
                  disabled={isAddingSource}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="add-link-submit-btn"
                  disabled={!newLinkUrl.trim() || isAddingSource}
                >
                  {isAddingSource ? 'Adding...' : 'Add Link'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}

function SoraView({
  prompt,
  setPrompt,
  isGenerating,
  videoUrl,
  error,
  isSaving,
  saveError,
  rawJob,
  onSubmit
}) {
  const textAreaRef = useRef(null);
  const [selectedDuration, setSelectedDuration] = useState(4);
  const availableDurations = [4, 8, 12]; // Sora API only accepts '4', '8', or '12'

  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = "auto";
      textAreaRef.current.style.height = Math.min(textAreaRef.current.scrollHeight, 200) + "px";
    }
  }, [prompt]);

  const handleSubmitWithDuration = (e) => {
    // Pass the selected duration to the parent handler
    onSubmit(e, selectedDuration);
  };

  return (
    <div className="codex-agent-view">
      <div className="codex-center-content">
        <div className="codex-task-input-wrapper">
          <div className="codex-task-input-container">
            <textarea
              ref={textAreaRef}
              className="codex-task-input"
              placeholder="Describe the video you want Sora to create..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmitWithDuration(e);
                }
              }}
              disabled={isGenerating}
              rows={3}
            />

            <div className="codex-input-controls">
              <div className="codex-selectors">
                <div className="sora-duration-selector">
                  <select 
                    value={selectedDuration}
                    onChange={(e) => setSelectedDuration(Number(e.target.value))}
                    className="sora-duration-dropdown"
                    disabled={isGenerating}
                  >
                    {availableDurations.map(duration => (
                      <option key={duration} value={duration}>
                        {duration} seconds
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="codex-submit-group">
                <button
                  className={`codex-submit-btn ${isGenerating ? "loading" : ""}`}
                  onClick={handleSubmitWithDuration}
                  disabled={!prompt.trim() || isGenerating}
                >
                  {isGenerating ? (
                    <div className="loading-spinner"></div>
                  ) : (
                    <ArrowUp size={16} strokeWidth={2} />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="sora-output-card" aria-live="polite">
          {isGenerating ? (
            <div className="agent-response-loading">
              <div className="loading-spinner"></div>
              <span>Generating video...</span>
            </div>
          ) : error ? (
            <div className="agent-response-error">
              {error}
            </div>
          ) : videoUrl ? (
            <div className="sora-video-wrapper">
              <video
                key={videoUrl}
                src={videoUrl}
                controls
                playsInline
                className="sora-video"
                poster=""
              />
              {isSaving && (
                <div className="sora-status-text">
                  Uploading to Sources…
                </div>
              )}
              {saveError && (
                <div className="sora-status-text error">
                  {saveError}
                </div>
              )}
            </div>
          ) : (
            <div className="sora-placeholder">
              <p>Describe a scene, and Sora will generate a 9:16 video for you.</p>
            </div>
          )}
          {(saveError || !videoUrl) && rawJob && (
            <details className="sora-operation-details">
              <summary>View job payload</summary>
              <pre>{JSON.stringify(rawJob, null, 2)}</pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}

function VeoView({
  prompt,
  setPrompt,
  isGenerating,
  videoUrl,
  error,
  isSaving,
  saveError,
  rawOperation,
  onSubmit
}) {
  const textAreaRef = useRef(null);

  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = "auto";
      textAreaRef.current.style.height = Math.min(textAreaRef.current.scrollHeight, 200) + "px";
    }
  }, [prompt]);

  return (
    <div className="codex-agent-view">
      <div className="codex-center-content">
        <div className="codex-task-input-wrapper">
          <div className="codex-task-input-container">
            <textarea
              ref={textAreaRef}
              className="codex-task-input"
              placeholder="Describe the video you want Veo to create..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSubmit(e);
                }
              }}
              disabled={isGenerating}
              rows={3}
            />

            <div className="codex-input-controls">
              <div className="codex-selectors" />
              <div className="codex-submit-group">
                <button
                  className={`codex-submit-btn ${isGenerating ? "loading" : ""}`}
                  onClick={onSubmit}
                  disabled={!prompt.trim() || isGenerating}
                >
                  {isGenerating ? (
                    <div className="loading-spinner"></div>
                  ) : (
                    <ArrowUp size={16} strokeWidth={2} />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="veo-output-card" aria-live="polite">
          {isGenerating ? (
            <div className="agent-response-loading">
              <div className="loading-spinner"></div>
              <span>Generating video...</span>
            </div>
          ) : error ? (
            <div className="agent-response-error">
              {error}
            </div>
          ) : videoUrl ? (
            <div className="veo-video-wrapper">
              <video
                key={videoUrl}
                src={videoUrl}
                controls
                playsInline
                className="veo-video"
                poster=""
              />
              {isSaving && (
                <div className="veo-status-text">
                  Uploading to Sources…
                </div>
              )}
              {saveError && (
                <div className="veo-status-text error">
                  {saveError}
                </div>
              )}
            </div>
          ) : (
            <div className="veo-placeholder">
              <p>Describe a scene, and Veo will generate a 9:16 video for you.</p>
            </div>
          )}
          {(saveError || !videoUrl) && rawOperation && (
            <details className="veo-operation-details">
              <summary>View operation payload</summary>
              <pre>{JSON.stringify(rawOperation, null, 2)}</pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}

// Dashboard View Component
function DashboardView({ activeSection, onChangeSection }) {
  const sidebarRef = useRef(null);
  const [activeTab, setActiveTab] = useState("agent");

  // Animate nav item sliding circle dot
  useEffect(() => {
    if (sidebarRef.current) {
      const activeNavItem = sidebarRef.current.querySelector('.nav-item.active');

      if (activeNavItem) {
        const { offsetTop, offsetHeight } = activeNavItem;
        const navCenter = offsetTop + (offsetHeight / 2);
        sidebarRef.current.style.setProperty('--nav-center', `${navCenter}px`);
      }
    }
  }, [activeSection]);

  const renderContent = () => {
    switch (activeSection) {
      case "general":
        return <GeneralView />;
      case "activity":
        return <ActivityView />;
      case "connectors":
        return <ConnectorsView />;
      case "settings":
        return <SettingsView />;
      default:
        return <GeneralView />;
    }
  };

    return (
    <div className="dashboard-container">
      <aside className="dashboard-sidebar" role="navigation">
        <div className="sidebar-content" ref={sidebarRef}>
          <button
            className={`nav-item ${activeSection === "general" ? "active" : ""}`}
            onClick={() => onChangeSection("general")}
          >
            <Grid2X2 size={20} />
            General
          </button>
          <button
            className={`nav-item ${activeSection === "activity" ? "active" : ""}`}
            onClick={() => onChangeSection("activity")}
          >
            <Clock4 size={20} />
            Activity
          </button>
          <button
            className={`nav-item ${activeSection === "connectors" ? "active" : ""}`}
            onClick={() => onChangeSection("connectors")}
          >
            <Plug size={20} />
            Connectors
          </button>
          <button
            className={`nav-item ${activeSection === "settings" ? "active" : ""}`}
            onClick={() => onChangeSection("settings")}
          >
            <Settings size={20} />
            Settings
          </button>
        </div>
      </aside>

      <main className="dashboard-main">
        {renderContent()}
      </main>
    </div>
  );
}

// General View
function GeneralView() {
  const stats = [
    { label: "Total Impressions", value: "102,763", change: "+13.2%", period: "Than last Month" },
    { label: "Total Engagement", value: "15,873", change: "+7.2%", period: "Than last Month" },
    { label: "Follower Growth", value: "9,238", change: "+50.7%", period: "Than last Month" },

  ];

  // Chart time periods
  const periods = ['1D', '5D', '1M', '6M', 'YTD', '1Y', '5Y', 'MAX'];
  const [activePeriod, setActivePeriod] = useState('1D');

  // Chart data for different time periods
  const chartData = {
    '1D': {
      labels: ['9AM', '10AM', '11AM', '12PM', '1PM', '2PM', '3PM', '4PM', '5PM'],
      datasets: [
        {
          label: 'Impressions',
          data: [5000, 5200, 5100, 5300, 5800, 6000, 5900, 6200, 6500],
          borderColor: '#2E7CB9',
          backgroundColor: 'rgba(46, 124, 185, 0.15)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 4,
        }
      ]
    },
    '5D': {
      labels: ['Sep 16', 'Sep 17', 'Sep 18', 'Sep 21', 'Sep 22'],
      datasets: [
        {
          label: 'Value',
          data: [400, 410, 405, 415, 430, 420, 425, 435, 425],
          borderColor: '#2E7CB9',
          backgroundColor: 'rgba(46, 124, 185, 0.15)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 4,
        }
      ]
    },
    '1M': {
      labels: Array.from({length: 30}, (_, i) => `Sep ${i+1}`).filter((_, i) => i % 3 === 0),
      datasets: [
        {
          label: 'Value',
          data: [400, 415, 410, 420, 430, 425, 415, 430, 435, 425],
          borderColor: '#2E7CB9',
          backgroundColor: 'rgba(46, 124, 185, 0.15)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 4,
        }
      ]
    },
    '6M': {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [
        {
          label: 'Impressions',
          data: [40000, 42500, 45000, 50000, 60000, 90000],
          borderColor: '#2E7CB9',
          backgroundColor: 'rgba(46, 124, 185, 0.15)',
          borderWidth: 2,
          fill: true,
          tension: 0.3,
          pointRadius: 0,
          pointHoverRadius: 4,
        },
        {
          label: 'Followers',
          data: [5000, 5500, 6000, 7000, 8000, 9000],
          borderColor: '#5AB9A4',
          backgroundColor: 'rgba(90, 185, 164, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.3,
          pointRadius: 0,
          pointHoverRadius: 4,
        }
      ]
    },
    'YTD': {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
      datasets: [
        {
          label: 'Value',
          data: [400, 405, 410, 415, 420, 430, 435, 440, 435, 420],
          borderColor: '#2E7CB9',
          backgroundColor: 'rgba(46, 124, 185, 0.15)',
          borderWidth: 2,
          fill: true,
          tension: 0.3,
          pointRadius: 0,
          pointHoverRadius: 4,
        }
      ]
    },
    '1Y': {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      datasets: [
        {
          label: 'Impressions',
          data: [30000, 35000, 40000, 45000, 50000, 60000, 70000, 75000, 80000, 85000, 90000, 95000],
          borderColor: '#2E7CB9',
          backgroundColor: 'rgba(46, 124, 185, 0.15)',
          borderWidth: 2,
          fill: true,
          tension: 0.3,
          pointRadius: 0,
          pointHoverRadius: 4,
        },
        {
          label: 'Followers',
          data: [3000, 3500, 4000, 4500, 5000, 6000, 7000, 7500, 8000, 8500, 9000, 9500],
          borderColor: '#5AB9A4',
          backgroundColor: 'rgba(90, 185, 164, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.3,
          pointRadius: 0,
          pointHoverRadius: 4,
        }
      ]
    },
    '5Y': {
      labels: ['2021', '2022', '2023', '2024', '2025'],
      datasets: [
        {
          label: 'Value',
          data: [260, 360, 200, 260, 400],
          borderColor: '#2E7CB9',
          backgroundColor: 'rgba(46, 124, 185, 0.15)',
          borderWidth: 2,
          fill: true,
          tension: 0.2,
          pointRadius: 0,
          pointHoverRadius: 4,
          segment: {
            borderColor: ctx => ctx.p0.parsed.y < 200 ? '#D93025' : '#2E7CB9',
          }
        }
      ]
    },
    'MAX': {
      labels: ['2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025'],
      datasets: [
        {
          label: 'Value',
          data: [380, 390, 400, 410, 405, 420, 430, 440, 445, 450, 430],
          borderColor: '#2E7CB9',
          backgroundColor: 'rgba(46, 124, 185, 0.15)',
          borderWidth: 2,
          fill: true,
          tension: 0.3,
          pointRadius: 0,
          pointHoverRadius: 4,
        }
      ]
    }
  };

  // Chart options
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: false
      }
    },
    layout: {
      padding: {
        top: 0,
        bottom: 0,
        left: 0,
        right: 0
      }
    },
    scales: {
      x: {
        border: {
          display: false
        },
        grid: {
          display: true,
          lineWidth: 0.5,
          drawBorder: false
        },
        ticks: {
          font: {
            size: 12,
            family: 'Inter, -apple-system, sans-serif',
          },
          padding: 8,
          color: '#999999',
          maxRotation: 0
        }
      },
      y: {
        border: {
          display: false
        },
        position: 'left',
        grid: {
          color: 'rgba(230, 230, 230, 0.2)',
          lineWidth: 0.5,
          drawBorder: false,
          drawTicks: false,
        },
        ticks: {
          font: {
            size: 12,
            family: 'Inter, -apple-system, sans-serif',
          },
          padding: 12,
          color: '#999999',
          callback: function(value) {
            if (activePeriod === '5Y') {
              return value;
            }
            
            // For the second image with values in thousands
            if (value >= 1000) {
              return value / 1000 + 'k';
            }
            return value;
          },
          maxTicksLimit: 6,
          align: 'center'
        },
        beginAtZero: activePeriod === '6M' || activePeriod === '1Y',
      }
    },
    interaction: {
      mode: 'index',
      intersect: false
    },
    elements: {
      point: {
        radius: 0,
        hitRadius: 10
      },
      line: {
        borderWidth: 2,
        tension: 0.2,
        capBezierPoints: true
      }
    }
  };

  return (
    <div className="dashboard-view">
      <div className="view-header">
        <h1>General</h1>
      </div>
      <p className="connectors-subtitle">
        Your agent at a glance
      </p>

      <div className="general-stats-row">
        {stats.map((stat, index) => (
          <div key={index} className="general-stat-card">
            <div className="general-stat-value">
              {stat.value}
            </div>
            <div className="general-stat-label">
              {stat.label}
            </div>
            {/* <div className="general-stat-change">
              {stat.change} {stat.period}
            </div> */}
          </div>
        ))}
      </div>

      <div className="general-chart-container">
        <div className="icon-text-wrapper">
          <BarChart3 className="icon"/>
          <p>Graph Data Coming</p>
        
        </div>
       
      </div>
    </div>
  );
}

// Activity View
function ActivityView() {
  const activityGroups = [
    {
      date: "Today October 14",
      activities: [
        {
          id: 1,
          title: "5 Social Media Posts Created",
          platform: "IG Reels",
          color: "#3468ff"
        },
        {
          id: 2,
          title: "Weekly Performance Report Generated",
          platform: "YouTube Shorts",
          color: "#3468ff"
        }
      ]
    },
    {
      date: "Friday October 10",
      activities: [
        {
          id: 3,
          title: "New Campaign Strategy Drafted",
          platform: "TikTok",
          color: "#3468ff"
        }
      ]
    },
    {
      date: "Tuesday October 7",
      activities: [
        {
          id: 4,
          title: "Competitor Analysis Completed",
          platform: "Instagram",
          color: "#3468ff"
        }
      ]
    }
  ];

  return (
    <div className="dashboard-view">
      <div className="view-header">
        <h1>Activity</h1>
      </div>
      <p className="connectors-subtitle">
        Track your latest actions and updates
      </p>

      <div className="activity-card">
        {activityGroups.map((group, groupIndex) => (
          <div key={groupIndex} className="activity-group">
            <div className="activity-date-header">{group.date}</div>
            <div className="activity-items-list">
              {group.activities.map((activity) => (
                <div
                  key={activity.id}
                  className="activity-item-notion"
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    console.log('Activity clicked:', activity.title);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      console.log('Activity clicked:', activity.title);
                    }
                  }}
                >
                  <div
                    className="activity-bar"
                    style={{ backgroundColor: activity.color }}
                  ></div>
                  <div className="activity-content">
                    <div className="activity-title">{activity.title}</div>
                    <div className="activity-time">{activity.platform}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Connectors View
function ConnectorsView() {
  const { currentUser } = useAuth();
  const { getSourcesByType, removeSource } = useSource();
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectError, setConnectError] = useState(null);
  const [instagramMetrics, setInstagramMetrics] = useState(null);
  const [recentPosts, setRecentPosts] = useState([]);
  const [showConnectionForm, setShowConnectionForm] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  
  // Check for URL params on component mount (for OAuth callback)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const success = urlParams.get('success');
    
    if (error) {
      setConnectError(decodeURIComponent(error));
    }
    
    if (success === 'true') {
      // Clear the URL params after successful connection
      window.history.replaceState({}, document.title, '/dashboard?section=connectors');
    }
  }, []);
  
  // Get existing Instagram connectors
  const instagramConnectors = getSourcesByType("connectors").filter(
    (connector) => connector.connectorId === "instagram"
  );
  
  const hasInstagramConnector = instagramConnectors.length > 0;
  
  // Effect to fetch Instagram data when a connector is present
  useEffect(() => {
    if (hasInstagramConnector && currentUser) {
      fetchRealInstagramData();
      setShowConnectionForm(false);
    } else {
      setShowConnectionForm(true);
      setInstagramMetrics(null);
      setRecentPosts([]);
    }
  }, [hasInstagramConnector, currentUser]);
  
  const handleConnectInstagram = async (e) => {
    e.preventDefault();
    setIsConnecting(true);
    setConnectError(null);
    
    try {
      // Start the real Instagram OAuth flow by getting the auth URL
      const response = await fetch('/api/auth/instagram');
      const data = await response.json();
      
      if (!data.authUrl) {
        throw new Error('Failed to get Instagram authorization URL');
      }
      
      // Add the current user ID to the state parameter
      const authUrlWithState = `${data.authUrl}&state=${currentUser.uid}`;
      
      // Redirect to Instagram for authorization
      window.location.href = authUrlWithState;
    } catch (error) {
      console.error("Instagram connection error:", error);
      setConnectError(error.message || "Failed to connect Instagram account");
      setIsConnecting(false);
    }
  };
  
  const fetchRealInstagramData = async () => {
    if (!currentUser || !hasInstagramConnector) return;
    
    setIsLoading(true);
    
    try {
      // Fetch profile data from our API endpoint
      const profileResponse = await fetch(`/api/instagram/profile?userId=${currentUser.uid}`);
      const profileData = await profileResponse.json();
      
      if (profileResponse.ok) {
        // Create metrics object with available data
        // Note: Basic Display API doesn't provide followers/following counts
        // We'll use placeholder values for those
        setInstagramMetrics({
          username: profileData.username,
          name: profileData.username,
          followers: '—', // Not available in Basic Display API
          following: '—', // Not available in Basic Display API
          posts: profileData.posts || 0,
          engagement: '—', // Cannot calculate without followers
          bio: profileData.bio || 'No bio available'
        });
      } else {
        console.error("Failed to fetch Instagram profile:", profileData.error);
      }
      
      // Fetch recent media
      const mediaResponse = await fetch(`/api/instagram/media?userId=${currentUser.uid}&limit=3`);
      const mediaData = await mediaResponse.json();
      
      if (mediaResponse.ok && mediaData.posts?.length) {
        // Format the posts data
        const formattedPosts = mediaData.posts.map(post => {
          // Format the date
          const postDate = new Date(post.timestamp);
          const now = new Date();
          const diffDays = Math.floor((now - postDate) / (1000 * 60 * 60 * 24));
          
          let dateText;
          if (diffDays === 0) {
            dateText = 'Today';
          } else if (diffDays === 1) {
            dateText = 'Yesterday';
          } else if (diffDays < 7) {
            dateText = `${diffDays} days ago`;
          } else if (diffDays < 30) {
            dateText = `${Math.floor(diffDays / 7)} weeks ago`;
          } else {
            dateText = `${Math.floor(diffDays / 30)} months ago`;
          }
          
          return {
            id: post.id,
            imageUrl: post.mediaUrl,
            likes: post.likes,
            comments: post.comments,
            caption: post.caption || '',
            date: dateText
          };
        });
        
        setRecentPosts(formattedPosts);
      } else {
        // If API failed or no posts, show a message
        setRecentPosts([]);
        console.error("Failed to fetch Instagram media:", mediaData.error);
      }
    } catch (error) {
      console.error("Error fetching Instagram data:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDisconnect = async () => {
    if (!hasInstagramConnector) return;
    
    if (confirm("Are you sure you want to disconnect your Instagram account?")) {
      try {
        await removeSource(instagramConnectors[0].id);
      } catch (error) {
        console.error("Error disconnecting Instagram:", error);
        alert("Failed to disconnect Instagram account");
      }
    }
  };
  
  return (
    <div className="dashboard-view">
      <div className="view-header">
        <h1>Connectors</h1>
      </div>
      <p className="connectors-subtitle">
        Connect your social media accounts to track performance metrics
      </p>
      
      <div className="connectors-container">
        {/* Instagram Connector */}
        <div className="connector-card instagram-connector">
          <div className="connector-header">
            <div className="connector-icon">
              <Instagram size={24} />
            </div>
            <h2>Instagram</h2>
            {hasInstagramConnector && (
              <div className="connector-connected-badge">
                Connected
              </div>
            )}
          </div>
          
          {showConnectionForm ? (
            <div className="connector-content">
              <p className="connector-description">
                Connect your Instagram account to track followers, engagement, and post performance.
              </p>
              
              <form className="connector-form" onSubmit={handleConnectInstagram}>
                <p className="connector-oauth-info">
                  Click below to authorize access to your Instagram account. You will be redirected to Instagram to complete the connection.
                </p>
                
                {connectError && (
                  <div className="connector-error">{connectError}</div>
                )}
                
                <button
                  type="submit"
                  className="connector-button"
                  disabled={isConnecting}
                >
                  {isConnecting ? "Connecting..." : "Connect with Instagram"}
                </button>
              </form>
            </div>
          ) : (
            <div className="connector-content">
              {instagramMetrics && (
                <>
                  <div className="instagram-profile">
                    <div className="instagram-profile-header">
                      <div className="instagram-avatar">
                        {instagramMetrics.username[0].toUpperCase()}
                      </div>
                      <div className="instagram-profile-info">
                        <h3>{instagramMetrics.username}</h3>
                        <p className="instagram-bio">{instagramMetrics.bio}</p>
                      </div>
                    </div>
                    
                    <div className="instagram-metrics">
                      <div className="instagram-metric">
                        <div className="instagram-metric-value">{instagramMetrics.followers.toLocaleString()}</div>
                        <div className="instagram-metric-label">Followers</div>
                      </div>
                      <div className="instagram-metric">
                        <div className="instagram-metric-value">{instagramMetrics.following.toLocaleString()}</div>
                        <div className="instagram-metric-label">Following</div>
                      </div>
                      <div className="instagram-metric">
                        <div className="instagram-metric-value">{instagramMetrics.posts.toLocaleString()}</div>
                        <div className="instagram-metric-label">Posts</div>
                      </div>
                      <div className="instagram-metric">
                        <div className="instagram-metric-value">{instagramMetrics.engagement}</div>
                        <div className="instagram-metric-label">Engagement</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="instagram-recent-posts">
                    <h3>Recent Posts</h3>
                    <div className="instagram-posts-grid">
                      {recentPosts.map(post => (
                        <div key={post.id} className="instagram-post">
                          <div className="instagram-post-image">
                            <img src={post.imageUrl} alt="Instagram post" />
                          </div>
                          <div className="instagram-post-info">
                            <div className="instagram-post-metrics">
                              <span className="instagram-post-likes">❤️ {post.likes.toLocaleString()}</span>
                              <span className="instagram-post-comments">💬 {post.comments.toLocaleString()}</span>
                            </div>
                            <div className="instagram-post-caption">{post.caption}</div>
                            <div className="instagram-post-date">{post.date}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="connector-actions">
                    <button
                      className="connector-disconnect-button"
                      onClick={handleDisconnect}
                    >
                      Disconnect Instagram
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
        
        {/* TikTok Connector */}
        <div className="connector-card tiktok-connector">
          <div className="connector-header">
            <div className="connector-icon tiktok-icon">
              <Video size={24} />
            </div>
            <h2>TikTok</h2>
            <TikTokConnector currentUser={currentUser} />
          </div>
        </div>
      </div>
    </div>
  );
}

// TikTok Connector Component
function TikTokConnector({ currentUser }) {
  const { getSourcesByType, removeSource } = useSource();
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectError, setConnectError] = useState(null);
  const [tiktokMetrics, setTiktokMetrics] = useState(null);
  const [tiktokVideos, setTiktokVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Get existing TikTok connectors
  const tiktokConnectors = getSourcesByType("connectors").filter(
    (connector) => connector.connectorId === "tiktok"
  );
  
  const hasTiktokConnector = tiktokConnectors.length > 0;
  
  // Effect to fetch TikTok data when a connector is present
  useEffect(() => {
    if (hasTiktokConnector && currentUser) {
      fetchTiktokData();
    } else {
      setTiktokMetrics(null);
      setTiktokVideos([]);
    }
  }, [hasTiktokConnector, currentUser]);
  
  // Check for URL params on component mount (for OAuth callback)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const success = urlParams.get('success');
    
    if (error) {
      setConnectError(decodeURIComponent(error));
    }
    
    if (success === 'true') {
      // Clear the URL params after successful connection
      window.history.replaceState({}, document.title, '/dashboard?section=connectors');
    }
  }, []);
  
  const handleConnectTikTok = async (e) => {
    e.preventDefault();
    setIsConnecting(true);
    setConnectError(null);
    
    try {
      // Start the TikTok OAuth flow by getting the auth URL
      const response = await fetch('/api/auth/tiktok');
      const data = await response.json();
      
      if (!data.authUrl) {
        throw new Error('Failed to get TikTok authorization URL');
      }
      
      // Add the current user ID to the state parameter
      // In a real app, you would encode this securely
      const authUrlWithState = `${data.authUrl}&state=${currentUser.uid}`;
      
      // Redirect to TikTok for authorization
      window.location.href = authUrlWithState;
    } catch (error) {
      console.error("TikTok connection error:", error);
      setConnectError(error.message || "Failed to connect TikTok account");
      setIsConnecting(false);
    }
  };
  
  const fetchTiktokData = async () => {
    if (!currentUser) return;
    
    setIsLoading(true);
    
    try {
      // Fetch profile data from our API endpoint
      const profileResponse = await fetch(`/api/tiktok/profile?userId=${currentUser.uid}`);
      const profileData = await profileResponse.json();
      
      if (profileResponse.ok) {
        // Create metrics object with available data
        setTiktokMetrics({
          username: profileData.displayName || profileData.username || 'TikTok User',
          avatarUrl: profileData.avatarUrl,
          profileUrl: profileData.profileUrl,
          isVerified: profileData.isVerified,
          followers: profileData.followers || 0,
          following: profileData.following || 0,
          likes: profileData.likes || 0
        });
      } else {
        console.error("Failed to fetch TikTok profile:", profileData.error);
      }
      
      // Fetch videos
      const videosResponse = await fetch(`/api/tiktok/videos?userId=${currentUser.uid}&limit=3`);
      const videosData = await videosResponse.json();
      
      if (videosResponse.ok && videosData.videos?.length) {
        setTiktokVideos(videosData.videos);
      } else {
        setTiktokVideos([]);
        console.error("Failed to fetch TikTok videos:", videosData.error);
      }
    } catch (error) {
      console.error("Error fetching TikTok data:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDisconnect = async () => {
    if (!hasTiktokConnector) return;
    
    if (confirm("Are you sure you want to disconnect your TikTok account?")) {
      try {
        await removeSource(tiktokConnectors[0].id);
      } catch (error) {
        console.error("Error disconnecting TikTok:", error);
        alert("Failed to disconnect TikTok account");
      }
    }
  };
  
  if (hasTiktokConnector) {
    return (
      <>
        <div className="connector-connected-badge">
          Connected
        </div>
        
        <div className="connector-content">
          {isLoading ? (
            <div className="connector-loading">Loading TikTok data...</div>
          ) : tiktokMetrics ? (
            <>
              <div className="tiktok-profile">
                <div className="tiktok-profile-header">
                  {tiktokMetrics.avatarUrl ? (
                    <img 
                      src={tiktokMetrics.avatarUrl} 
                      alt={tiktokMetrics.username} 
                      className="tiktok-avatar" 
                    />
                  ) : (
                    <div className="tiktok-avatar">
                      {tiktokMetrics.username[0].toUpperCase()}
                    </div>
                  )}
                  <div className="tiktok-profile-info">
                    <h3>
                      {tiktokMetrics.username}
                      {tiktokMetrics.isVerified && (
                        <span className="tiktok-verified-badge">✓</span>
                      )}
                    </h3>
                    {tiktokMetrics.profileUrl && (
                      <a 
                        href={tiktokMetrics.profileUrl} 
                        target="_blank"
                        rel="noopener noreferrer" 
                        className="tiktok-profile-link"
                      >
                        View Profile
                      </a>
                    )}
                  </div>
                </div>
                
                <div className="tiktok-metrics">
                  <div className="tiktok-metric">
                    <div className="tiktok-metric-value">{tiktokMetrics.followers.toLocaleString()}</div>
                    <div className="tiktok-metric-label">Followers</div>
                  </div>
                  <div className="tiktok-metric">
                    <div className="tiktok-metric-value">{tiktokMetrics.following.toLocaleString()}</div>
                    <div className="tiktok-metric-label">Following</div>
                  </div>
                  <div className="tiktok-metric">
                    <div className="tiktok-metric-value">{tiktokMetrics.likes.toLocaleString()}</div>
                    <div className="tiktok-metric-label">Likes</div>
                  </div>
                </div>
              </div>
              
              {tiktokVideos.length > 0 ? (
                <div className="tiktok-videos">
                  <h3>Recent Videos</h3>
                  <div className="tiktok-videos-grid">
                    {tiktokVideos.map(video => (
                      <div key={video.id} className="tiktok-video">
                        <div className="tiktok-video-thumbnail">
                          <img src={video.coverUrl} alt="TikTok video thumbnail" />
                          {video.duration && (
                            <span className="tiktok-video-duration">
                              {Math.floor(video.duration)}s
                            </span>
                          )}
                        </div>
                        <div className="tiktok-video-info">
                          <div className="tiktok-video-title">
                            {video.title || video.description || "TikTok Video"}
                          </div>
                          <div className="tiktok-video-stats">
                            <span className="tiktok-video-views">👁️ {video.stats.views.toLocaleString()}</span>
                            <span className="tiktok-video-likes">❤️ {video.stats.likes.toLocaleString()}</span>
                          </div>
                          {video.shareUrl && (
                            <a 
                              href={video.shareUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="tiktok-video-link"
                            >
                              Watch on TikTok
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="tiktok-no-videos">
                  <p>No videos found for this account.</p>
                </div>
              )}
              
              <div className="connector-actions">
                <button
                  className="connector-disconnect-button"
                  onClick={handleDisconnect}
                >
                  Disconnect TikTok
                </button>
              </div>
            </>
          ) : (
            <div className="connector-error">
              Failed to load TikTok data. Please try reconnecting your account.
            </div>
          )}
        </div>
      </>
    );
  }
  
  return (
    <div className="connector-content">
      <p className="connector-description">
        Connect your TikTok account to track followers, views, and video performance.
      </p>
      
      <form className="connector-form" onSubmit={handleConnectTikTok}>
        <p className="connector-oauth-info">
          Click below to authorize access to your TikTok account. You will be redirected to TikTok to complete the connection.
        </p>
        
        {connectError && (
          <div className="connector-error">{connectError}</div>
        )}
        
        <button
          type="submit"
          className="connector-button"
          disabled={isConnecting}
        >
          {isConnecting ? "Connecting..." : "Connect with TikTok"}
        </button>
      </form>
    </div>
  );
}

// Settings View
function SettingsView() {
  return (
    <div className="dashboard-view">
      <div className="view-header">
        <h1>Settings</h1>
      </div>
      <p className="connectors-subtitle">
        Manage your preferences and account details
      </p>

      {/* Profile Section */}
      <div className="settings-section-card">
        <div className="settings-field-row">
          <div className="settings-field-content">
            <div className="settings-field-label">
              Full name
            </div>
            <div className="settings-field-value">
              Rahul Madhugiri
            </div>
          </div>
          <button className="settings-field-button">
            Edit name
          </button>
        </div>

        <div className="settings-field-row">
          <div className="settings-field-content">
            <div className="settings-field-label">
              Email
            </div>
            <div className="settings-field-value">
              rahulmadhugiri@gmail.com
            </div>
          </div>
          <button className="settings-field-button">
            Update email
          </button>
        </div>

        <div className="settings-field-row">
          <div className="settings-field-content">
            <div className="settings-field-label">
              Subscription
            </div>
            <div className="settings-field-value">
              Manage your subscription
            </div>
          </div>
          <button className="settings-manage-button">
            Manage
          </button>
        </div>

        <div className="settings-field-row">
          <div className="settings-field-content">
            <div className="settings-field-label">
              Account created
            </div>
            <div className="settings-field-value">
              Oct 13, 2025
            </div>
          </div>
        </div>
      </div>

      {/* Notifications Section */}
      <div className="settings-section-card">
        <div className="settings-notification-row">
          <div className="settings-notification-info">
            <div className="settings-notification-title">
              Email Notifications
            </div>
            <div className="settings-notification-desc">
              Receive email updates about your account
            </div>
          </div>
          <label className="settings-toggle-label">
            <input type="checkbox" defaultChecked className="settings-toggle-input" />
            <span className="settings-toggle-slider">
              <span className="settings-toggle-knob"></span>
            </span>
          </label>
        </div>

        <div className="settings-notification-row">
          <div className="settings-notification-info">
            <div className="settings-notification-title">
              Weekly Reports
            </div>
            <div className="settings-notification-desc">
              Get weekly performance summaries
            </div>
          </div>
          <label className="settings-toggle-label">
            <input type="checkbox" defaultChecked className="settings-toggle-input" />
            <span className="settings-toggle-slider">
              <span className="settings-toggle-knob"></span>
            </span>
          </label>
        </div>
      </div>
      
      {/* Danger Zone */}
      <div className="settings-danger-card">
        <div className="settings-danger-row">
          <div className="settings-danger-content">
            <div className="settings-danger-title">
              Danger Zone
            </div>
            <div className="settings-danger-desc">
              Irreversible actions that affect your account
            </div>
          </div>
          <button className="settings-delete-button">
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}


export default function Home() {
  const { currentUser, logout, isFirstTimeUser, loading } = useAuth();
  const { uploadFileSource } = useSource();
  const [activeTab, setActiveTab] = useState("agent");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [agentResponse, setAgentResponse] = useState(null);
  const [agentSources, setAgentSources] = useState([]);
  const [agentError, setAgentError] = useState(null);
  const [agentMetadata, setAgentMetadata] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const profileMenuRef = useRef(null);
  const profileBtnRef = useRef(null);
  const [dashboardSection, setDashboardSection] = useState("general"); // <-- add this
  const [soraPrompt, setSoraPrompt] = useState("");
  const [isSoraGenerating, setIsSoraGenerating] = useState(false);
  const [soraVideoUrl, setSoraVideoUrl] = useState("");
  const [soraError, setSoraError] = useState(null);
  const [soraSaving, setSoraSaving] = useState(false);
  const [soraSaveError, setSoraSaveError] = useState(null);
  const [soraRawJob, setSoraRawJob] = useState(null);
  const [veoPrompt, setVeoPrompt] = useState("");
  const [isVeoGenerating, setIsVeoGenerating] = useState(false);
  const [veoVideoUrl, setVeoVideoUrl] = useState("");
  const [veoError, setVeoError] = useState(null);
  const [veoSaving, setVeoSaving] = useState(false);
  const [veoSaveError, setVeoSaveError] = useState(null);
  const [veoRawOperation, setVeoRawOperation] = useState(null);

  
  // Close profile menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (showProfileMenu && 
          profileMenuRef.current && 
          !profileMenuRef.current.contains(event.target) &&
          !profileBtnRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileMenu]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // Show splash page if not authenticated
  if (!currentUser) {
    return <SplashPage />;
  }

  // Show onboarding for first-time users
  if (isFirstTimeUser) {
    return <OnboardingFlow />;
  }

  // User info from Firebase
  const userName = currentUser.displayName || currentUser.email?.split('@')[0] || "User";
  const userPhotoURL = currentUser.photoURL;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) return;

    const detectAnalysisMode = (input) => {
      const lower = input.toLowerCase();

      if (
        lower.startsWith('/discover') ||
        lower.includes('prompt 1') ||
        (lower.includes('summarize') &&
          lower.includes('main topics') &&
          lower.includes('core themes'))
      ) {
        return 'discover';
      }

      if (
        lower.startsWith('/value') ||
        lower.includes('prompt 2') ||
        (lower.includes('value') &&
          lower.includes('differentiation') &&
          (lower.includes('positioning') || lower.includes('emotional appeal')))
      ) {
        return 'value';
      }

      if (
        lower.startsWith('/story') ||
        lower.includes('prompt 3') ||
        lower.includes('craft a concise narrative') ||
        (lower.includes('campaign summary') && lower.includes('quotes')) ||
        lower.includes('concise narrative or campaign summary')
      ) {
        return 'story';
      }

      return null;
    };

    const DEFAULT_ANALYSIS_PROMPTS = {
      discover:
        "Without assuming any prior knowledge, analyze this content and summarize what it's about. Identify the main topics, recurring ideas, core themes, and the most common content types.",
      value:
        'Extract sentences or passages that express value, differentiation, or emotional appeal. Highlight product positioning, problems solved, outcomes, and summarize the strongest positioning angles.',
      story:
        "Using only this dataset, craft a concise narrative that explains who it's for, what it does, why it matters, and what makes it unique. Include 3–5 short quotes suitable for marketing copy."
    };

    const mode = detectAnalysisMode(trimmed);
    let endpoint = '/api/agent/query';
    let requestBody = { question: trimmed };

    if (mode) {
      endpoint = '/api/agent/analyze';

      if (trimmed.startsWith('/')) {
        const parts = trimmed.slice(1).split(/\s+/);
        parts.shift();
        const remainder = parts.join(' ').trim();
        requestBody = {
          mode,
          question: remainder || DEFAULT_ANALYSIS_PROMPTS[mode]
        };
      } else {
        requestBody = {
          mode,
          question: trimmed
        };
      }
    }

    setIsLoading(true);
    setAgentError(null);
    setAgentResponse(null);
    setAgentSources([]);
    setAgentMetadata(null);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      let data = null;
      try {
        data = await response.json();
      } catch {
        // ignore JSON parse errors; handled below
      }

      if (!response.ok || !data) {
        const message =
          data?.error ||
          'Unable to generate an answer right now. Please try again.';
        throw new Error(message);
      }

      setAgentResponse(data.answer || data.summary || 'No answer returned.');
      setAgentSources(Array.isArray(data.sources) ? data.sources : []);
      setAgentMetadata(data.metadata || null);
      setMessage("");
    } catch (error) {
      console.error("Agent query failed:", error);
      setAgentError(
        error?.message ||
          'Something went wrong while generating an answer. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSoraSubmit = async (e, duration = 4) => {
    e.preventDefault?.();
    const trimmed = soraPrompt.trim();
    if (!trimmed) return;

    setIsSoraGenerating(true);
    setSoraError(null);
    setSoraVideoUrl("");
    setSoraSaveError(null);
    setSoraRawJob(null);
    setSoraSaving(false);

    try {
      const response = await fetch('/api/sora/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          prompt: trimmed,
          duration: duration 
        })
      });

      let data = null;
      try {
        data = await response.json();
      } catch {
        // ignore
      }

      if (!response.ok || !data) {
        const message =
          data?.error ||
          'Unable to generate a video right now. Please try again.';
        throw new Error(message);
      }

      setSoraPrompt("");
      setSoraRawJob(data.rawJob || null);
      setIsSoraGenerating(false);

      if (data.videoUrl) {
        const playableUrl = data.videoUrl;
        setSoraSaving(true);

        (async () => {
          try {
            const proxyUrl = `/api/sora/download?url=${encodeURIComponent(playableUrl)}`;
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 60000);
            const downloadResponse = await fetch(proxyUrl, {
              signal: controller.signal
            });
            clearTimeout(timeout);

            if (!downloadResponse.ok) {
              throw new Error('Failed to download generated video for display.');
            }

            const blob = await downloadResponse.blob();
            
            // Create a local blob URL for immediate display
            const localBlobUrl = URL.createObjectURL(blob);
            setSoraVideoUrl(localBlobUrl);
            
            // Upload to Firebase in the background
            const extension =
              (blob.type && blob.type.split('/')[1]) || 'mp4';
            const cleanedExt = extension.replace(/[^a-z0-9]/gi, '') || 'mp4';
            const fileName = `sora-video-${Date.now()}.${cleanedExt}`;
            const file = new File([blob], fileName, {
              type: blob.type || 'video/mp4'
            });
            const uploadResult = await uploadFileSource(file);

            if (uploadResult?.fileUrl) {
              // Clean up the blob URL and use the Firebase URL
              URL.revokeObjectURL(localBlobUrl);
              setSoraVideoUrl(uploadResult.fileUrl);
            } else {
              setSoraSaveError(
                'Uploaded video to Firebase sources, but no download URL was returned. Using local preview.'
              );
            }
          } catch (error) {
            console.error('Failed to process Sora video:', error);
            setSoraSaveError(
              error?.message ||
                'Failed to download or upload the generated video.'
            );
          } finally {
            setSoraSaving(false);
          }
        })();
      } else {
        setSoraError(
          'Sora finished but did not provide a downloadable URL. See job details below.'
        );
      }
    } catch (error) {
      console.error("Sora generation failed:", error);
      setSoraError(
        error?.message ||
          'Something went wrong while generating your video. Please try again.'
      );
      setIsSoraGenerating(false);
      setSoraSaving(false);
    }
  };

  const handleVeoSubmit = async (e) => {
    e.preventDefault?.();
    const trimmed = veoPrompt.trim();
    if (!trimmed) return;

    setIsVeoGenerating(true);
    setVeoError(null);
    setVeoVideoUrl("");
    setVeoSaveError(null);
    setVeoRawOperation(null);

    try {
      const response = await fetch('/api/veo/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt: trimmed })
      });

      let data = null;
      try {
        data = await response.json();
      } catch {
        // ignore
      }

      if (!response.ok || !data) {
        const message =
          data?.error ||
          'Unable to generate a video right now. Please try again.';
        throw new Error(message);
      }

      setVeoPrompt("");
      setVeoRawOperation(data.rawOperation || null);

      setIsVeoGenerating(false);

      if (data.videoUrl) {
        const playableUrl = data.videoUrl;
        setVeoVideoUrl(playableUrl);
        setVeoSaving(true);

        (async () => {
          try {
            const proxyUrl = `/api/veo/download?url=${encodeURIComponent(playableUrl)}`;
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 60000);
            const downloadResponse = await fetch(proxyUrl, {
              signal: controller.signal
            });
            clearTimeout(timeout);

            if (!downloadResponse.ok) {
              throw new Error('Failed to download generated video for storage.');
            }

            const blob = await downloadResponse.blob();
            const extension =
              (blob.type && blob.type.split('/')[1]) || 'mp4';
            const cleanedExt = extension.replace(/[^a-z0-9]/gi, '') || 'mp4';
            const fileName = `veo-video-${Date.now()}.${cleanedExt}`;
            const file = new File([blob], fileName, {
              type: blob.type || 'video/mp4'
            });
            const uploadResult = await uploadFileSource(file);

            if (uploadResult?.fileUrl) {
              setVeoVideoUrl(uploadResult.fileUrl);
            } else {
              setVeoSaveError(
                'Uploaded video to Firebase sources, but no download URL was returned. Using generated URL instead.'
              );
            }
          } catch (error) {
            console.error('Failed to upload Veo video to Firebase:', error);
            setVeoSaveError(
              error?.message ||
                'Failed to upload the generated video to your sources.'
            );
          } finally {
            setVeoSaving(false);
          }
        })();
      } else {
        setVeoError(
          'Veo finished but did not provide a downloadable URL. See operation details below.'
        );
      }
    } catch (error) {
      console.error("Veo generation failed:", error);
      setVeoError(
        error?.message ||
          'Something went wrong while generating your video. Please try again.'
      );
      setIsVeoGenerating(false);
      setVeoSaving(false);
    } finally {
      // upload handled asynchronously
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
      setShowProfileMenu(false);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

const handleSettings = () => {
  setActiveTab("dashboard");          // switch to Dashboard tab
  setDashboardSection("settings");    // switch to Settings section inside it
  setShowProfileMenu(false);
};

  return (
    <div className="cursor-app">
      {/* Top Navigation */}
      <nav className="top-nav">
        <div className="nav-center">
          <div className="nav-tabs">
            <button 
              className={`nav-tab ${activeTab === "agent" ? "active" : ""}`}
              onClick={() => setActiveTab("agent")}
            >
              Agent
            </button>
            <button 
              className={`nav-tab ${activeTab === "dashboard" ? "active" : ""}`}
              onClick={() => setActiveTab("dashboard")}
            >
              Dashboard
            </button>
            <button
              className={`nav-tab ${activeTab === "sora" ? "active" : ""}`}
              onClick={() => setActiveTab("sora")}
            >
              Sora
            </button>
            <button
              className={`nav-tab ${activeTab === "veo" ? "active" : ""}`}
              onClick={() => setActiveTab("veo")}
            >
              Veo
            </button>
          </div>
        </div>

        <div className="nav-right">
          <button 
            ref={profileBtnRef}
            className="profile-button"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            aria-label="Profile menu"
          >
            <Avatar name={userName} photoURL={userPhotoURL} />
          </button>

          {/* Profile Menu */}
          {showProfileMenu && (
            <div ref={profileMenuRef} className="profile-menu">
              <div className="profile-menu-header">
                <Avatar name={userName} photoURL={userPhotoURL} />
                <div className="profile-info">
                  <div className="profile-name">{userName}</div>
                  <div className="profile-plan">Free Plan</div>
                </div>
              </div>
              <div className="profile-menu-separator"></div>
              <ThemeSwitcher />
              <div className="profile-menu-separator"></div>
              <button className="profile-menu-item" onClick={handleSettings}>
                <Settings size={16} />
                Settings
              </button>
              <button className="profile-menu-item danger" onClick={handleSignOut}>
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="main-area">
        {activeTab === "agent" && (
          <AgentView
            message={message}
            setMessage={setMessage}
            isLoading={isLoading}
            response={agentResponse}
            error={agentError}
            answerSources={agentSources}
            metadata={agentMetadata}
            onSubmit={handleSubmit}
          />
        )}
        {activeTab === "dashboard" && <DashboardView activeSection={dashboardSection} onChangeSection={setDashboardSection} />}
        {activeTab === "sora" && (
          <SoraView
            prompt={soraPrompt}
            setPrompt={setSoraPrompt}
            isGenerating={isSoraGenerating}
            videoUrl={soraVideoUrl}
            error={soraError}
            isSaving={soraSaving}
            saveError={soraSaveError}
            rawJob={soraRawJob}
            onSubmit={handleSoraSubmit}
          />
        )}
        {activeTab === "veo" && (
          <VeoView
            prompt={veoPrompt}
            setPrompt={setVeoPrompt}
            isGenerating={isVeoGenerating}
            videoUrl={veoVideoUrl}
            error={veoError}
            isSaving={veoSaving}
            saveError={veoSaveError}
            rawOperation={veoRawOperation}
            onSubmit={handleVeoSubmit}
          />
        )}
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />
    </div>
  );
}
