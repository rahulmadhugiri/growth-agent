# TikTok API Integration Setup

This document explains how to set up TikTok API credentials for the Growth application's TikTok Connector.

## Prerequisites

1. A TikTok account
2. A TikTok Developer account
3. A TikTok for Developers app with required permissions

## Step 1: Create a TikTok Developer Account

1. Go to [TikTok for Developers](https://developers.tiktok.com/) and sign in or create an account
2. Once logged in, navigate to the Developer Portal Dashboard

## Step 2: Create a New App

1. In the Dashboard, click on **My Apps** in the top navigation
2. Click **Connect an App** button
3. Fill in your app details:
   - **App Name**: `Growth TikTok Connector` (or any name you prefer)
   - **App Description**: Provide a clear description of your app's purpose
   - **App Icon**: Upload an icon for your app
   - **App Domain**: Enter your application's domain
   - **Privacy Policy URL**: Enter your privacy policy URL
   - **Terms of Service URL**: Enter your terms of service URL
4. Click **Create** to create your app

## Step 3: Configure App Capabilities

1. In your app dashboard, navigate to the **Products** section
2. Add the **Login Kit** product to enable OAuth authentication
3. Configure the following settings:
   - **Redirect URI**: The URI where TikTok will send users after authorization
     - For local development: `http://localhost:3000/api/auth/tiktok/callback`
     - For production: `https://your-domain.com/api/auth/tiktok/callback`
   - **Scope**: Select the permissions your app needs:
     - `user.info.basic`: Basic user profile information
     - `video.list`: Access to user's videos
     - `video.upload`: (Optional) If you need to upload videos
4. Save your changes

## Step 4: Get App Credentials

1. Go to **App Settings** > **Basic Information**
2. Note down your **Client Key** (also known as Client ID)
3. Click **Show** to view your **Client Secret** and note it down

## Step 5: Configure Environment Variables

Add these variables to your `.env.local` file:

```
TIKTOK_CLIENT_KEY=your_client_key_here
TIKTOK_CLIENT_SECRET=your_client_secret_here
TIKTOK_REDIRECT_URI=http://localhost:3000/api/auth/tiktok/callback
```

For production deployment, set these in your hosting provider's environment variables.

## Step 6: Test Your Integration

1. Start your application
2. Navigate to the Connectors page
3. Click "Connect with TikTok"
4. You should be redirected to TikTok's authorization page
5. After granting permissions, you should be redirected back to your app with the TikTok data showing

## API Limitations

The TikTok API has several limitations to be aware of:

1. **Rate Limits**: The TikTok API enforces rate limits of 500 requests per app per day for most endpoints
2. **Access Tokens**: Access tokens expire after a certain period and need to be refreshed
3. **Permissions**: Some data may require additional permissions or a business TikTok account
4. **Content Restrictions**: TikTok's API has restrictions on accessing certain types of content

## Resources

- [TikTok for Developers Documentation](https://developers.tiktok.com/doc/login-kit-web)
- [TikTok Login Kit Guide](https://developers.tiktok.com/doc/login-kit-web)
- [TikTok API Reference](https://developers.tiktok.com/doc/tiktok-api-v2-reference-video-data)
- [TikTok Developer Terms of Service](https://developers.tiktok.com/terms)
