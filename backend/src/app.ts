import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import { env } from './config/env';
import authRoutes from './routes/authRoutes';
import partnerRoutes from './routes/partnerRoutes';
import moodRoutes from './routes/moodRoutes';
import userRoutes from './routes/userRoutes';
import mediaRoutes from './routes/mediaRoutes';
import notesRoutes from './routes/notesRoutes';
import workoutRoutes from './routes/workoutRoutes';
import goalRoutes from './routes/goalRoutes';
import photoRoutes from './routes/photoRoutes';
import meetingRoutes from './routes/meetingRoutes';
import { uploadDir, isServerless } from './config/uploads';
import { getPublicUserPhoto } from './controllers/userController';

export const app = express();

// Security middlewares
app.use(helmet());

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Muitas requisições. Tente novamente mais tarde.' },
});
app.use('/api', globalLimiter);

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!env.IS_PRODUCTION) {
      callback(null, true);
      return;
    }

    const localDevOrigins = ['http://localhost:8081', 'http://localhost:19006'];
    const allAllowed = [...env.CORS_ORIGINS, ...localDevOrigins];
    if (!origin || allAllowed.includes(origin) || origin.startsWith('exp://')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(morgan(env.IS_PRODUCTION ? 'combined' : 'dev'));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
// Remove operadores do MongoDB ($, .) de body/params/query (defesa contra NoSQL injection).
app.use(mongoSanitize());
if (!isServerless) {
  app.use(
    '/uploads',
    express.static(uploadDir, {
      // Uploads nunca devem ser interpretados como página/script pelo navegador.
      setHeaders: res => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Content-Disposition', 'inline');
        res.setHeader('Cache-Control', 'public, max-age=86400');
      },
    })
  );
}

// Health check
app.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'API está funcionando',
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.get('/api/uploads/:key', getPublicUserPhoto);
app.use('/api/auth', authRoutes);
app.use('/api/partner', partnerRoutes);
app.use('/api/moods', moodRoutes);
app.use('/api/users', userRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/photos', photoRoutes);
app.use('/api/meetings', meetingRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: 'Rota não encontrada',
  });
});

// Centralized error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (env.IS_PRODUCTION) {
    console.error('Erro:', err.message);
  } else {
    console.error('Erro:', err);
  }

  if (err?.name === 'MulterError') {
    res.status(400).json({ success: false, error: `Erro no upload: ${err.message}` });
    return;
  }

  if (err?.name === 'ValidationError') {
    res.status(400).json({ success: false, error: err.message });
    return;
  }

  if (err?.name === 'CastError') {
    res.status(400).json({ success: false, error: 'ID inválido' });
    return;
  }

  const status = err.status || 500;
  const message = env.IS_PRODUCTION ? 'Erro interno do servidor' : (err.message || 'Erro interno do servidor');
  res.status(status).json({ success: false, error: message });
});
