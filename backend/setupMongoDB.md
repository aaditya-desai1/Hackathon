# Setting up MongoDB on Windows

Follow these steps to install MongoDB Community Edition on Windows:

## Step 1: Download MongoDB Community Server
1. Go to the [MongoDB Download Center](https://www.mongodb.com/try/download/community)
2. Select the following options:
   - Version: Latest version
   - Platform: Windows
   - Package: MSI
3. Click Download

## Step 2: Install MongoDB Community Edition
1. Run the MSI installer
2. Select "Complete" installation
3. Make sure "Install MongoDB as a Service" is checked
4. Complete the installation

## Step 3: Create a Data Directory
MongoDB requires a directory for storing data:
1. Open Command Prompt as Administrator
2. Create directories by running:
   ```
   md C:\data\db
   ```

## Step 4: Verify MongoDB is Running
1. The MongoDB service should start automatically
2. To verify, open Command Prompt and run:
   ```
   mongosh
   ```
3. If you can connect to MongoDB, you'll see the MongoDB shell

## Step 5: Update the DataViz Pro Backend
The backend .env file already has the correct local MongoDB connection string:
```
MONGODB_URI=mongodb://localhost:27017/datavizpro
```

## Troubleshooting
- If you can't connect, make sure the MongoDB service is running:
  1. Press Win+R
  2. Type `services.msc` and press Enter
  3. Look for "MongoDB Server" and make sure it's running
  4. If not, right-click it and select "Start"

- If you prefer to use MongoDB Atlas (cloud) instead:
  1. Create an account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
  2. Set up a free tier cluster
  3. Get your connection string 
  4. Update your .env file with the new connection string 