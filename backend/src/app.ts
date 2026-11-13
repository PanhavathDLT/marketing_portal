import express, { Application } from 'express';
import cors from 'cors';
import '@config/passport.js'; // register passport strategy
import v1Router from './routes/v1.js';
import { errorHandler } from '@shared/middleware/error.middleware.js';

const app: Application = express();

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// API v1
app.use('/api/v1', v1Router);

// 404
app.use((_req, res) => {
  res.status(404).json({ status: 'error', error: 'Not found' });
});

// Global error handler
app.use(errorHandler);

export default app;
