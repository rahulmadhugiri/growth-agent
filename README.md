# Growth Marketing Platform

A Next.js application that helps users create, manage, and analyze content for social media platforms using AI tools.

## Features

- Instagram integration with analytics and posting capabilities
- TikTok integration for video metrics and performance tracking
- OpenAI Sora integration for AI video generation
- Firebase authentication and database
- Next.js API routes for secure integrations
- Dark/light theme support

## Environment Setup

This application requires several environment variables to function properly. Create a `.env.local` file in the project root with the following variables:

### Firebase Configuration

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-app
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-app.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### Instagram API

```
INSTAGRAM_CLIENT_ID=your_instagram_client_id
INSTAGRAM_CLIENT_SECRET=your_instagram_client_secret
INSTAGRAM_REDIRECT_URI=https://yourdomain.com/api/auth/instagram/callback
```

### TikTok API

```
TIKTOK_CLIENT_KEY=your_tiktok_client_key
TIKTOK_CLIENT_SECRET=your_tiktok_client_secret
TIKTOK_REDIRECT_URI=https://yourdomain.com/api/auth/tiktok/callback
```

### OpenAI API

```
OPENAI_API_KEY=your_openai_api_key
OPENAI_SORA_BASE_URL=https://api.openai.com/v1
OPENAI_SORA_MODEL=sora-2
SORA_POLL_INTERVAL_MS=5000
SORA_MAX_POLL_ATTEMPTS=60
SORA_PORTRAIT_HINT=Please render the video in a vertical 9:16 portrait composition suitable for mobile.
```

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Deploying to Vercel

1. Push your code to GitHub
2. Create a new project in Vercel
3. Link your GitHub repository
4. Configure environment variables in Vercel project settings:
   - Go to Settings > Environment Variables
   - Add all the variables from your `.env.local` file
5. Deploy!

## Social Media API Setup

For detailed setup instructions:
- Instagram: See [INSTAGRAM_SETUP_INSTRUCTIONS.md](./INSTAGRAM_SETUP_INSTRUCTIONS.md)
- TikTok: See [TIKTOK_SETUP_INSTRUCTIONS.md](./TIKTOK_SETUP_INSTRUCTIONS.md)

## Policy Documents

These policy documents are required for Meta and TikTok app review:
- Privacy Policy: [/privacy-policy](/privacy-policy)
- Data Deletion Instructions: [/data-deletion](/data-deletion)

## License

MIT