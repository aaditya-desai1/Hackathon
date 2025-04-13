#!/bin/bash

# DataVizPro Vercel Deployment Script
echo "Starting DataVizPro Vercel deployment process..."

# Clean up and install dependencies
echo "Cleaning up build directories..."
rm -rf build
rm -rf frontend/build

# Install dependencies
echo "Installing dependencies..."
npm install
cd frontend && npm install && cd ..

# Build the project
echo "Building the project..."
node build-script.js

# Check if build was successful
if [ -d "build" ] && [ "$(ls -A build)" ]; then
    echo "Build successful! Deploying to Vercel..."
    
    # Deploy to Vercel
    npx vercel --prod
    
    echo "Deployment process completed!"
else
    echo "Build failed! No files found in build directory."
    exit 1
fi

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

echo "Deployment initiated. Check the Vercel dashboard for deployment status."
echo "If you encounter a 404 error after deployment, please check:"
echo "1. MongoDB connection string in Vercel environment variables"
echo "2. Ensure all routes in vercel.json are correctly configured"
echo "3. Check backend logs for any connection issues" 