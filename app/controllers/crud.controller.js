const db = require("../models");
const bcrypt = require("bcrypt");

exports.create = async (req, res) => {
  try {
    const data = await db[req.params.document].create(req.body);
    
    res.send({
      message: "Creado exitosamente",
      data
    });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

exports.findAll = async (req, res) => {
  try {
    var condition = {};
    
    var offset = parseInt(req.query.offset);
    var limit = parseInt(req.query.limit);

    if (offset >= 0 && limit >= 0) {
      condition.offset = offset;
      condition.limit = limit;
    }

    const data = await db[req.params.document].findAll(condition);
    
    res.send(data);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

exports.findOne = async (req, res) => {
  try {
    const id = req.params.id;

    const data = await db[req.params.document].findByPk(id);

    if (data) {
      res.send(data);
    } else {
      res.status(400).send({ message: "Error al buscar el registro con id=" + id });
    }
  } catch (error) {
    res.status(500).send({  message: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const id = req.params.id;

    const num = await db[req.params.document].update(req.body, { where: { id: id } });

    // Si la tabla que está recibiendo es 'users' y el campo 'password' se actualiza, entonces se debe encriptar la contraseña
    if (num == 1 && req.params.document == 'users' && req.body.password) {
      const hashPassword = await bcrypt.hash(String(req.body.password), 10);

      await db[req.params.document].update({ password: hashPassword }, { where: { id: id } });
    }

    if (num == 1) {
      res.send({ message: "Actualizado correctamente" });
    } else {
      res.send({ message: `No se puede actualizar el registro con id=${id}. Tal vez el registro no se encontró o el cuerpo de la solicitud está vacío` });
    }
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const id = req.params.id;
    const document = req.params.document;

    const num = await db[document].destroy({ where: { id: id } });

    if (num == 1) {
      res.send({ message: "Eliminado correctamente" });
    } else {
      res.send({ message: `No se puede eliminar el registro con id=${id}. Tal vez el registro no se encontró` });
    }
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

exports.deleteAll = async (req, res) => {
  try {
    const nums = await db[req.params.document].destroy({ where: {}, truncate: false });

    if (nums > 0) {
      res.send({ message: `${nums} registros eliminados correctamente` });
    } else {
      res.status(400).send({ message: "No se encontraron registros para eliminar" });
    }
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};
