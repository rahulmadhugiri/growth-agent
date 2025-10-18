"use client";

import { useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function DataDeletion() {
  const { currentUser, loading } = useAuth();
  const router = useRouter();
  const appName = "Growth";
  const appNameOnInstagram = "Growth Instagram Connector";
  const supportEmail = "rahulmadhugiri@gmail.com";

  // Allow this page to be public - no redirect

  return (
    <div className="policy-container">
      <div className="policy-content">
        <h1>Data Deletion Instructions — {appName}</h1>
        
        <p className="instruction-intro">
          If you have authorized {appName} to access your Instagram account and wish 
          to delete your data, please follow these steps:
        </p>
        
        <section>
          <h2>Option 1: From Within the App</h2>
          <ol>
            <li>Log into your {appName} account.</li>
            <li>Navigate to Dashboard → Connectors.</li>
            <li>Find your Instagram connection and click "Disconnect Instagram".</li>
            <li>Your access token and all Instagram-related data (media, analytics, posting history) will be permanently deleted from our systems within 30 days.</li>
          </ol>
        </section>
        
        <section>
          <h2>Option 2: Manual Deletion Request</h2>
          <p>If you no longer have access to your account or wish to expedite deletion:</p>
          <ol>
            <li>Send an email to <a href={`mailto:${supportEmail}`}>{supportEmail}</a> with the subject line "Delete My Instagram Data".</li>
            <li>Include the Instagram username or email you used to connect your account.</li>
            <li>We will confirm deletion within 7 business days.</li>
          </ol>
        </section>
        
        <section>
          <h2>Option 3: Revoke Access from Instagram</h2>
          <p>You can also remove our app directly through Instagram:</p>
          <ol>
            <li>Open the Instagram mobile app.</li>
            <li>Go to Settings → Security → Apps and Websites.</li>
            <li>Select our app ({appNameOnInstagram}) and tap Remove.</li>
            <li>This will revoke our access immediately, and your data will be automatically deleted from our servers within 30 days.</li>
          </ol>
        </section>
        
        <section className="contact-section">
          <p>For further assistance, contact:</p>
          <p className="email-contact">
            📧 <a href={`mailto:${supportEmail}`}>{supportEmail}</a>
          </p>
        </section>
      </div>
    </div>
  );
}
