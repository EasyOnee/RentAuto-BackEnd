const { Router } = require("express");

module.exports = (app) => {
    const auth = require("../../middlewares/auth");
    const anular = require("../../controllers/movimientos/anular-reserva.controller");

    var router = require("express").Router();

    router.post("/reserva", anular.anularReserva);
    router.get("/activas", anular.getReservasActivas);

    app.use("/anular", auth, router); 
};
