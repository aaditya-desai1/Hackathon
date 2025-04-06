#!/bin/bash

# Ensure Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Check if user is logged in
vercel whoami || vercel login

echo "Preparing to deploy DataVizPro to Vercel..."

# Ensure MongoDB environment variable is set
if [ -z "$MONGODB_URI" ]; then
    echo "Warning: MONGODB_URI environment variable is not set."
    echo "Please ensure you have set up the MongoDB URI in Vercel environment variables."
fi

# Deploy to Vercel
echo "Deploying to Vercel..."
vercel --prod

echo "Deployment initiated. Check the Vercel dashboard for deployment status."
echo "If you encounter a 404 error after deployment, please check:"
echo "1. MongoDB connection string in Vercel environment variables"
echo "2. Ensure all routes in vercel.json are correctly configured"
echo "3. Check backend logs for any connection issues" 