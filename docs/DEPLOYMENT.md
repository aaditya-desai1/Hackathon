# Deploying DataVizPro to Vercel

This guide will help you deploy your DataVizPro application to Vercel.

## Prerequisites

1. A [Vercel](https://vercel.com) account
2. [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account or another MongoDB provider
3. Node.js and npm installed on your local machine

## Setup Environment Variables

Before deploying, you need to set up the following environment variables in Vercel:

1. `MONGODB_URI` - Your MongoDB connection string
2. `NODE_ENV` - Set to "production"
3. Any other environment variables your application uses (JWT_SECRET, etc.)

## Deployment Steps

### Option 1: Using the Vercel Dashboard

1. Push your code to GitHub, GitLab, or Bitbucket
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "Import Project"
4. Choose "Import Git Repository" and select your repository
5. Configure your project:
   - Root Directory: `./` (root of your project)
   - Build Command: Leave as default (Vercel will detect it from vercel.json)
   - Output Directory: Leave as default
6. Add environment variables under "Environment Variables" section
7. Click "Deploy"

### Option 2: Using Vercel CLI

1. Install Vercel CLI:
   ```
   npm install -g vercel
   ```

2. Login to Vercel:
   ```
   vercel login
   ```

3. Navigate to your project directory:
   ```
   cd path/to/datavizpro
   ```

4. Deploy to Vercel:
   ```
   vercel --prod
   ```
   
   Or use the included deployment script:
   ```
   chmod +x deploy-vercel.sh
   ./deploy-vercel.sh
   ```

## Troubleshooting 404 Errors

If you encounter 404 errors after deployment:

1. Check that the MongoDB connection is working:
   - Verify the MongoDB URI is correct in Vercel environment variables
   - Ensure your IP address is whitelisted in MongoDB Atlas

2. Verify your vercel.json configuration:
   - Make sure all routes are correctly configured
   - Check for any typos or errors in the configuration

3. Check Vercel logs for any errors:
   - Go to your project in the Vercel dashboard
   - Click on the latest deployment
   - Go to "Functions" tab to see backend logs

4. Check CORS configuration:
   - Ensure the CORS configuration in server.js is allowing requests from your Vercel domain

## Updating Your Deployment

Each time you push changes to your connected repository, Vercel will automatically redeploy your application.

To deploy manually:

```
vercel --prod
```

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Deploying Node.js to Vercel](https://vercel.com/guides/deploying-nodejs-to-vercel)
- [Environment Variables in Vercel](https://vercel.com/docs/environment-variables) 