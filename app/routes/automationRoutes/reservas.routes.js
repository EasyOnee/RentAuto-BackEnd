const { Router } = require("express");

module.exports = (app) => {
    const auth = require("../../middlewares/auth");

    const reservas = require("../../controllers/movimientos/reservas.controller");

    var router = require("express").Router();

    router.post("/", reservas.createReserva); // Create a new
    router.get("/", reservas.getReservas); // Retrieve all
    router.get("/detalle/:id", reservas.getReservaDetalle);
    router.get('/generar-recibo/:folio', reservas.generateReceiptPDF);
    router.get('/generar-pagare/:folio', reservas.generatePagarePDF);
    router.get("/total", reservas.getTotalReservas);
    router.get("/monto", reservas.getMontoTotalReservas);
    router.get("/activa", reservas.filtrarReservas);
    router.post("/cambiarEstado", reservas.cambiarEstadoVehiculo);
    router.get("/calendario", reservas.calendario);
    router.get("/date/:id", reservas.getDateReservas);

    // With Authentication
    app.use("/reservas", auth, router);
};
