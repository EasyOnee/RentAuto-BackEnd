module.exports = (app) => {
    const auth = require("../../middlewares/auth");
  
    const users = require("../../controllers/users.controller");
  
    var router = require("express").Router();
  
    router.post("/", users.createUser); // Create a new
    router.get("/", users.getUsers); // Retrieve all
  
    // With Authentication
    app.use("/users", auth, router);
};
