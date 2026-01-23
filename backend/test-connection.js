// Script de teste de conexão MongoDB
require('dotenv').config();
const mongoose = require('mongoose');

const testConnection = async () => {
  try {
    console.log('🔍 Testando conexão com MongoDB...');
    console.log('📍 URI:', process.env.MONGODB_URI?.replace(/:[^:@]+@/, ':****@')); // Esconde a senha
    
    await mongoose.connect(process.env.MONGODB_URI, {
      retryWrites: true,
      w: 'majority',
    });
    
    console.log('✅ Conexão bem-sucedida!');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro na conexão:', error.message);
    
    if (error.code === 8000) {
      console.log('\n💡 Possíveis soluções:');
      console.log('1. Verifique se o usuário e senha estão corretos');
      console.log('2. Verifique se o IP está liberado no MongoDB Atlas');
      console.log('   - Acesse: https://cloud.mongodb.com');
      console.log('   - Vá em Network Access');
      console.log('   - Adicione seu IP ou use 0.0.0.0/0 para permitir todos (apenas desenvolvimento)');
      console.log('3. Verifique se o usuário tem permissões no banco de dados');
    }
    
    process.exit(1);
  }
};

testConnection();
