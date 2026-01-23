/**
 * MongoDB Service
 * 
 * Este serviço é um exemplo de como integrar com MongoDB.
 * A string de conexão será fornecida via variável de ambiente MONGODB_URI.
 * 
 * NOTA: Este arquivo é apenas um exemplo. A integração real com MongoDB
 * deve ser feita no backend/API, não diretamente no app React Native.
 * 
 * O app React Native se comunica com a API através dos serviços:
 * - authService.ts
 * - moodService.ts
 * 
 * A API backend deve usar esta string de conexão para conectar ao MongoDB.
 */

import {CONFIG} from '../constants/config';

export interface MongoDBConfig {
  uri: string;
  database: string;
  options?: {
    useNewUrlParser?: boolean;
    useUnifiedTopology?: boolean;
  };
}

/**
 * Configuração do MongoDB
 * A URI será fornecida posteriormente via variável de ambiente
 */
export const getMongoDBConfig = (): MongoDBConfig => {
  const uri = CONFIG.MONGODB_URI || '';

  if (!uri) {
    throw new Error('MONGODB_URI não configurada. Configure a variável de ambiente.');
  }

  return {
    uri,
    database: 'mood_sharing_db',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  };
};

/**
 * Exemplo de estrutura de coleções no MongoDB:
 * 
 * users: {
 *   _id: ObjectId,
 *   email: string,
 *   password: string (hashed),
 *   name: string,
 *   partnerId: ObjectId?,
 *   createdAt: Date,
 *   updatedAt: Date
 * }
 * 
 * moods: {
 *   _id: ObjectId,
 *   userId: ObjectId,
 *   type: string (MoodType),
 *   emoji: string,
 *   message: string?,
 *   location: {
 *     latitude: number,
 *     longitude: number
 *   }?,
 *   createdAt: Date,
 *   updatedAt: Date
 * }
 * 
 * locations: {
 *   _id: ObjectId,
 *   userId: ObjectId,
 *   latitude: number,
 *   longitude: number,
 *   timestamp: Date
 * }
 */
