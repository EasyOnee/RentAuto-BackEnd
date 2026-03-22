const db = require("../../models");
const { Op, Sequelize } = require('sequelize');
const nubariumService = require('../../helpers/nubariumService');

exports.createCliente = async (req, res) => {
    let transaction;

    try {
        transaction = await db.sequelize.transaction();
        const { nombre, paterno, materno, correo_electronico, telefono, telefono_alternativo, fecha_nacimiento, curp, cic, identificadorCiudadano, genero, agente_id, skipINEValidation } = req.body;
        
        if (!nombre || !paterno || !materno || !correo_electronico || !telefono || !fecha_nacimiento || !curp || !cic || !identificadorCiudadano || !genero) {
            return res.status(400).json({ message: "Faltan campos obligatorios" });
        }

        // Si no se solicita omitir la validación del INE, realizarla
        if (!skipINEValidation) {
            const ineResponse = await nubariumService.validarINE(cic, identificadorCiudadano);
            if (ineResponse.estatus !== 'OK' || ineResponse.mensaje !== "Esta vigente como medio de identificacion y puede votar") {
                return res.status(400).json({ message: "El INE no está vigente o los datos no son correctos" });
            }
        }

        // Validar CURP usando el servicio
        /* const curpResponse = await nubariumService.validarCURP(curp);
        if (curpResponse.estatus !== 'OK') {
            return res.status(400).json({ message: "El CURP no es válido" });
        } */

        const cliente = await db.clientes.create({
            nombre,
            paterno,
            materno,
            correo_electronico,
            telefono,
            telefono_alternativo,
            fecha_nacimiento,
            curp,
            cic,
            identificadorCiudadano,
            genero,
            agente_id
        }, { transaction });

        await transaction.commit();

        res.status(201).json({
            message: "Cliente creado exitosamente",
            cliente
        });
    } catch (err) {
        if (transaction) await transaction.rollback();

        console.error('Error al crear el cliente: ', err.message);

        return res.status(500).json({
            message: err.message || "Ocurrió un error al crear el cliente"
        });
    }
};

exports.validateCURP = async (req, res) => {
    try {
        const { curp } = req.body;
        const curpResponse = await nubariumService.validarCURP(curp);

        if (curpResponse.fechaNacimiento) {
            const [day, month, year] = curpResponse.fechaNacimiento.split('/');
            const formattedDate = `${year}-${month}-${day}`;
            curpResponse.fechaNacimiento = formattedDate; // Reemplazar la fecha con el formato correcto
        }

        res.status(200).json(curpResponse);
    } catch (err) {
        return res.status(500).json({
            message: err.message || "Ocurrió un error al validar el CURP"
        });
    }
};

exports.validateINE = async (req, res) => {
    try {
        const { cic, identificadorCiudadano, previousINEData } = req.body;

        // Validar INE usando el servicio
        const ineResponse = await nubariumService.validarINE(cic, identificadorCiudadano);

        if (ineResponse.estatus !== 'OK') {
            return res.status(400).json({ message: "El INE no está vigente o los datos no son correctos" });
        }

        // Comparar datos obtenidos con los anteriores
        const matches = {
            anioEmision: ineResponse.anioEmision === previousINEData.emision,
            claveElector: ineResponse.claveElector === previousINEData.claveElector
        };

        const allMatches = Object.values(matches).every(match => match);

        if (allMatches) {
            return res.status(200).json({
                message: "INE validado correctamente y todos los datos coinciden.",
                status: "OK"
            });
        } else {
            return res.status(200).json({
                message: "INE validado, pero los datos no coinciden completamente. Toma precaución, ya que los datos pueden haber sido modificados.",
                status: "WARNING",
                matches
            });
        }
    } catch (err) {
        return res.status(500).json({
            message: err.message || "Ocurrió un error al validar el INE"
        });
    }
};

exports.obtenerDatosINE = async (req, res) => {
    try {
        const { id, idReverso } = req.body;

        if (!id || !idReverso) {
            return res.status(400).json({ message: "Faltan los campos obligatorios: id y idReverso" });
        }

        const datosINE = await nubariumService.obtenerDatosINE(id, idReverso);
        res.status(200).json(datosINE);
    } catch (err) {
        return res.status(500).json({
            message: err.message || "Ocurrió un error al obtener los datos del INE"
        });
    }
};

exports.findClienteById = async (req, res) => {
    try {
        const { idValue } = req.body;  // Puede ser CURP o CIC

        console.log('Buscando cliente con ID: ', idValue);

        // Buscar en la tabla de clientes
        const cliente = await db.clientes.findOne({
            where: {
                [Op.or]: [
                    { curp: idValue },
                    Sequelize.where(Sequelize.cast(Sequelize.col('cic'), 'TEXT'), idValue)
                ]
            }
        });
        
        const clienteData = cliente ? {
            id: cliente.id,
            nombre: cliente.nombre,
            paterno: cliente.paterno,
            materno: cliente.materno
        } : null;

        if (cliente) {
            return res.status(200).json(clienteData);
        } else {
            return res.status(404).json({ message: "Cliente no encontrado" });
        }
    } catch (err) {
        console.error('Error al buscar el cliente: ', err);
        return res.status(500).json({
            message: err.message || "Ocurrió un error al buscar el cliente"
        });
    }
};

// Método para obtener sugerencias de clientes por nombre
exports.getNombreSugerencias = async (req, res) => {
    const { nombre } = req.query;
    try {
        const clientes = await db.clientes.findAll({
            where: {
                [Op.or]: [
                    { nombre: { [Op.iLike]: `%${nombre}%` } },
                    { paterno: { [Op.iLike]: `%${nombre}%` } },
                    { materno: { [Op.iLike]: `%${nombre}%` } }
                ]
            },
            limit: 5  // Limita el número de resultados
        });
        res.status(200).json(clientes);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener sugerencias de nombres" });
    }
};

exports.getClientes = async (req, res) => {
    try {
        const clientes = await db.clientes.findAll();

        res.status(200).json(clientes);
    } catch (err) {
        return res.status(500).json({
            message: err.message || "Ocurrió un error al obtener los clientes"
        });
    }
};

exports.getTotalClientes = async (req, res) => {
    try {
        const totalClientes = await db.clientes.count();

        res.status(200).json({ total: totalClientes });
    } catch (error) {
        console.error('Error al obtener el total de clientes:', error.message);
        res.status(500).json({
            message: 'Error al obtener el total de clientes',
            error: error.message
        });
    }
};

