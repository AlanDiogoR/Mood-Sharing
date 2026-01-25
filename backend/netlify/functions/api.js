const serverless = require('serverless-http');

const { app } = require('../../dist/app');
const { connectDatabase } = require('../../dist/config/database');
const { ensureUploadDir } = require('../../dist/config/uploads');
const { initializeFirebaseAdmin } = require('../../dist/services/firebaseAdmin');

let initPromise = null;

const init = async () => {
  if (!initPromise) {
    initPromise = (async () => {
      await connectDatabase();
      await ensureUploadDir();
      initializeFirebaseAdmin();
    })();
  }
  return initPromise;
};

const handler = serverless(app);

exports.handler = async (event, context) => {
  await init();
  return handler(event, context);
};
