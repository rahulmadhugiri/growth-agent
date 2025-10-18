# Instagram API Integration Setup

This document explains how to set up Instagram API credentials for the Growth application's Instagram Connector.

## Prerequisites

1. A Facebook Developer Account
2. An Instagram Business or Creator Account (for full analytics access)
3. A Meta App with Instagram Basic Display API enabled

## Step 1: Create a Meta Developer Account

1. Go to [Facebook for Developers](https://developers.facebook.com/) and sign in or create an account
2. Make sure your account is verified (you may need to add a phone number or payment method)

## Step 2: Create a New App

1. Go to [My Apps](https://developers.facebook.com/apps/)
2. Click **Create App**
3. Select **Business** as the app type
4. Fill in your app details:
   - App Name: `Growth Instagram Connector` (or any name you prefer)
   - App Contact Email: Your email address
   - Business Account: Select your business account or create one
5. Click **Create App**

## Step 3: Add Instagram Basic Display to Your App

1. From your app dashboard, find **Add Products to Your App**
2. Find **Instagram Basic Display** and click **Set Up**
3. In the Instagram Basic Display settings page:
   - Scroll to **User Token Generator** and click **Add or Remove Instagram Testers**
   - Add your Instagram account as a tester and accept the invitation from your Instagram account

## Step 4: Configure App Settings

1. Go to **App Settings** > **Basic**
2. Scroll down to find your **App ID** and **App Secret** (you'll need these for environment variables)
3. Go back to **Instagram Basic Display**
4. Add your OAuth Redirect URI:
   - For local development: `http://localhost:3000/api/auth/instagram/callback`
   - For production: `https://your-domain.com/api/auth/instagram/callback`
5. Save changes

## Step 5: Configure Environment Variables

Add these variables to your `.env.local` file:

```
INSTAGRAM_CLIENT_ID=your_app_id_here
INSTAGRAM_CLIENT_SECRET=your_app_secret_here
INSTAGRAM_REDIRECT_URI=http://localhost:3000/api/auth/instagram/callback
```

For production deployment, set these in your hosting provider's environment variables.

## Step 6: API Limitations

The Instagram Basic Display API has several limitations:

1. Only provides access to basic profile information and media
2. Does not provide follower counts, following counts, or engagement metrics
3. Limited to 25 requests per user per hour
4. Requires individual user authentication (cannot access data for accounts you don't own)

For more advanced metrics and analytics, you would need to upgrade to a Business Account and use the Instagram Graph API, which requires additional app review by Meta.

## Resources

- [Instagram Basic Display API Documentation](https://developers.facebook.com/docs/instagram-basic-display-api)
- [Meta for Developers Platform Policy](https://developers.facebook.com/devpolicy/)
- [Instagram Graph API Documentation](https://developers.facebook.com/docs/instagram-api) (for advanced usage)
