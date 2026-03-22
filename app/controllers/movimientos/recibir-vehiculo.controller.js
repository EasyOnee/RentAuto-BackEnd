const db = require("../../models");

exports.getData = async (req, res) => {
    try {
        const { id } = req.params;

        const reserva = await db.reservas.findByPk(id, {
            attributes: [
                'folio', 'tipo_transaccion', 'kms_salida', 'nivel_tanque', 
                'fecha_salida', 'fecha_llegada', 'deposito', 'formaPagoDeposito', 
                'numeroDocDeposito', 'totalRenta', 'formaPagoRenta', 'numeroDocRenta', 'nivel_tanque', 'kms_salida'
            ],
            include: [
                {
                    model: db.clientes,
                    as: 'cliente',
                    attributes: [
                        'id', 'nombre', 'paterno', 'materno', 'curp', 'telefono'
                    ]
                },
                {
                    model: db.vehiculos,
                    as: 'vehiculo',
                    attributes: [
                        'id', 'folio', 'deposito', 'color', 'num_serie', 
                        'placa', 'kms', 'ano', 'cilindros', 'estado', 
                        'combustible', 'tarifa_diaria', 'dia_adicional', 
                        'hora_adicional'
                    ],
                    include: [
                        {
                            model: db.modelos,
                            as: 'modelo',
                            attributes: ['nombre'],
                            include: [
                                {
                                    model: db.marcas,
                                    as: 'marca',
                                    attributes: ['nombre']
                                }
                            ]
                        },
                        {
                            model: db.tipos,
                            as: 'tipo',
                            attributes: ['nombre']
                        }
                    ]
                }
            ]
        });

        if (!reserva) {
            return res.status(404).json({ message: "Reserva no encontrada" });
        }

        // Estructura de los datos para la respuesta
        const data = {
            reserva: {
                folio: reserva.folio,
                tipo_transaccion: reserva.tipo_transaccion,
                nivel_tanque: reserva.nivel_tanque,
                fecha_salida: reserva.fecha_salida,
                fecha_llegada: reserva.fecha_llegada,
                deposito: reserva.deposito,
                formaPagoDeposito: reserva.formaPagoDeposito,
                numeroDocDeposito: reserva.numeroDocDeposito,
                totalRenta: reserva.totalRenta,
                formaPagoRenta: reserva.formaPagoRenta,
                numeroDocRenta: reserva.numeroDocRenta,
                nivel_tanque: reserva.nivel_tanque,
                kms_salida: reserva.kms_salida
            },
            cliente: {
                id: reserva.cliente.id,
                nombre: reserva.cliente.nombre,
                paterno: reserva.cliente.paterno,
                materno: reserva.cliente.materno,
                curp: reserva.cliente.curp,
                telefono: reserva.cliente.telefono,
                correo_electronico: reserva.cliente.correo_electronico,
                nacionalidad: reserva.cliente.nacionalidad,
                fecha_nacimiento: reserva.cliente.fecha_nacimiento,
                genero: reserva.cliente.genero,
                direccion: reserva.cliente.direccion,
                ciudad: reserva.cliente.ciudad,
                estado: reserva.cliente.estado,
                pais: reserva.cliente.pais,
                codigo_postal: reserva.cliente.codigo_postal
            },
            vehiculo: {
                id: reserva.vehiculo.id,
                folio: reserva.vehiculo.folio,
                marca: reserva.vehiculo.modelo?.marca?.nombre,  // Nombre de la marca
                modelo: reserva.vehiculo.modelo?.nombre,  // Nombre del modelo
                deposito: reserva.vehiculo.deposito,
                color: reserva.vehiculo.color,
                num_serie: reserva.vehiculo.num_serie,
                placa: reserva.vehiculo.placa,
                kms: reserva.vehiculo.kms,
                ano: reserva.vehiculo.ano,
                cilindros: reserva.vehiculo.cilindros,
                estado: reserva.vehiculo.estado,
                combustible: reserva.vehiculo.combustible,
                tarifa_diaria: reserva.vehiculo.tarifa_diaria,
                dia_adicional: reserva.vehiculo.dia_adicional,
                hora_adicional: reserva.vehiculo.hora_adicional,
                foto: reserva.vehiculo.foto,
                tipo: reserva.vehiculo.tipo?.nombre  // Nombre del tipo de vehículo
            }
        };

        // Enviar la respuesta con la estructura de datos
        res.status(200).json(data);
    } catch (error) {
        console.error("Error al obtener la información de la reserva:", error.message);
        res.status(500).json({ message: `Error al obtener la información de la reserva: ${error.message}` });
    }
};

exports.receiveVehicle = async (req, res) => {
    try {
        const { folio, nuevaFechaLlegada, diferenciaAPagar } = req.body;

        const reserva = await db.reservas.findOne({ where: { folio } });
        if (!reserva) {
            return res.status(404).json({ message: "Reserva no encontrada" });
        }
  
        reserva.nueva_fecha_llegada = nuevaFechaLlegada;
  
        const vehiculo = await reserva.getVehiculo();
        vehiculo.estado = 'DISPONIBLE';
        await vehiculo.save();

        if (diferenciaAPagar > 0) {
            // Lógica para cobrar la diferencia

            reserva.hay_diferencia = true;
            reserva.diferencia = diferenciaAPagar;
            reserva.estado = 'FINALIZADA';

            // Crear un nuevo movimiento de cobro
            /* const movimiento = await db.movimientos.create({
                folio: `MOV-${Date.now()}`,
                tipo_transaccion: 'COBRO',
                concepto: 'DIFERENCIA DE PAGO',
                monto: diferenciaAPagar,
                fecha: new Date(),
                cliente_id: reserva.cliente_id
            }); */
        } else {
            reserva.estado = 'FINALIZADA';
        }
  
        await reserva.save();
        res.status(200).json({ message: "Vehículo recibido con éxito", reserva });
    } catch (error) {
        console.error("Error al recibir el vehículo:", error.message);
        res.status(500).json({ message: `Error al recibir el vehículo: ${error.message}` });
    }
};
