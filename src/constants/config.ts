// Configuração do app
// Usa valores do app.json via process.env ou valores padrão
// NÃO usa expo-constants para evitar problemas com módulos nativos

const getEnvVar = (key: string, defaultValue: string = ''): string => {
  try {
    // Tenta acessar via process.env primeiro (mais confiável)
    if (
      typeof process !== 'undefined' &&
      process !== null &&
      process.env &&
      typeof process.env === 'object' &&
      process.env[key]
    ) {
      return String(process.env[key]) || defaultValue;
    }
    
    // Fallback: valores hardcoded do app.json
    // Estes valores devem corresponder ao app.json
    const hardcodedValues: Record<string, string> = {
      API_BASE_URL: 'http://191.37.43.39:3001/api',
      MONGODB_URI: 'mongodb+srv://alandiogor_db_user:vEdWjEc6o4GmghTp@cluster0.nvlz1pz.mongodb.net/?appName=Cluster0',
      EXPO_PROJECT_ID: 'your-expo-project-id',
    };
    
    if (hardcodedValues[key]) {
      return hardcodedValues[key];
    }
    
    return defaultValue;
  } catch (error) {
    // Se houver qualquer erro, retorna o valor padrão
    return defaultValue;
  }
};

export const CONFIG = {
  // API Configuration
  API_BASE_URL: getEnvVar('API_BASE_URL', 'http://191.37.43.39:3001/api'),
  API_TIMEOUT: 30000,

  // MongoDB
  MONGODB_URI: getEnvVar('MONGODB_URI', ''),

  // Proximity settings
  PROXIMITY_THRESHOLD_KM: 1.0, // 1km threshold
  LOCATION_UPDATE_INTERVAL: 60000, // 1 minute
  BACKGROUND_LOCATION_INTERVAL: 300000, // 5 minutes

  // Authentication
  TOKEN_REFRESH_THRESHOLD: 300000, // 5 minutes before expiry

  // App settings
  APP_NAME: 'Mood Sharing',
  LOCK_SCREEN_TIMEOUT: 30000, // 30 seconds

  // Notifications
  NOTIFICATION_CHANNEL_ID: 'mood_sharing_channel',
  NOTIFICATION_CHANNEL_NAME: 'Mood Sharing Notifications',
  EXPO_PROJECT_ID: getEnvVar('EXPO_PROJECT_ID', 'your-expo-project-id'),
};
