"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useSource } from "../contexts/SourcesContext";
import SplashPage from "../components/SplashPage";
import OnboardingFlow from "../components/OnboardingFlow";
import SettingsModal from "../components/SettingsModal";
import ThemeSwitcher from "../components/ThemeSwitcher";
import { Settings, LogOut, Bot, BarChart3, ArrowUp, Plus, Search, PanelLeft, Database, Plug, Grid2X2, Clock4, X  } from "lucide-react";
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
function AgentView({ message, setMessage, isLoading, onSubmit }) {
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
  const { sources, loading: sourcesLoading, removeSource, addLinkSource, uploadFileSource, getSourcesByType } = useSource();

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
                  <p>No {activeSourceTab} added yet.</p>
                  <p className="sources-empty-hint">Click "Add New Source" to get started.</p>
                </div>
              )}

              {/* Sources List */}
              {!sourcesLoading && filteredSources.length > 0 && (
                <div className="sources-list">
                  {filteredSources.map((source) => (
                    <div
                      key={source.id}
                      className="source-item"
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
                          onClick={() => handleDeleteSource(source.id)}
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
  const [activeTab, setActiveTab] = useState("agent");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const profileMenuRef = useRef(null);
  const profileBtnRef = useRef(null);
  const [dashboardSection, setDashboardSection] = useState("general"); // <-- add this

  
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      console.log("Agent query:", message);
      setIsLoading(true);
      
      // Simulate API call
      setTimeout(() => {
        setMessage("");
        setIsLoading(false);
      }, 2000);
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
            onSubmit={handleSubmit}
          />
        )}
        {activeTab === "dashboard" && <DashboardView activeSection={dashboardSection} onChangeSection={setDashboardSection} />}
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />
    </div>
  );
}