module.exports = app => {
  const auth = require("../../middlewares/auth");

  const authenticated = require("../../controllers/authenticated.controller");

  var router = require("express").Router();

  router.put("/:document/profile", authenticated.updateProfile); // Update Profile
  router.put("/:document/password", authenticated.updatePassword); // Update Password

  // With Authentication
  app.use("/authenticated/", auth, router);
};
