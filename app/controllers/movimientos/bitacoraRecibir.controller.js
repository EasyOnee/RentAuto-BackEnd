const db = require("../../models");

exports.createBitacora = async (req, res) => {
    try {
        const { folioReserva, id_vehiculo, kilometraje_recibido, combustible_recibido, receivedBy, observaciones } = req.body;

        if (!folioReserva || !id_vehiculo || !kilometraje_recibido || !combustible_recibido || !receivedBy) {
            console.error('Faltan datos obligatorios o son null:', {
                folioReserva,
                id_vehiculo,
                kilometraje_recibido,
                combustible_recibido,
                receivedBy
            });
            return res.status(400).json({ message: "Todos los campos requeridos deben estar completos y no ser null." });
        }

        // Buscar el usuario que liberó en la tabla temporal `TempLiberados`
        const liberado = await db.temp_liberados.findOne({ where: { folioReserva } });

        let releasedBy = null;
        if (liberado) {
            releasedBy = liberado.usuario_id; // Asigna el usuario encontrado
        }

        // Crea la bitácora en la base de datos con los datos necesarios
        const bitacora = await db.bitacoraRecibir.create({
            folioReserva: folioReserva,
            id_vehiculo: id_vehiculo,
            kilometraje_recibido: kilometraje_recibido,
            combustible_recibido: combustible_recibido,
            receivedBy: receivedBy,
            releasedBy: releasedBy, // Inserta el usuario que liberó
            observaciones: observaciones || ''
        });

        // Actualiza el kilometraje en el modelo vehiculos
        await db.vehiculos.update(
            { kms: kilometraje_recibido },
            { where: { id: id_vehiculo } }
        );

        // Limpia la tabla temporal si es necesario
        if (liberado) {
            await db.temp_liberados.destroy({ where: { folioReserva } });
        }

        // Responde con el objeto creado
        res.status(201).json(bitacora);
    } catch (err) {
        console.error('Error al crear la bitácora de recibir:', err);
        res.status(500).json({
            message: err.message || "Ocurrió un error al crear la bitácora de recibir"
        });
    }
};


// Función para guardar en la tabla temporal
exports.guardarTempLiberado = async (req, res) => {
    try {
        const { usuario_id, folioReserva } = req.body;

        // Verifica que ambos valores no sean null
        if (!usuario_id || !folioReserva) {
            return res.status(400).json({ message: "El usuario y el folio de la reserva son requeridos." });
        }

        // Inserta en la tabla temporal
        const tempLiberado = await db.temp_liberados.create({
            usuario_id: usuario_id,
            folioReserva: folioReserva
        });

        res.status(201).json(tempLiberado);
    } catch (err) {
        console.error('Error al guardar en la tabla temporal:', err);
        res.status(500).json({
            message: err.message || "Ocurrió un error al guardar en la tabla temporal"
        });
    }
};
