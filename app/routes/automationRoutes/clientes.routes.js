module.exports = (app) => {
    const auth = require("../../middlewares/auth");

    const clientes = require("../../controllers/clientes/clientes.controller");

    var router = require("express").Router();

    router.post("/", clientes.createCliente); // Create a new
    router.get("/", clientes.getClientes); // Retrieve all

    /// --- ///

    router.post("/curp/validate", clientes.validateCURP); // Validate CURP
    router.post("/ine/validate", clientes.validateINE); // Validate INE
    router.post("/obtener-datos-ine", clientes.obtenerDatosINE); // Get INE data
    router.post("/buscar-cliente", clientes.findClienteById); // Find by ID
    router.get("/total", clientes.getTotalClientes); // Obtener el total de clientes
    router.get("/nombre-sugerencias", clientes.getNombreSugerencias);

    // With Authentication
    app.use("/clientes", auth, router);
};
