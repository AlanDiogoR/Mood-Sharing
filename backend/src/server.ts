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

let server: ReturnType<typeof app.listen> | null = null;

const shutdown = (reason: string, error?: unknown) => {
  console.error(`❌ Encerrando o servidor (${reason}):`, error);
  if (server) {
    server.close(() => process.exit(1));
    // Garante a saída mesmo que o close não complete a tempo.
    setTimeout(() => process.exit(1), 10000).unref();
  } else {
    process.exit(1);
  }
};

process.on('unhandledRejection', (reason) => {
  shutdown('unhandledRejection', reason);
});

process.on('uncaughtException', (error) => {
  shutdown('uncaughtException', error);
});

const startServer = async () => {
  try {
    await connectDatabase();
    if (!isServerless) {
      await ensureUploadDir();
    }

    initializeFirebaseAdmin();

    server = app.listen(env.PORT, '0.0.0.0', () => {
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
