module.exports = (app) => {
    const auth = require("../../middlewares/auth");

    const file = require("../../controllers/file.controller");

    var router = require("express").Router();

    router.post("/photo", auth, file.upload); // Esta ruta es para subir una foto
    router.get("/download/:name", file.download); // Esta ruta es para descargar un archivo
    router.get("/image/:name", file.getImage); // Esta ruta es para obtener una imagen

    // Without Authentication
    app.use("/file", router);
};
