const db = require("../models");
const bcrypt = require("bcrypt");

exports.createUser = async (req, res) => {
    const { name, email, password, role } = req.body;

    try {
        const user = await db.users.findOne({ where: { email: email }});

        if (user) {
            return res.status(400).json({ message: "El usuario ya existe" });
        }

        const hashPassword = await bcrypt.hash(String(password), 10);

        const newUser = await db.users.create({
            name: name,
            email: email,
            password: hashPassword,
            role: role,
            isActive: true
        });

        res.status(201).json({ message: "Usuario creado exitosamente", data: newUser });
    } catch (err) {
        return res.status(500).json({
            message: err.message || "Ocurrió un error al crear el usuario"
        });
    }
};

exports.getUsers = async (req, res) => {
    try {
        const userAttributes = ["id", "name", "email", "role", "isActive", "createdAt", "updatedAt"];

        const users = await db.users.findAll({ attributes: userAttributes });

        const responseData = users.map(user => ({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            isActive: user.isActive ? "Activo" : "Inactivo",
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        }));

        res.status(200).json(responseData);
    } catch (err) {
        return res.status(500).json({
            message: err.message || "Ocurrió un error al obtener los usuarios"
        });
    }
};
