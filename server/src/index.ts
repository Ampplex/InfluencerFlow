import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import contractRoutes from './routes/contractRoutes';
import instagramYoutubeRoutes from './routes/instagramYoutubeRoutes';

dotenv.config();

const app = express();

// ✅ Configure CORS to allow frontend during development and deploy
const allowedOrigins = [
  'http://localhost:5173',
  'https://influencerflow-964513157102.asia-south1.run.app'
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

// ✅ Health check route
app.get('/', (_req: Request, res: Response) => {
  res.send('Backend is running!');
});

// ✅ API routes
app.use('/api/contracts', contractRoutes);
app.use('/api/monitor', instagramYoutubeRoutes);

// ✅ Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
