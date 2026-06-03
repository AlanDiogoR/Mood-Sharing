// Configuração dinâmica do Expo.
//
// Os valores sensíveis/ambientais (URL da API, IDs do Firebase, projeto Expo)
// são lidos de variáveis de ambiente de build — definidas no painel do EAS
// (EAS Secrets / env por perfil em eas.json) ou em um arquivo .env local.
// Os valores em app.json continuam servindo apenas como fallback de desenvolvimento.

const appJson = require('./app.json');

const pick = (envKey, fallback) => {
  const value = process.env[envKey];
  return value !== undefined && value !== '' ? value : fallback;
};

module.exports = () => {
  const base = appJson.expo;
  const extra = base.extra ?? {};

  return {
    ...base,
    extra: {
      ...extra,
      API_BASE_URL: pick('API_BASE_URL', extra.API_BASE_URL),
      EXPO_PROJECT_ID: pick('EXPO_PROJECT_ID', extra.EXPO_PROJECT_ID),
      FIREBASE_API_KEY: pick('FIREBASE_API_KEY', extra.FIREBASE_API_KEY),
      FIREBASE_PROJECT_ID: pick('FIREBASE_PROJECT_ID', extra.FIREBASE_PROJECT_ID),
      FIREBASE_MESSAGING_SENDER_ID: pick(
        'FIREBASE_MESSAGING_SENDER_ID',
        extra.FIREBASE_MESSAGING_SENDER_ID
      ),
    },
  };
};
