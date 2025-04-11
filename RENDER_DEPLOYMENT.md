# Deploying the Backend to Render

This document provides instructions for deploying the DataVizPro backend to Render.

## Prerequisites

1. Create a Render account at [render.com](https://render.com)
2. Have your MongoDB connection URI ready
3. Have your JWT secret and other environment variables prepared

## Deployment Steps

### Option 1: Using the Render Dashboard (Manual Setup)

1. Log in to your Render dashboard
2. Click "New" and select "Web Service"
3. Connect your GitHub repository or select "Manual Deploy" with a public Git URL
4. Configure your service with the following settings:
   - **Name**: dataviz-pro-backend (or your preferred name)
   - **Environment**: Node
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && node server.js`
   - **Plan**: Free (or your preferred plan)
5. Add the following environment variables:
   - `NODE_ENV`: production
   - `PORT`: 10000 (Render will automatically set the PORT env variable, but this sets a fallback)
   - `MONGODB_URI`: Your MongoDB connection string
   - `JWT_SECRET`: Your JWT secret
   - `GOOGLE_CLIENT_ID`: Your Google Client ID (if using Google auth)
   - `GOOGLE_CLIENT_SECRET`: Your Google Client Secret (if using Google auth)
   - `RENDER`: true (This helps the app detect it's running on Render)
6. Click "Create Web Service"

### Option 2: Using render.yaml (Infrastructure as Code)

1. We've included a `render.yaml` file in the root of the repository
2. Log in to your Render dashboard
3. Click on "Blueprints" in the sidebar
4. Follow the instructions to connect your repository
5. Render will automatically detect the `render.yaml` file and prompt you to create the services
6. You'll need to manually add the secret environment variables:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`

## Updating the Frontend to Use the Render Backend

After deploying your backend on Render, update your frontend to point to the new API URL:

1. In your Vercel dashboard, add a new environment variable:
   - `REACT_APP_API_URL`: Your Render backend URL (e.g., https://dataviz-pro-backend.onrender.com)

2. Redeploy your frontend on Vercel

## Notes About File Storage

The backend uses a temporary directory for file storage (`/tmp/uploads`). On Render's free tier, files in this directory will be lost when the service restarts or when the instance is replaced. For production use, consider implementing a cloud storage solution like AWS S3, Google Cloud Storage, or similar.

## Monitoring and Logs

- You can monitor your service and view logs from the Render dashboard
- Use the `/health` endpoint to check the status of your backend
- Use the `/api/diagnostics/mongo` endpoint to check the MongoDB connection status 