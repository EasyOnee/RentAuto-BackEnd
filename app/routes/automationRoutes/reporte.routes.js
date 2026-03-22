module.exports = (app) => {
    const auth = require("../../middlewares/auth");
    const reporte = require("../../controllers/reporte.controller.js");
  
    var router = require("express").Router();
  
    // Ruta para obtener el reporte con fechas
    router.post("/filtrar", reporte.getReservasFiltradas);

  
    // Aplicar autenticación
    app.use("/reporte", auth, router);
  };
  