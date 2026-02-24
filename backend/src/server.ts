import { app } from './app';
import { connectDatabase } from './config/database';
import { ensureUploadDir, isServerless } from './config/uploads';
import { initializeFirebaseAdmin } from './services/firebaseAdmin';
import { env } from './config/env';
import os from 'os';

const getLocalIp = (): string | null => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return null;
};

const startServer = async () => {
  try {
    await connectDatabase();
    if (!isServerless) {
      await ensureUploadDir();
    }

    initializeFirebaseAdmin();

    app.listen(env.PORT, '0.0.0.0', () => {
      console.log(`🚀 Servidor rodando na porta ${env.PORT}`);
      console.log(`📍 Health check: http://localhost:${env.PORT}/health`);
      console.log(`📡 API: http://localhost:${env.PORT}/api`);
      const localIp = getLocalIp();
      if (localIp) {
        console.log(`🌐 Rede local: http://${localIp}:${env.PORT}/api`);
      }
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
};

startServer();
