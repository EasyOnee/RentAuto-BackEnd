module.exports = app => {
  const auth = require("../../middlewares/auth");

  const crud = require("../../controllers/crud.controller");

  var router = require("express").Router();

  router.post("/:document", crud.create); // Create a new document

  router.get("/:document", crud.findAll); // Retrieve all documents
  router.get("/:document/:id", crud.findOne); // Retrieve a single document

  router.put("/:document/:id", crud.update); // Update a document
  
  router.delete("/:document/:id", crud.delete); // Delete a document
  router.delete("/:document", crud.deleteAll); // Delete all documents

  // With Authentication
  app.use("/crud", auth, router);
};
