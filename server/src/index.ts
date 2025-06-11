import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import contractRoutes from './routes/contractRoutes';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.json({ limit: '10mb' })); // For JSON payloads
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // For form data

// Health check route
app.get('/', (_req: Request, res: Response) => {
  res.send('Backend is running!');
});

// Contract routes
app.use('/api/contracts', contractRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server started at http://localhost:${PORT}`));
