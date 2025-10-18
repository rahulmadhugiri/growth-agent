"use client";

import { useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function PrivacyPolicy() {
  const { currentUser, loading } = useAuth();
  const router = useRouter();
  const appName = "Growth";
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const supportEmail = "rahulmadhugiri@gmail.com";

  // Allow this page to be public - no redirect

  return (
    <div className="policy-container">
      <div className="policy-content">
        <h1>Privacy Policy — {appName}</h1>
        <p className="last-updated">Last updated: {currentDate}</p>
        
        <section>
          <h2>1. Introduction</h2>
          <p>
            {appName} ("we," "us," "our") provides an AI-powered marketing automation 
            platform that helps users create, manage, and publish content to social media. 
            This Privacy Policy explains how we collect, use, and protect information 
            obtained through our integration with Meta products (Instagram, Facebook) 
            and our website.
          </p>
        </section>
        
        <section>
          <h2>2. Information We Collect</h2>
          <p>When you connect your Instagram account through our app, we may collect the following:</p>
          <ul>
            <li>Your Instagram User ID, username, and profile information (name, profile picture)</li>
            <li>Access tokens required to post or retrieve analytics from your account</li>
            <li>Basic usage information about your interaction with our app (e.g., time of connection, generated posts)</li>
          </ul>
          <p>We do not collect your password or direct messages.</p>
        </section>
        
        <section>
          <h2>3. How We Use Your Information</h2>
          <p>We use the collected information to:</p>
          <ul>
            <li>Authenticate your Instagram connection</li>
            <li>Generate, schedule, or post content on your behalf (with your consent)</li>
            <li>Analyze engagement metrics to improve your experience</li>
            <li>Maintain secure API communication with Meta's servers</li>
          </ul>
          <p>We do not sell, rent, or share your data with third parties for advertising purposes.</p>
        </section>
        
        <section>
          <h2>4. Data Retention</h2>
          <p>
            We store Instagram tokens and associated metadata securely in our database for as 
            long as your account is connected.
          </p>
          <p>
            If you disconnect your Instagram account or delete your profile, your tokens and 
            related data are permanently deleted within 30 days.
          </p>
        </section>
        
        <section>
          <h2>5. Data Security</h2>
          <p>
            We use encryption and restricted access to protect your credentials and tokens. 
            All connections to Meta APIs occur over HTTPS and follow Meta's Platform Policy.
          </p>
        </section>
        
        <section>
          <h2>6. Your Rights</h2>
          <p>You can:</p>
          <ul>
            <li>Request deletion of your data at any time (see <a href="/data-deletion">Data Deletion Instructions</a>)</li>
            <li>Disconnect your Instagram account directly through our dashboard or by emailing us</li>
          </ul>
        </section>
        
        <section>
          <h2>7. Contact</h2>
          <p>
            If you have questions about this Privacy Policy or how your data is handled, contact us at:
          </p>
          <p className="email-contact">
            📧 <a href={`mailto:${supportEmail}`}>{supportEmail}</a>
          </p>
        </section>
      </div>
    </div>
  );
}
