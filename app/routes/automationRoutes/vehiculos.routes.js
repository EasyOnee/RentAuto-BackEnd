
module.exports = (app) => {
    const auth = require("../../middlewares/auth");
    const uploadToFirebaseStorage = require("../../middlewares/uploadFirebase");

    const vehiculos = require("../../controllers/vehiculos/vehiculos.controller");

    var router = require("express").Router();
    router.post("/", uploadToFirebaseStorage, vehiculos.createVehiculo);
    router.get("/", vehiculos.getVehiculos); // Retrieve all
    router.get("/data", vehiculos.getInputData);
    router.get("/paginados", vehiculos.getVehiculosPaginados);
    router.get("/estado", vehiculos.getVehiculosEstado);
    router.get("/total", vehiculos.getTotalVehiculos); //obtener el total de vehiculos
    router.get("/:id", vehiculos.viewVehicle); // Retrieve a single
    router.get('/kms/:id', vehiculos.getKilometrajeHistorial); // obtener el historial de kilometraje de un vehiculo
 

    // With Authentication
    app.use("/vehiculos", auth, router);
};
