module.exports = (app) => {
    const auth = require("../../middlewares/auth");

    const tipos = require("../../controllers/vehiculos/tipos.controller");

    var router = require("express").Router();

    router.post("/", tipos.crearTipo); // Create a new
    router.get("/", tipos.obtenerTipos); // Retrieve all

    // With Authentication
    app.use("/tipos", auth, router);
};
