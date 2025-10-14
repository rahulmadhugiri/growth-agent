# Firebase Setup Instructions

Your authentication system has been implemented! Now you need to set up Firebase to make it work.

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter a project name (e.g., "growth-assistant")
4. Continue through the setup (you can disable Google Analytics for now)

## Step 2: Enable Authentication

1. In your Firebase project, go to "Authentication" in the sidebar
2. Click on the "Sign-in method" tab
3. Enable the following providers:
   - **Email/Password**: Click and toggle "Enable"
   - **Google**: Click, toggle "Enable", and add your domain to authorized domains

## Step 3: Register Your Web App

1. In Firebase project overview, click the web icon (</>) to add a web app
2. Enter an app nickname (e.g., "growth-web")
3. Click "Register app"
4. Copy the configuration object that looks like this:

```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};
```

## Step 4: Create Environment Variables

1. Create a file called `.env.local` in your project root (same folder as package.json)
2. Add the following content, replacing the values with your Firebase config:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key-here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id-here
```

## Step 5: Configure Authorized Domains

1. In Firebase Authentication > Settings
2. Under "Authorized domains", add:
   - `localhost` (for development)
   - Your production domain when you deploy

## Step 6: Test Your Setup

1. Restart your development server: `npm run dev`
2. Visit `http://localhost:3000`
3. You should see the splash page
4. Try signing up with email/password or Google
5. Complete the onboarding flow
6. You should then see your dashboard

## Features Implemented

✅ **Splash Page**: Beautiful landing page for unauthenticated users
✅ **Sign In/Sign Up**: Modal with email/password and Google authentication
✅ **Onboarding Flow**: Multi-step wizard with connectors and file upload
✅ **Authentication State Management**: Seamless transitions between states
✅ **Responsive Design**: Works on desktop and mobile
✅ **Modern UI**: Clean, professional styling

## What Happens Now

- **Unauthenticated users**: See the splash page with sign-in/sign-up options
- **First-time users**: Go through the onboarding flow to connect data sources
- **Returning users**: Go directly to your existing dashboard
- **Profile menu**: Updated with Firebase user info and working sign-out

The system automatically handles all authentication states and provides a smooth user experience from first visit to regular usage.

## Need Help?

If you run into any issues:

1. Check the browser console for error messages
2. Verify your `.env.local` file has the correct Firebase config
3. Make sure Authentication is enabled in Firebase Console
4. Ensure your domain is in the authorized domains list

Your AI-powered growth assistant is ready to help users connect their data and get insights!
