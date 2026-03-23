const multer = require('multer');
const { bucket } = require('../config/firebase.config');
const util = require('util');

/* const maxSize = 2 * 1024 * 1024;

// Configuración de Multer para el almacenamiento en memoria
const storage = multer.memoryStorage();
const uploadFile = multer({
  storage,
  limits: { fileSize: maxSize },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === "foto") {
      cb(null, true);
    } else {
      cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname));
    }
  }
}).single('foto');  // Solo permite un archivo con el campo 'foto'

async function uploadToFirebaseStorage(req, res, next) {
  try {
    await util.promisify(uploadFile)(req, res);
    if (req.file) {
      const filename = generateUniqueFilename(req.file.originalname);
      const filePath = `files/vehiculos/${filename}`;
      const file = bucket.file(filePath);

      await file.save(req.file.buffer, {
        metadata: { contentType: req.file.mimetype }
      });

      req.fileUrl = filename;  // Guarda la URL del archivo
    }
    next();
  } catch (error) {
    console.error(error);
    res.status(500).send('Error subiendo archivo.');
  }
}

const uploadFileMiddleware = util.promisify(uploadFile);

// Función auxiliar para generar nombres de archivo únicos
function generateUniqueFilename(originalName) {
  const random = Math.floor(Math.random() * 1000000000);
  const extension = /[^.]+$/.exec(originalName)[0];
  return `${random}.${extension}`;
} */

/* 
// Función para subir archivos a Firebase Storage
async function uploadToFirebaseStorage(req, res, next) {
  try {
    await uploadFileMiddleware(req, res);

    // Lógica para eliminar el archivo anterior si existe
    if (req.file && req.body.oldFoto) {
      const oldFilePath = `files/vehiculos/${req.body.oldFoto}`;
      const oldFile = bucket.file(oldFilePath);
      await oldFile.delete().catch(error => {
        console.error(`Error deleting old file: ${error.message}`);
      });
    }

    if (req.file) {
      const filename = generateUniqueFilename(req.file.originalname);
      req.title = filename;

      const filePath = `files/vehiculos/${filename}`;
      const file = bucket.file(filePath);

      await file.save(req.file.buffer, {
        metadata: { contentType: req.file.mimetype }
      });

      req.fileUrl = filename;
    }

    next();
  } catch (error) {
    console.error(error);
    next(error);
  }
} */

module.exports = uploadToFirebaseStorage;
