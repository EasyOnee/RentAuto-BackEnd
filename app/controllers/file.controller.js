const uploadFile = require("../middlewares/uploadFirebase");
const HttpStatus = require('http-status-codes');

const { bucket } = require('../config/firebase.config');

exports.upload = async (req, res) => {
  try {
    await uploadFile(req, res);

    if (!req.file) {
      return res.status(HttpStatus.BAD_REQUEST).send({
      message: "Please upload a file!"
      });
    }
    
    const response = {
      message: "File has been uploaded to Firebase Storage.",
      name: req.title
    };

    // Se agrega la URL del archivo a la respuesta si existe
    if (req.fileUrl) {
      response.url = req.fileUrl;
    }

    res.status(HttpStatus.OK).send(response);
    } catch (error) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
      message: "File size cannot be larger than 2MB!"
      });
    }

    res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
      message: `Error uploading file: ${error.message}`
    });
    }
};

exports.download = async (req, res) => {
  const fileName = req.params.name;
  const filePath = `files/vehiculos/${fileName}`;
  const file = bucket.file(filePath);

  try {
    // Verifica si el archivo existe en Firebase Storage
    const [exists] = await file.exists();
    if (!exists) {
      return res.status(404).send({
        message: "File not found"
      });
    }

    // Obtiene los metadatos del archivo para el nombre original (si es necesario)
    const [metadata] = await file.getMetadata();

    // Configura la cabecera de respuesta para la descarga
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', metadata.contentType);

    // Transmite el archivo desde Firebase Storage
    file.createReadStream().pipe(res);
  } catch (error) {
    res.status(500).send({
      message: "Error downloading file: " + error.message,
    });
  }
};

exports.getImage = async (req, res) => {
  const fileName = req.params.name;

  console.log(fileName);

  if (!fileName) {
    return res.status(400).send({
      message: 'No valid image name provided.'
    });
  }

  const filePath = `files/vehiculos/${fileName}`;
  const file = bucket.file(filePath);

  try {
    // Verifica si el archivo existe en Firebase Storage
    const [exists] = await file.exists();
    if (!exists) {
      return res.status(404).send({
        message: "Image not found"
      });
    }

    // Obtiene el tipo MIME del archivo
    const [metadata] = await file.getMetadata();
    const mimeType = metadata.contentType;

    if (mimeType) {
      // Establece la cabecera de respuesta para la imagen
      res.setHeader("Content-Type", mimeType);

      // Transmite el archivo desde Firebase Storage
      file.createReadStream().pipe(res);
    } else {
      res.status(500).send({
        message: "Invalid MIME type for image"
      });
    }
  } catch (error) {
    res.status(500).send({
      message: "Error retrieving image: " + error.message
    });
  }
};
