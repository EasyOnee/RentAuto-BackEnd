/* const admin = require('firebase-admin');
const serviceAccount = require('../../rentauto-dced6-firebase-adminsdk-d0ug3-7f6b73c66d.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'gs://rentauto-dced6.appspot.com'
});

const bucket = admin.storage().bucket();

module.exports = { admin, bucket }; */


const admin = require('firebase-admin');

// Railway pone la ruta absoluta en la variable de entorno
const serviceAccount = require(process.env.FIREBASE_CREDENTIALS);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'rentauto-dced6.appspot.com'
});
