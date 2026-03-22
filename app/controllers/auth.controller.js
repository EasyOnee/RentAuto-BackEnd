const db = require("../models");
const bcrypt = require("bcrypt")
const jwt = require("../helpers/jwt");

const Op = db.Sequelize.Op;

exports.loginAuth = async (req, res) => {
  try {
    if (!req.body.email || !req.body.password) {
      res.status(400).send({ message: "Correo electrónico y contraseña requeridos" });
      return;
    }

    var condition = {
      where: { [Op.or]: [ { email: req.body.email } ] }
    };

    const data = await db[req.params.document].findOne(condition);

    if (!data) {
      res.status(400).send({ message: "Correo electrónico no encontrado" });
    } else {
      const match = await bcrypt.compare(req.body.password, data.password);
      
      if (match) {
        const payload = { id: data.id, role: data.role };

        res.send({
          access_token: jwt.accessTokenEncode(payload),
          refresh_token: jwt.refreshTokenEncode(payload),
          user: data
        });
      } else {
        res.status(400).send({ message: "Contraseña incorrecta" });
      }
    }
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

exports.createAuth = async (req, res) => {
  try {
    if (!req.body.email || !req.body.password) {
      res.status(400).send({ message: "Correo electrónico y contraseña requeridos" });
      return;
    }

    var condition = {
      where: { [Op.or]: [ { email: req.body.email } ] }
    };

    const user = await db[req.params.document].findOne(condition);

    if (user) {
      res.status(400).send({ message: "El correo electrónico proporcionado ya está en uso" });
    } else {
      const hashedPassword = await bcrypt.hash(req.body.password, 10);

      const newUser = await db.users.create({
        name: req.body.name.toUpperCase(),
        email: req.body.email,
        password: hashedPassword,
        role: "ESTUDIANTE",
        isActive: true
      });

      await db.alumnos.create({
        email: req.body.email,
        name: req.body.name,
        career: req.body.career,
        user_id: newUser.id
      });

      const payload = { id: newUser.id, role: newUser.role };

      res.send({
        access_token: jwt.accessTokenEncode(payload),
        refresh_token: jwt.refreshTokenEncode(payload),
        user: newUser
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: error.message });
  }
};

exports.accessToken = async (req, res) => {
  if (!req.body.access_token) {
    res.status(400).send({ message: "Access Token es requerido" });
    return;
  }

  jwt.accessTokenDecode(async function (e) {
    if (e.status) {
      try {
        const user = await db[req.params.document].findByPk(e.data.id, {
          attributes: { exclude: ["password", "createdAt", "updatedAt"] },
        });

        if (!user) {
          res.status(404).send({ message: "Usuario no encontrado" });
        } else {
          res.send(user);
        }
      } catch (error) {
        res.status(500).send({ message: error.message || "Ocurrió un error al obtener el usuario" });
      }
    } else {
      res.status(e.code).send({ message: e.message });
    }
  }, req.body.access_token);
};

exports.refreshToken = async (req, res) => {
  if (!req.body.refresh_token) {
    res.status(400).send({ message: "Refresh Token es requerido" });
    return;
  }

  jwt.refreshTokenDecode(function (e) {
    if (e.status) {
      res.send({
        access_token: jwt.accessTokenEncode(e.data.id),
        refresh_token: jwt.refreshTokenEncode(e.data.id)
      });
    } else {
      res.status(e.code).send({ message: e.message });
    }
  }, req.body.refresh_token);
};
