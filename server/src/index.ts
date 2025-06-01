import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import contractRoutes from './routes/contractRoutes';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (_req: Request, res: Response) => {
  res.send('Backend is running!');
});

app.use('/contracts', contractRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server started at http://localhost:${PORT}`));