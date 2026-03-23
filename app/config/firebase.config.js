const admin = require("firebase-admin");
const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
const serviceAccount = JSON.parse(raw);

let app;

function getFirebaseApp() {
  if (app) return app;

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) {
    throw new Error("Falta FIREBASE_SERVICE_ACCOUNT");
  }

  const serviceAccount = JSON.parse(raw);

  app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET
  });

  return app;
}

module.exports = getFirebaseApp;