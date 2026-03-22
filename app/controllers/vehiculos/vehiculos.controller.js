const db = require("../../models");

exports.createVehiculo = async (req, res) => {
    let transaction;

    console.log(req);
    try {
        transaction = await db.sequelize.transaction();
        const { marca_id, modelo_id, deposito, color, num_serie, placa, kms, ano, cilindros, estado, combustible, tipo_id, tarifa_diaria, dia_adicional, hora_adicional, agente_id } = req.body;
        if (!marca_id || !modelo_id || !deposito || !color || !num_serie || !placa || !kms || !ano || !cilindros || !estado || !combustible || !tipo_id || !tarifa_diaria || !dia_adicional || !hora_adicional) {
            return res.status(400).json({ message: "Faltan campos obligatorios" });
        }

        let folio = generateFolio();

        const vehiculo = await db.vehiculos.create({
            folio: folio,
            marca_id: marca_id,
            modelo_id: modelo_id,
            deposito: deposito,
            color: color,
            num_serie: num_serie,
            placa: placa,
            kms: kms,
            ano: ano,
            cilindros: cilindros,
            estado: estado,
            combustible: combustible,
            tipo_id: tipo_id,
            tarifa_diaria: tarifa_diaria,
            dia_adicional: dia_adicional,
            hora_adicional: hora_adicional,
            foto: req.fileUrl,
            agente_id: agente_id
        }, { transaction });

        await transaction.commit();

        res.status(201).json({
            message: "Vehículo creado exitosamente",
            vehiculo
        });
    } catch (err) {
        if (transaction) await transaction.rollback();

        return res.status(500).json({
            message: err.message || "Ocurrió un error al crear el vehículo"
        });
    }
};

exports.getVehiculos = async (req, res) => {
    try {
        const vehiculos = await db.vehiculos.findAll({
            attributes: ['id', 'ano', 'estado', 'createdAt', 'updatedAt', 'num_serie', 'placa'],
            include: [{
                model: db.modelos,
                as: 'modelo',
                attributes: ['nombre'],
                include: [{
                    model: db.marcas,
                    as: 'marca',
                    attributes: ['nombre']
                }]
            }]
        });

        // Transformar los resultados para devolver los nombres de marca y modelo
        const vehiculosConNombres = vehiculos.map(vehiculo => ({
            id: vehiculo.id,
            ano: vehiculo.ano,
            createdAt: vehiculo.createdAt,
            updatedAt: vehiculo.updatedAt,
            num_serie: vehiculo.num_serie,
            placa: vehiculo.placa,
            marca: vehiculo.modelo.marca.nombre,
            modelo: vehiculo.modelo.nombre,
            estado: vehiculo.estado
        }));

        res.status(200).json(vehiculosConNombres);
    } catch (err) {
        return res.status(500).json({
            message: err.message || "Ocurrió un error al obtener los vehículos"
        });
    }
};

exports.getInputData = async (req, res) => {
    try {
        const brands = await db.marcas.findAll({
            attributes: { exclude: ["agente_id", "createdAt", "updatedAt"] }
        });
        
        const models = await db.modelos.findAll({
            attributes: { exclude: ["agente_id", "createdAt", "updatedAt"] }
        });
        
        const types = await db.tipos.findAll({
            attributes: { exclude: ["agente_id", "createdAt", "updatedAt"] }
        });

        const data = {
            brands: brands,
            models: models,
            types: types
        }

        res.status(200).json(data);
    } catch (err) {
        return res.status(500).json({
            message: err.message || "Ocurrió un error al obtener los datos"
        });
    }
};

exports.getVehiculosPaginados = async (req, res) => {
    const { page, size, search } = req.query;
    const limit = size ? +size : 10;
    const offset = page ? page * limit : 0;

    try {
        const query = {
            where: {
                // Filtra los vehículos que están "DISPONIBLES" o "RESERVADOS"
                estado: {
                    [db.Sequelize.Op.or]: ['DISPONIBLE', 'RESERVADO', 'ALQUILADO']
                }
            },
            limit,
            offset,
            attributes: ['id', 'placa', 'ano', 'estado', 'color', 'tarifa_diaria', 'hora_adicional', 'deposito'],
            include: [{
                model: db.modelos,
                as: 'modelo',
                attributes: ['nombre'],
                include: [{
                    model: db.marcas,
                    as: 'marca',
                    attributes: ['nombre']
                }]
            }, {
                model: db.tipos,
                as: 'tipo',
                attributes: ['nombre']
            }]
        };

        if (search) {
            query.where[db.Sequelize.Op.or] = [
                { 'placa': { [db.Sequelize.Op.iLike]: `%${search}%` } },
                { '$modelo.marca.nombre$': { [db.Sequelize.Op.iLike]: `%${search}%` } },
                { '$modelo.nombre$': { [db.Sequelize.Op.iLike]: `%${search}%` } },
                { 'color': { [db.Sequelize.Op.iLike]: `%${search}%` } }
            ];
        }

        const vehiculos = await db.vehiculos.findAndCountAll(query);

        res.status(200).json({
            totalItems: vehiculos.count,
            data: vehiculos.rows,
            totalPages: Math.ceil(vehiculos.count / limit),
            currentPage: page ? +page : 0
        });
    } catch (err) {
        res.status(500).json({
            message: err.message || "Ocurrió un error al obtener los vehículos"
        });
    }
};

