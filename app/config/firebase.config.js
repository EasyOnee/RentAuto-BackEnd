// app/config/firebase.config.js
const admin = require('firebase-admin');
const path  = require('path');

/**
 * Railway → Variables (type: File) → FIREBASE_CREDENTIALS
 * Si corres localmente, pon process.env.FIREBASE_CREDENTIALS=./ruta/clave.json
 */
const credentialsPath = process.env.FIREBASE_CREDENTIALS ||
                        path.join(__dirname,
                                  '..',
                                  '..',
                                  'rentauto-dced6-firebase-adminsdk-d0ug3-7f6b73c66d.json');

const serviceAccount = require(credentialsPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  // pon tu bucket o coméntalo si no usas Cloud Storage
  storageBucket: 'rentauto-dced6.appspot.com'
});

/**
 * Exporta la instancia para reutilizar:
 *   const { admin } = require('../config/firebase.config');
 */
module.exports = { admin };
