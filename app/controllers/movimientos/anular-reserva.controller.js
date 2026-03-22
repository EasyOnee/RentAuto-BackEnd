const db = require('../../models'); 

exports.anularReserva = async (req, res) => {
    try {
        const { folio, motivoAnulacion } = req.body;

        // Verificar que los parámetros requeridos están presentes
        if (!folio || !motivoAnulacion) {
            return res.status(400).json({ message: "Faltan parámetros requeridos para anular la reserva" });
        }

        // Buscar la reserva por su folio
        const reserva = await db.reservas.findOne({ where: { folio } });
        if (!reserva) {
            return res.status(404).json({ message: "Reserva no encontrada" });
        }

        // Verificar si la reserva ya ha sido cancelada previamente
        if (reserva.estado === 'CANCELADA') {
            return res.status(400).json({ message: "La reserva ya ha sido cancelada previamente" });
        }

        // Actualizar el estado de la reserva a 'CANCELADA' y registrar el motivo de anulación
        reserva.estado = 'CANCELADA';
        reserva.motivoAnulacion = motivoAnulacion;
        await reserva.save();

        // Cambiar el estado del vehículo asociado a 'DISPONIBLE'
        const vehiculo = await reserva.getVehiculo();
        if (vehiculo) {
            vehiculo.estado = 'DISPONIBLE';
            await vehiculo.save();
        }

        const registroTemporal = await db.temp_liberados.findOne({ where: { folioReserva: folio } });

        if (registroTemporal) {
            await db.temp_liberados.destroy({ where: { folioReserva: folio } });
        } else {
            console.log(`No se encontró ningún registro en la tabla temporal con el folio ${folio}.`);
        }

        res.status(200).json({ message: "Reserva anulada con éxito", reserva });

    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({
                message: "Error: El número de serie del vehículo ya existe en la base de datos.",
                detail: error.message
            });
        }

        console.error("Error al anular la reserva:", error.message);
        res.status(500).json({ message: `Error al anular la reserva: ${error.message}` });
    }
};




// Funcion para traer todas la reservas del tipo trasaccion de ALQUILER Y RESERVA que esten activas
exports.getReservasActivas = async (req, res) => {
    try {
        // Filtra las reservas que tienen estado "ACTIVA" o "PENDIENTE"
        const reservasActivasYPendientes = await db.reservas.findAll({
            where: {
                estado: ['ACTIVA', 'PENDIENTE'] // Ajusta el filtro para incluir ambos estados
            },
            include: [
                {
                    model: db.clientes,
                    as: 'cliente',
                    attributes: ['nombre', 'paterno', 'materno', 'telefono']
                }
            ]
        });
    
        // Mapea los datos para la respuesta
        const data = reservasActivasYPendientes.map(reserva => ({
            id: reserva.id,
            folio: reserva.folio,
            tipo_transaccion: reserva.tipo_transaccion,
            estado: reserva.estado,
            fecha_salida: reserva.fecha_salida,
            fecha_llegada: reserva.fecha_llegada,
            createdAt: reserva.createdAt,
            cliente: `${reserva.cliente.nombre} ${reserva.cliente.paterno} ${reserva.cliente.materno}`,
            telefono: reserva.cliente.telefono
        }));
    
        res.status(200).json(data);
    } catch (error) {
        console.error('Error al filtrar las reservas activas y pendientes:', error.message);
        res.status(500).json({
            message: 'Error al filtrar las reservas activas y pendientes',
            error: error.message
        });
    }
};
