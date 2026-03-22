module.exports = (app) => {
  const auth = require("../middlewares/auth");

  var router = require("express").Router();

  // With Authentication
  app.use("/", auth, router);
};
