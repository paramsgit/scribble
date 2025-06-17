import express, { Express } from 'express';
import cors from 'cors';
import apiRoutes from './routes/apiRoutes';
import errorHandler from './middleware/errorHandler';
import config from '../config';

const app: Express = express();

app.use(cors({
  origin: config.corsOrigin,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());
app.use('/api', apiRoutes);
app.use(errorHandler);

export default app;