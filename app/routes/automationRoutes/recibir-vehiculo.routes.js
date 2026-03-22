module.exports = app => {
    const auth = require("../../middlewares/auth");
    const data = require("../../controllers/movimientos/recibir-vehiculo.controller.js");
  
    var router = require("express").Router();

    // Ruta para obtener la información de una reserva específica
    router.get('/:id', data.getData);
    router.post('/vehiculo', data.receiveVehicle);

    // Con autenticación
    app.use("/recibir", auth, router);
};
