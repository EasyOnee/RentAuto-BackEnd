module.exports = (app) => {
    const auth = require("../../middlewares/auth");

    const bitacoraController = require("../../controllers/movimientos/bitacoraRecibir.controller.js");

    var router = require("express").Router();

    router.post('/createBitacora', bitacoraController.createBitacora);

    // Ruta para guardar en la tabla temporal
    router.post('/guardar', bitacoraController.guardarTempLiberado);

    app.use("/bitacoraRecibir", auth, router);
};
