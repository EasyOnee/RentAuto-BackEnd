const admin = require("firebase-admin");

let app;

function getFirebaseApp() {
  if (app) return app;

  const base64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

  if (!base64) {
    throw new Error("Falta FIREBASE_SERVICE_ACCOUNT_BASE64");
  }

  let serviceAccount;

  try {
    const json = Buffer.from(base64, "base64").toString("utf8");
    serviceAccount = JSON.parse(json);
  } catch (error) {
    throw new Error("Error al parsear FIREBASE_SERVICE_ACCOUNT_BASE64");
  }

  app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET
  });

  return app;
}

module.exports = getFirebaseApp;