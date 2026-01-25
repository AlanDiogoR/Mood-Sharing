import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import moodRoutes from './routes/moodRoutes';
import userRoutes from './routes/userRoutes';
import mediaRoutes from './routes/mediaRoutes';
import { uploadDir } from './config/uploads';

// Carrega variáveis de ambiente
dotenv.config();

export const app = express();

// Middlewares
app.use(helmet());
// Configuração de CORS mais permissiva para desenvolvimento
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Em desenvolvimento, permite todas as origens (incluindo Expo Go)
    if (process.env.NODE_ENV === 'development') {
      callback(null, true);
      return;
    }

    // Em produção, verifica as origens permitidas
    const allowedOrigins = process.env.CORS_ORIGINS?.split(',') || [];
    if (!origin || allowedOrigins.includes(origin) || origin.startsWith('exp://')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(uploadDir));

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API está funcionando',
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/moods', moodRoutes);
app.use('/api/users', userRoutes);
app.use('/api/media', mediaRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Rota não encontrada',
  });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Erro:', err);
  const status = err?.name === 'MulterError' ? 400 : err.status || 500;
  res.status(status).json({
    success: false,
    error: err.message || 'Erro interno do servidor',
  });
});
