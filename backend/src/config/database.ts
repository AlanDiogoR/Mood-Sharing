import mongoose from 'mongoose';

export const connectDatabase = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      throw new Error('MONGODB_URI não está definida nas variáveis de ambiente');
    }

    // Opções de conexão
    const options = {
      retryWrites: true,
      w: 'majority',
    };

    await mongoose.connect(mongoUri, options);
    console.log('✅ MongoDB conectado com sucesso');
  } catch (error: any) {
    console.error('❌ Erro ao conectar com MongoDB:', error.message);
    if (error.code === 8000) {
      console.error('💡 Dica: Verifique se o usuário e senha estão corretos no MONGODB_URI');
      console.error('💡 Dica: Verifique se o IP está liberado no MongoDB Atlas');
    }
    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB desconectado');
});

mongoose.connection.on('error', (error) => {
  console.error('❌ Erro na conexão MongoDB:', error);
});
