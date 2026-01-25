import dotenv from 'dotenv';
import serverless from 'serverless-http';
import { app } from '../../backend/src/app';
import { connectDatabase } from '../../backend/src/config/database';
import { initializeFirebaseAdmin } from '../../backend/src/services/firebaseAdmin';

// Carrega .env apenas para desenvolvimento local (netlify dev)
dotenv.config();

let initPromise: Promise<void> | null = null;

const ensureInitialized = async () => {
  if (!initPromise) {
    initPromise = (async () => {
      await connectDatabase();
      initializeFirebaseAdmin();
    })();
  }
  return initPromise;
};

const handler = serverless(app);

export const handler = async (event: any, context: any) => {
  await ensureInitialized();
  return handler(event, context);
};
