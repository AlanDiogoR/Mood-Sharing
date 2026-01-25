import { app } from './app';
import { connectDatabase } from './config/database';
import { ensureUploadDir, isServerless } from './config/uploads';
import { initializeFirebaseAdmin } from './services/firebaseAdmin';

const PORT = Number(process.env.PORT) || 3000;
// Inicia o servidor
const startServer = async () => {
  try {
    await connectDatabase();
    if (!isServerless) {
      await ensureUploadDir();
    }

    // Inicializa Firebase Admin
    initializeFirebaseAdmin();

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
      console.log(`📍 Health check: http://localhost:${PORT}/health`);
      console.log(`📡 API: http://localhost:${PORT}/api`);
      console.log(`🌐 Acessível externamente em: http://192.168.0.16:${PORT}/api`);
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
};

startServer();
