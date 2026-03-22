const db = require("../../models");

exports.crearTipo = async (req, res) => {
    let transaction;
    
    try {
        transaction = await db.sequelize.transaction();

        const { nombre, agente_id } = req.body;

        const tipo = await db.tipos.create({
            nombre: nombre,
            agente_id: agente_id
        }, { transaction });

        await transaction.commit();

        res.status(201).json({ message: "Tipo de vehículo creado correctamente", data: tipo });
    } catch (err) {
        if (transaction) await transaction.rollback();

        return res.status(500).json({
            message: err.message || "Ocurrió un error al crear el tipo de vehículo"
        });
    }
};

exports.obtenerTipos = async (req, res) => {
    try {
        const tipos = await db.tipos.findAll();

        res.status(200).json(tipos);
    } catch (err) {
        return res.status(500).json({
            message: err.message || "Ocurrió un error al obtener los tipos de vehículo"
        });
    }
};
