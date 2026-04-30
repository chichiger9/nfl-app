import express, { type NextFunction, type Request, type Response } from 'express';
import cors from 'cors';
import { playersRouter } from './routes/players';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use('/api/players', playersRouter);

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  const message = err instanceof Error ? err.message : 'Internal Server Error';
  res.status(500).json({ error: message });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
