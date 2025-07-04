const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const contractRoutes = require('./src/routes/contractRoutes');
const instagramYoutubeRoutes = require('./src/routes/instagramYoutubeRoutes');
const clientRoutes = require('./src/routes/client');

dotenv.config();

const app = express();

// Configure CORS to allow frontend during development and deploy
const allowedOrigins = [
  '*',
  'http://localhost:5173',
  'https://influencerflow-964513157102.asia-south1.run.app',
  'http://localhost:3000',
  'https://app.influencerflow.in'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed for this origin'));
    }
  },
  credentials: true
}));

// Middleware for parsing request bodies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check route
app.get('/', (_req, res) => {
  res.send('Backend is running!');
});

// API routes
app.use('/api/contracts', contractRoutes);
app.use('/api/monitor', instagramYoutubeRoutes);
app.use('/', clientRoutes);

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
}); 