exports.getVehiculosEstado = async (req, res) => {
    try {
        const vehiculos = await db.vehiculos.findAll({
            attributes: ['estado']
        });

        const estados = vehiculos.map(vehiculo => vehiculo.estado);
        const estadosUnicos = ["DISPONIBLE", "MANTENIMIENTO", "REPARACION", "NO_DISPONIBLE", "RESERVADO", "ALQUILADO"];

        // Conteo de los estados de los vehículos
        const estadosConteo = {};
        estadosUnicos.forEach(estado => {
            estadosConteo[estado] = estados.filter(e => e === estado).length;
        });

        // Aseguramos de que todos los estados existentes estén en el objeto de conteo
        estadosUnicos.forEach(estado => {
            if (!estadosConteo.hasOwnProperty(estado)) {
            estadosConteo[estado] = 0;
            }
        });

        res.status(200).json(estadosConteo);
    } catch (err) {
        res.status(500).json({
            message: err.message || "Ocurrió un error al obtener los estados de los vehículos"
        });
    }
};

// Función para generar un folio de identificación
function generateFolio() {
    const random = Math.floor(100000000 + Math.random() * 900000000);
    const folio = `${random}`;
    return folio;
}

exports.getTotalVehiculos = async (req, res) => {
    try {
        const totalVehiculos = await db.vehiculos.count();

        res.status(200).json({ total: totalVehiculos });
    } catch (error) {
        console.error('Error al obtener el total de vehículos:', error.message);
        res.status(500).json({
            message: 'Error al obtener el total de vehículos',
            error: error.message
        });
    }
};

exports.viewVehicle = async (req, res) => {
    const { id } = req.params;
    try {
        const vehiculo = await db.vehiculos.findByPk(id, {
            attributes: ['id', 'folio', 'marca_id', 'modelo_id', 'deposito', 'color', 'num_serie', 'placa', 'kms', 'ano',
                        'cilindros', 'estado', 'combustible', 'tipo_id', 'tarifa_diaria', 'dia_adicional', 'hora_adicional',
                        'foto', 'agente_id'],
            include: [{
                model: db.modelos,
                as: 'modelo',
                attributes: ['nombre'],
                include: [{
                    model: db.marcas,
                    as: 'marca',
                    attributes: ['nombre']
                }]
            }]
        });

        if (!vehiculo) {
            return res.status(404).json({ message: `No se encontró el vehículo con el id ${id}` });
        }

        res.status(200).json(vehiculo);

    }
    catch (error) {
        console.error('Error al obtener el vehículo:', error.message);
        res.status(500).json({
            message: 'Error al obtener el vehículo',
            error: error.message
        });
    }
};

exports.getKilometrajeHistorial = async (req, res) => {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const offset = (page - 1) * limit;

    try {
        // Obtener las reservas con paginación y ordenadas por fecha de creación descendente
        const reservas = await db.reservas.findAndCountAll({
            where: { vehiculo_id: id },
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['createdAt', 'DESC']], // Ordenar por createdAt descendente
            attributes: ['folio', 'kms_salida', 'createdAt', 'destino'],
        });

        // Obtener los folios de las reservas paginadas
        const folios = reservas.rows.map(reserva => reserva.folio);

        // Obtener los registros de bitácora asociados a esos folios
        const bitacoras = await db.bitacoraRecibir.findAll({
            where: { folioReserva: folios },
            attributes: ['folioReserva', 'kilometraje_recibido', 'releasedBy', 'receivedBy']
        });

        // Obtener todos los usuarios
        const usuarios = await db.users.findAll({
            attributes: ['id', 'name']
        });

        // Mapear los usuarios para un acceso rápido por ID
        const usuariosMap = usuarios.reduce((map, usuario) => {
            map[usuario.id] = usuario.name;
            return map;
        }, {});

        // Combinar los datos de reservas, bitácoras y usuarios
        const kilometrajeHistorial = reservas.rows.map(reserva => {
            const bitacora = bitacoras.find(b => String(b.folioReserva) === String(reserva.folio));
            return {
                folio: reserva.folio,
                kms_salida: reserva.kms_salida,
                createdAt: reserva.createdAt,
                destino: reserva.destino,
                kilometraje_recibido: bitacora ? bitacora.kilometraje_recibido : null,
                kilometraje_usado: bitacora ? (bitacora.kilometraje_recibido - reserva.kms_salida) : null,
                releasedBy_name: bitacora && bitacora.releasedBy ? usuariosMap[bitacora.releasedBy] : null,
                receivedBy_name: bitacora && bitacora.receivedBy ? usuariosMap[bitacora.receivedBy] : null 
            };
        });

        res.status(200).json({
            totalRecords: reservas.count,
            totalPages: Math.ceil(reservas.count / limit),
            currentPage: parseInt(page),
            data: kilometrajeHistorial
        });
    } catch (error) {
        console.error('Error al obtener el historial de kilometraje:', error.message);
        res.status(500).json({
            message: 'Error al obtener el historial de kilometraje',
            error: error.message
        });
    }
};



