# DataViz Pro

A powerful web-based data visualization tool that automates the process of creating meaningful visualizations from your data.

## Features

- 📊 File Upload & Storage (CSV/JSON)
- 🔍 Automated Data Analysis
- 📈 Dynamic Visualization Generation
- 🎨 Data Filtering & Customization
- 🤖 AI-Driven Chart Recommendations

## Tech Stack

- Frontend: React.js with Material-UI
- Backend: Node.js with Express
- Database: MongoDB
- Visualization: Chart.js, D3.js
- AI/ML: TensorFlow.js for chart recommendations

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

## Setup Instructions

1. Clone the repository
2. Install dependencies:
   ```bash
   # Install backend dependencies
   cd backend
   npm install

   # Install frontend dependencies
   cd ../frontend
   npm install
   ```
3. Create a `.env` file in the backend directory with:
   ```
   MONGODB_URI=your_mongodb_uri
   PORT=5000
   ```
4. Start the development servers:
   ```bash
   # Start backend server
   cd backend
   npm run dev

   # Start frontend server
   cd frontend
   npm start
   ```

## Project Structure

```
dataviz-pro/
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── services/
│   └── utils/
├── frontend/
│   ├── public/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── services/
│       └── utils/
└── README.md
```

## License

MIT 