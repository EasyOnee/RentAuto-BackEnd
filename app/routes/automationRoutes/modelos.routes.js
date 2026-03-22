module.exports = app => {
    const auth = require("../../middlewares/auth");

    const modelos = require("../../controllers/vehiculos/modelos.controller.js");
  
    var router = require("express").Router();

    router.get("/", modelos.getModelos); // Retrieve all
  
    // With Authentication
    app.use("/modelos", auth, router);
};
