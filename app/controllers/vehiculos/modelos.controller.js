const db = require("../../models");

exports.getModelos = async (req, res) => {
    try {
        const modelos = await db.modelos.findAll({
            attributes: ['id', 'nombre', 'createdAt', 'updatedAt'],
            include: [{
                model: db.marcas,
                as: 'marca',
                attributes: ['nombre']
            }]
        });

        // Transformar los resultados para devolver los nombres de marca
        const modelosConNombres = modelos.map(modelo => ({
            id: modelo.id,
            nombre: modelo.nombre,
            createdAt: modelo.createdAt,
            updatedAt: modelo.updatedAt,
            marca: modelo.marca.nombre
        }));

        res.status(200).json(modelosConNombres);
    } catch (err) {
        return res.status(500).json({
            message: err.message || "Ocurrió un error al obtener los modelos"
        });
    }
};
