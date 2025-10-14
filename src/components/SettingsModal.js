"use client";

import { useState } from 'react';
import { X, User, PaintBucket, SquareMousePointer, Settings2, Database, Languages } from 'lucide-react';

const sections = [
  { key: "account", label: "Account", icon: User },
  { key: "appearance", label: "Appearance", icon: PaintBucket },
  { key: "behavior", label: "Behavior", icon: SquareMousePointer },
  { key: "customize", label: "Customize", icon: Settings2 },
  { key: "data", label: "Data Controls", icon: Database },
];

export default function SettingsModal({ isOpen, onClose }) {
  const [activeSection, setActiveSection] = useState("account");

  if (!isOpen) return null;

  return (
    <div className="settings-modal-overlay">
      <div className="settings-modal">
        {/* Header */}
        <div className="settings-modal-header">
          <h2 className="settings-modal-title">Settings</h2>
          <button
            className="settings-modal-close"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body with Sidebar + Content */}
        <div className="settings-modal-body">
          {/* Sidebar Navigation */}
          <aside className="settings-sidebar">
            {sections.map(({ key, label, icon: Icon }) => {
              const isActive = activeSection === key;
              return (
                <button
                  key={key}
                  onClick={() => setActiveSection(key)}
                  className={`settings-nav-item ${isActive ? 'active' : ''}`}
                >
                  <Icon size={18} />
                  <span>{label}</span>
                </button>
              );
            })}
          </aside>

          {/* Content Panel */}
          <section className="settings-content">
            {activeSection === "account" && <AccountPanel />}
            {activeSection === "appearance" && <PlaceholderPanel title="Appearance" />}
            {activeSection === "behavior" && <PlaceholderPanel title="Behavior" />}
            {activeSection === "customize" && <PlaceholderPanel title="Customize" />}
            {activeSection === "data" && <PlaceholderPanel title="Data Controls" />}
          </section>
        </div>
      </div>
    </div>
  );
}

/* Helper Components */
function Divider() {
  return <div className="settings-divider" />;
}

function SettingsRow({ children, action, id }) {
  return (
    <div className="settings-row" id={id}>
      <div className="settings-row-content">
        {children}
      </div>
      <div className="settings-row-action">
        {action}
      </div>
    </div>
  );
}

/* Account Panel */
function AccountPanel() {
  return (
    <div className="settings-panel">
      {/* Profile Row */}
      <SettingsRow
        id="profile-row"
        action={
          <button className="settings-action-btn">Manage</button>
        }
      >
        <div className="settings-profile">
          <div className="settings-avatar">
            <img
              alt="Profile"
              src="https://assets.grok.com/users/130f564c-ea9a-4b5b-ba55-342b92358dcf/blLtmT2qnPj1ip73-profile-picture.webp"
            />
          </div>
          <div className="settings-profile-info">
            <div className="settings-profile-name">Rahul Madhugiri</div>
            <div className="settings-profile-email">rahulmadhugiri@gmail.com</div>
          </div>
        </div>
      </SettingsRow>

      <Divider />

      {/* SuperGrok Upsell */}
      <SettingsRow
        id="supergrok-row"
        action={
          <button className="settings-action-btn">Upgrade</button>
        }
      >
        <div className="settings-feature-row">
          <div className="settings-feature-icon">
            <svg width="35" height="33" viewBox="0 0 35 33" className="settings-icon-svg">
              <path d="M13.2371 21.0407L24.3186 12.8506..." fill="currentColor" />
            </svg>
          </div>
          <div className="settings-feature-label">Get SuperGrok</div>
        </div>
      </SettingsRow>

      {/* X Account Connect */}
      <SettingsRow
        id="x-account-row"
        action={
          <button className="settings-action-btn">Connect</button>
        }
      >
        <div className="settings-feature-row">
          <div className="settings-feature-icon">𝕏</div>
          <div className="settings-feature-label">𝕏 Account</div>
          <button
            className="settings-refresh-btn"
            aria-label="Refresh X subscription status"
          >
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path d="M4 20V15H4.31241M4.31241 15H9..." stroke="currentColor" fill="none" strokeWidth="2" />
            </svg>
          </button>
        </div>
      </SettingsRow>

      <Divider />

      {/* Language Row */}
      <SettingsRow
        id="language-row"
        action={
          <button className="settings-action-btn">Change</button>
        }
      >
        <div className="settings-feature-row">
          <span className="settings-feature-label">Language</span>
          <Languages size={16} className="settings-icon-secondary" />
        </div>
      </SettingsRow>

      {/* Footer */}
      <div className="settings-footer">
        <div className="settings-user-id">
          130f564c-ea9a-4b5b-ba55-342b92358dcf
        </div>

        <button className="settings-upgrade-card">
          <div className="settings-upgrade-gradient" />
          <div className="settings-upgrade-text">
            Upgrade to unlock more features
          </div>
        </button>
      </div>
    </div>
  );
}

/* Placeholder Panel */
function PlaceholderPanel({ title }) {
  return (
    <div className="settings-panel">
      <div className="settings-placeholder-text">
        Configure {title} settings here.
      </div>
      <Divider />
      <div className="settings-placeholder-subtext">
        Add rows like in the Account panel for consistent visuals.
      </div>
    </div>
  );
}
