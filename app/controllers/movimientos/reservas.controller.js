const PDFDocument = require('pdfkit-table');
const db = require("../../models");
const axios = require('axios');
const { where } = require('sequelize');

exports.createReserva = async (req, res) => {
    let transaction;

    try {
        transaction = await db.sequelize.transaction();

        const {
            tipo_transaccion,
            cliente_id,
            vehiculo_id,
            fecha_salida,
            fecha_llegada,
            deposito,
            formaPagoDeposito,
            numeroDocDeposito,
            totalRenta,
            formaPagoRenta,
            numeroDocRenta,
            agente_id,
            destino
        } = req.body;

        //si un campo esta vacio manda un errorr
        if (!tipo_transaccion || !cliente_id || !vehiculo_id || !fecha_salida || !fecha_llegada || !deposito || !formaPagoDeposito || !numeroDocDeposito || !totalRenta || !formaPagoRenta || !numeroDocRenta || !agente_id || !destino) {
            return res.status(400).json({ message: "Todos los campos son requeridos" });
        }

        // Generación de folio único para la reserva
        let folio = generateFolio();

        // Estado de la reserva siempre será "PENDIENTE"
        let estadoReserva = "PENDIENTE";

        // Crea la reserva
        const reserva = await db.reservas.create({
            folio,
            tipo_transaccion,
            cliente_id,
            vehiculo_id,
            fecha_salida,
            fecha_llegada,
            deposito,
            formaPagoDeposito,
            numeroDocDeposito,
            totalRenta,
            formaPagoRenta,
            numeroDocRenta,
            agente_id,
            estado: estadoReserva,
            destino
        }, { transaction });

        // Lógica para actualizar el estado del vehículo
        let nuevoEstado;
        if (tipo_transaccion === "RESERVA") {
            nuevoEstado = "RESERVADO";
        } else if (tipo_transaccion === "ALQUILER") {
            nuevoEstado = "ALQUILADO";
        }

        // Actualiza el estado del vehículo
        await db.vehiculos.update(
            { estado: nuevoEstado },
            { where: { id: vehiculo_id }, transaction }
        );

        await transaction.commit();

        // Obtenemos los detalles del cliente, agente y vehículo
        const cliente = await db.clientes.findByPk(cliente_id);
        const agente = await db.users.findByPk(agente_id);
        const vehiculo = await db.vehiculos.findByPk(vehiculo_id, {
            include: [
                {
                    model: db.modelos,
                    as: 'modelo',
                    include: [
                        {
                            model: db.marcas,
                            as: 'marca'
                        }
                    ]
                }
            ]
        });        

        // Genera los PDFs de recibo y pagaré
        const pdfRecibo = await generateReceiptPDF(folio, cliente, agente, vehiculo, fecha_salida, fecha_llegada, deposito, totalRenta);
        const pdfPagare = await generatePagarePDF(folio, cliente, vehiculo, totalRenta);

        res.status(201).json({
            message: "Reserva creada exitosamente", reserva
            //pdfRecibo: pdfRecibo.toString('base64'),
            //pdfPagare: pdfPagare.toString('base64')
        });
    } catch (err) {
        // Solo se intenta el rollback si la transacción no ha sido comprometida
        if (transaction && !transaction.finished) {
            await transaction.rollback();
        }

        console.error('Error al crear la reservación: ', err.message);

        return res.status(500).json({
            message: err.message || "Ocurrió un error al crear la reservación"
        });
    }
};

// Función para generar un folio de identificación
function generateFolio() {
    const random = Math.floor(100000000 + Math.random() * 900000000);
    const folio = `${random}`;
    return folio;
}


// Función para generar el PDF de pagaré utilizando pdfkit
async function generatePagarePDF(createdAt, cliente) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        let buffers = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
            const pdfData = Buffer.concat(buffers);
            resolve(pdfData);
        });

        const nombreCliente = `${cliente.nombre.split(' ').map(name => name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()).join(' ')} ${cliente.paterno.charAt(0).toUpperCase()}${cliente.paterno.slice(1).toLowerCase()} ${cliente.materno.charAt(0).toUpperCase()}${cliente.materno.slice(1).toLowerCase()}`;
        const currentYear = new Date().getFullYear();
        
        // Formato de la fecha: "23 Agosto del 2024"
        const fechaCreacion = new Date(createdAt).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }).replace(' del ', ' de ');

        doc.moveTo(0, doc.y).lineTo(600, doc.y).stroke();

        doc.moveDown();

        doc.fontSize(18).text('PAGARÉ', { align: 'left' });

        // bueno por
        doc.fontSize(12).text('BUENO POR: $ 100,000.00', { align: 'right' });

        doc.moveDown();

        // Contenido del pagaré
        doc.fontSize(12)
            .text(`En _______________ a _______________ de _______________ ${currentYear}`, { align: 'right' })
            .moveDown(2);

        doc.fontSize(12).text('Debo y pagaré incondicionalmente por este pagaré a la orden de: Grupo Siseson SA de CV', { align: 'justify' });
        doc.fontSize(12).text(`en Ciudad Obregón, Sonora, México el ${fechaCreacion}. La cantidad de: Cien Mil Pesos 00/100`, { align: 'justify' });
        doc.moveDown();
        doc.fontSize(12).text('Valor recibido a mi entera satisfacción. Este pagaré forma parte de una serie numerada del 1 al 100 y todos están sujetos a la condición de que, al no pagarse cualquiera de ellos a su vencimiento, serán exigibles todos los que les sigan en número, además de ya vencidos, desde la fecha de vencimiento de este documento hasta el día de su liquidación, causará intereses moratorios al tipo de 20% mensual, pagadero en esta ciudad juntamente con el principal.', { align: 'justify' });

        doc.moveDown(2);

        // Firma y detalles del cliente
        doc.fontSize(12).text(`Nombre:   _______________`, { align: 'left' });
        doc.fontSize(12).text('Domicilio: _______________', { align: 'left' });
        doc.moveUp();
        doc.fontSize(12).text('Firma: ________________________', { align: 'right' });
        
        doc.fontSize(12).text('Ciudad:    _______________', { align: 'left' });
        doc.moveUp();
        doc.fontSize(12).text('ACEPTO', { align: 'right', indent: 180 });

        doc.moveDown();

        doc.moveTo(0, doc.y).lineTo(600, doc.y).stroke();

        doc.moveDown(25);

        doc.fontSize(12).text(`${nombreCliente}`, { align: 'center' });
        doc.fontSize(10).text('FIRMA', { align: 'center' });

        doc.end();
    });
}

exports.getReservas = async (req, res) => {
    try {
        const reservas = await db.reservas.findAll({
            attributes: ['id', 'folio', 'tipo_transaccion', 'estado', 'fecha_salida', 'fecha_llegada', 'createdAt'],
            include: [{
                model: db.clientes,
                as: 'cliente',
                attributes: ['nombre', 'paterno', 'materno'],
            }]
        });

        const data = reservas.map(reserva => ({
            id: reserva.id,
            cliente: `${reserva.cliente.nombre} ${reserva.cliente.paterno} ${reserva.cliente.materno}`,
            createdAt: reserva.createdAt,
            folio: reserva.folio,
            fecha_salida: reserva.fecha_salida,
            fecha_llegada: reserva.fecha_llegada,
            tipo_transaccion: reserva.tipo_transaccion,
            estado: reserva.estado
            // vehiculo property removed as it's no longer needed
        }));

        res.status(200).json(data);
    } catch (err) {
        console.error('Error al obtener las reservaciones: ', err.message);

        return res.status(500).json({
            message: err.message || "Ocurrió un error al obtener las reservaciones"
        });
    }
};

exports.getDateReservas = async (req, res) => {
    // Obtener todas las reservas del vehículo asociado al ID recibido en el parámetro id, 
    // y devolver la fecha de salida y la fecha de llegada de cada reserva.
    try {
        const { id } = req.params; // Asegúrate de que 'id' sea el ID del vehículo.
        const reservas = await db.reservas.findAll({
            attributes: ['fecha_salida', 'fecha_llegada'],
            // Filtrar por ID del vehículo y por el estado de la reserva ACTIVO Y PENDIENTE
            where: { vehiculo_id: id, estado: ['ACTIVA', 'PENDIENTE'] },
            include: [
                {
                    model: db.vehiculos,
                    as: 'vehiculo',
                    attributes: [] // No necesitamos atributos del vehículo, solo para asegurar la relación.
                }
            ]
        });

        // Formatear los datos para enviarlos como respuesta.
        const data = reservas.map(reserva => ({
            fecha_salida: reserva.fecha_salida,
            fecha_llegada: reserva.fecha_llegada
        }));

        res.status(200).json(data); // Respuesta exitosa con las fechas de las reservas.
    } catch (err) {
        console.error('Error al obtener las fechas de las reservaciones:', err.message);

        // Responder con un error 500 si ocurre algún problema.
        return res.status(500).json({
            message: err.message || "Ocurrió un error al obtener las fechas de las reservaciones"
        });
    }
};


exports.getReservaDetalle = async (req, res) => {
    try {
        const { id } = req.params;
        const reserva = await db.reservas.findByPk(id, {
            attributes: ['id', 'folio', 'tipo_transaccion', 'fecha_salida', 'fecha_llegada', 'destino', 'estado', 'anularReserva', 'deposito', 'formaPagoDeposito', 'totalRenta', 'formaPagoRenta', 'createdAt'],
            include: [
                {
                    model: db.clientes,
                    as: 'cliente',
                    attributes: ['nombre', 'paterno', 'materno', 'telefono']
                },
                {
                    model: db.vehiculos,
                    as: 'vehiculo',
                    attributes: ['num_serie', 'placa', 'ano'],
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
                        }
                    ]
                },
                {
                    model: db.users,
                    as: 'agente',
                    attributes: ['name']
                }
            ]
        });

        if (!reserva) {
            return res.status(404).json({ message: "Reservación no encontrada" });
        }

        // Cálculo de días de renta
        const diffTime = new Date(reserva.fecha_llegada) - new Date(reserva.fecha_salida);
        const horasRenta = diffTime / (1000 * 60 * 60);
        const diasRenta = Math.floor(horasRenta / 24); // Utiliza Math.floor para contar solo días completos

        // Verifica si hay horas adicionales que podrían sumar un día adicional según tu regla de negocio
        const horasRestantes = horasRenta % 24;
        const diasRentaFinal = (horasRestantes > 0 && horasRestantes >= 2) ? diasRenta + 1 : diasRenta; // Añade un día adicional si las horas restantes son 2 o más

        // Formatea el nombre completo del cliente
        const nombreCliente = `${reserva.cliente.nombre.split(' ').map(name => name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()).join(' ')} ${reserva.cliente.paterno.charAt(0).toUpperCase()}${reserva.cliente.paterno.slice(1).toLowerCase()} ${reserva.cliente.materno.charAt(0).toUpperCase()}${reserva.cliente.materno.slice(1).toLowerCase()}`;

        // Construir el objeto de respuesta excluyendo los atributos no deseados
        const response = {
            folio: reserva.folio,
            tipo_transaccion: reserva.tipo_transaccion,
            fecha_salida: reserva.fecha_salida,
            fecha_llegada: reserva.fecha_llegada,
            destino: reserva.destino,
            estado: reserva.estado,
            anularReserva: reserva.anularReserva,
            diasRenta,
            deposito: reserva.deposito,
            formaPagoDeposito: reserva.formaPagoDeposito,
            totalRenta: reserva.totalRenta,
            formaPagoRenta: reserva.formaPagoRenta,
            createdAt: reserva.createdAt,
            cliente: {
                nombre: nombreCliente,
                telefono: reserva.cliente.telefono
            },
            vehiculo: {
                marca: reserva.vehiculo.modelo.marca.nombre,
                modelo: reserva.vehiculo.modelo.nombre,
                ano: reserva.vehiculo.ano,
                num_serie: reserva.vehiculo.num_serie,
                placa: reserva.vehiculo.placa
            },
            agente: {
                name: reserva.agente.name
            }
        };

        res.status(200).json(response);
    } catch (err) {
        console.error('Error al obtener los detalles de la reservación: ', err.message);
        return res.status(500).json({
            message: err.message || "Ocurrió un error al obtener los detalles de la reservación"
        });
    }
};

exports.generateReceiptPDF = async (req, res) => {
    try {
        const { folio } = req.params;

        // Obtener los detalles de la reserva
        const reserva = await db.reservas.findOne({
            where: { folio: folio },
            include: [
                {
                    model: db.clientes,
                    as: 'cliente',
                    attributes: ['nombre', 'paterno', 'materno', 'telefono']
                },
                {
                    model: db.vehiculos,
                    as: 'vehiculo',
                    include: [
                        {
                            model: db.modelos,
                            as: 'modelo',
                            include: [
                                {
                                    model: db.marcas,
                                    as: 'marca'
                                }
                            ]
                        }
                    ]
                },
                {
                    model: db.users,
                    as: 'agente',
                    attributes: ['name']
                }
            ]
        });

        if (!reserva) {
            return res.status(404).json({ message: "Reservación no encontrada" });
        }

        // Generar el PDF de recibo
        const pdfBuffer = await generateReceiptPDF(
            reserva.folio,
            reserva.cliente,
            reserva.agente,
            reserva.vehiculo,
            reserva.fecha_salida,
            reserva.fecha_llegada,
            reserva.deposito,
            reserva.totalRenta,
            reserva.createdAt,
            reserva.destino
        );

        // Enviar el PDF como base64
        res.status(200).json({ pdf: pdfBuffer.toString('base64') });
    } catch (err) {
        console.error('Error al generar el recibo: ', err.message);
        return res.status(500).json({
            message: err.message || "Ocurrió un error al generar el recibo"
        });
    }
};

// Función para generar el PDF de recibo utilizando pdfkit-table
async function generateReceiptPDF(folio, cliente, agente, vehiculo, fechaSalida, fechaLlegada, deposito, totalRenta, createdAt, destino) {
    return new Promise(async (resolve, reject) => {
        const doc = new PDFDocument({ margin: 30, size: 'A4' });
        let buffers = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
            const pdfData = Buffer.concat(buffers);
            resolve(pdfData);
        });

        const nombreCliente = `${cliente.nombre.split(' ').map(name => name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()).join(' ')}`;
        const paternoCliente = `${cliente.paterno.charAt(0).toUpperCase()}${cliente.paterno.slice(1).toLowerCase()}`;
        const maternoCliente = `${cliente.materno.charAt(0).toUpperCase()}${cliente.materno.slice(1).toLowerCase()}`;

        // Cabecera del recibo
        doc.font('Helvetica-Bold').fontSize(18).text('RECIBO DE PAGO', { align: 'left' });
        doc.fontSize(12).text(`Folio: #${folio}`, { align: 'left' });

        const fechaCreated = new Date(createdAt).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });

        doc.fontSize(12).text(`Fecha: ${fechaCreated}`, { align: 'left' });

        doc.moveUp(3.5);
        // Información de la empresa
        doc.font('Helvetica-Bold').fontSize(18).text('RENTAUTO', { align: 'right' });
    

        doc.fontSize(12).text('Fernando Galaz y Coahuila #7401,', { align: 'right' });
        doc.fontSize(12).text('Col. Sonora, Cd. Obregón, Sonora. C.P. 85198', { align: 'right' });
        doc.fontSize(12).text('Correo electrónico: ventas@siseson.com', { align: 'right' });
        doc.fontSize(12).text('Teléfono de contacto: 6442782301', { align: 'right' });
        
        doc.moveDown();


        const fechaVencimientoFormateada = new Date(fechaLlegada).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });

        // Definición de la tabla principal
        const table = {
            headers: [
                { label: "CONTACTO O AGENTE", property: 'agente', align: 'center' },
                { label: "CLIENTE", property: 'cliente', align: 'center' },
                { label: "CONDICIONES DE PAGO", property: 'condiciones', align: 'center' },
                { label: "FECHA DE VENCIMIENTO", property: 'fechaVencimiento', align: 'center' }
            ],
            datas: [
                {
                    agente: agente.name,
                    cliente: `${nombreCliente} ${paternoCliente} ${maternoCliente}`,
                    condiciones: 'Depósito o apartado',
                    fechaVencimiento: fechaVencimientoFormateada
                }
            ]
        };

        // Renderizar la tabla
        doc.table(table, {
            prepareHeader: () => doc.font('Helvetica-Bold').fontSize(10),
            prepareRow: (row, i) => doc.font('Helvetica').fontSize(10)
        });

        // Segunda tabla
        const table2 = {
            headers: [
                { label: "CANTIDAD", property: 'cantidad', align: 'center' },
                { label: "DESCRIPCIÓN", property: 'descripcion', align: 'center' },
                { label: "PRECIO POR UNIDAD", property: 'precioUnidad', align: 'center' },
                { label: "TOTAL DE LÍNEA", property: 'totalLinea', align: 'center' }
            ],
            datas: [
                {
                    cantidad: 1,
                    descripcion: `DEPÓSITO O APARTADO P/ ${vehiculo.modelo.marca.nombre} ${vehiculo.modelo.nombre} ${vehiculo.ano}`,
                    precioUnidad: "$" + deposito + " MXN",
                    totalLinea: "$ " + deposito + " MXN"
                }
            ]
        };

        // Renderizar la segunda tabla
        doc.moveDown().table(table2, {
            prepareHeader: () => doc.font('Helvetica-Bold').fontSize(10),
            prepareRow: (row, i) => doc.font('Helvetica').fontSize(10)
        });

        doc.moveDown();

        // Detalles adicionales
        doc.fontSize(12).text(`He recibido de ${nombreCliente} ${paternoCliente} ${maternoCliente} la cantidad de $${deposito} MXN, en concepto de apartado o depósito, como constancia de la transacción realizada.`, { align: 'left' });
        
        doc.moveDown();

        //
        function formatFecha(fecha) {
            const opciones = {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            };
        
            // Formatear la fecha
            let fechaFormateada = new Date(fecha).toLocaleString('es-ES', opciones);
        
            // Reemplazar "00:" por "12:" para manejar el formato de 12 horas
            if (fechaFormateada.includes('00:')) {
                fechaFormateada = fechaFormateada.replace('00:', '12:');
            }
        
            return fechaFormateada;
        }
        
        const fechaSalidaFormatted = formatFecha(fechaSalida);
        const fechaLlegadaFormatted = formatFecha(fechaLlegada);
        
        doc.fontSize(12).text(`Salida: ${fechaSalidaFormatted}`);
        doc.fontSize(12).text(`Regreso: ${fechaLlegadaFormatted}`);
        doc.fontSize(12).text(`Destino: ${destino}`);
        doc.fontSize(12).text(`Cliente: ${nombreCliente} ${paternoCliente} ${maternoCliente}`);
        doc.fontSize(12).text(`Teléfono de contacto: ${cliente.telefono}`);

        doc.moveDown();

        // Cálculo de días de renta en base a las fechas de salida y llegada
        const diffTime = new Date(fechaLlegada) - new Date(fechaSalida);
        const horasRenta = diffTime / (1000 * 60 * 60);
        const diasRenta = Math.floor(horasRenta / 24); // Contar solo días completos

        // Calcular las horas completas y minutos restantes
        const horasRestantes = Math.floor(horasRenta % 24); // Horas completas
        const minutosRestantes = Math.round(((horasRenta % 24) - horasRestantes) * 60); // Convertir el decimal restante a minutos

        // Añadir un día adicional solo si las horas restantes son suficientes para ser considerado como un día más
        const diasRentaFinal = horasRestantes >= 24 ? diasRenta + 1 : diasRenta;

        doc.fontSize(12).text(`Más pago al salir $${totalRenta} MXN por ${diasRentaFinal} día(s), ${horasRestantes} hora(s) y ${minutosRestantes} minuto(s) de renta del vehículo ${vehiculo.modelo.marca.nombre} ${vehiculo.modelo.nombre} ${vehiculo.ano}.`, { align: 'left' });


        doc.moveDown();

        doc.moveTo(0, doc.y).lineTo(600, doc.y).stroke();

        doc.moveDown();

        doc.fontSize(12).text(`NOTA: En caso de que el cliente decida cancelar el anticipo, se aplicará una penalización equivalente al 100% del monto abonado. Adicionalmente, se informa que el contrato es de carácter intransferible, por lo que no podrá ser cedido o transferido a terceros bajo ninguna circunstancia. Se otorgará una hora de tolerancia en la entrega del vehículo; a partir de ese momento, se cobrará un cargo adicional de $${vehiculo.hora_adicional} MXN por cada hora de retraso.`, { align: 'left' });

        doc.moveDown();
        
        doc.fontSize(12).text('CUIDADOS: La unidad está asegurada con una cobertura amplia en caso de siniestro, lo que garantiza protección ante daños. No obstante, en caso de un incidente, el cliente será responsable de cubrir el deducible correspondiente o, en su defecto, los costos de reparación del daño. Además, se establece que no está permitido subir mascotas al vehículo, derramar bebidas, fumar, ni realizar ninguna acción que altere el uso normal de la unidad, tanto en su interior como en su exterior.', { align: 'left' });

        doc.moveDown();

        doc.fontSize(12).text('ADICIONAL: En caso de que su destino de viaje sea hacia los Estados Unidos de América, es imperativo que presente las Visas Americanas correspondientes. Asimismo, el cliente deberá adquirir un seguro de automóvil que cumpla con las normativas vigentes en los Estados Unidos para garantizar la cobertura y protección adecuadas durante su estancia en dicho país.', { align: 'left' });

        doc.moveDown();

        doc.fontSize(12).text('DEVOLUCIÓN DEL DEPÓSITO: El monto del depósito será devuelto en un plazo no mayor a 24 horas después de la entrega del vehículo, siempre y cuando no se presenten cargos adicionales por daños o retrasos.', { align: 'left' });

        doc.moveDown();

        doc.fontSize(12).text('FACTURACIÓN: En caso de requerir factura, es necesario notificarlo con anticipación y considerar que el precio se incrementará con el IVA correspondiente.', { align: 'left' });

        doc.moveDown();

        // Línea divisoria
        doc.moveTo(0, doc.y).lineTo(600, doc.y).stroke();

        doc.end();
    });
}

exports.generatePagarePDF = async (req, res) => {
    try {
        const { folio } = req.params;

        // Obtener los detalles de la reserva
        const reserva = await db.reservas.findOne({
            where: { folio: folio },
            include: [
                {
                    model: db.clientes,
                    as: 'cliente',
                    attributes: ['nombre', 'paterno', 'materno', 'telefono']
                },
                {
                    model: db.vehiculos,
                    as: 'vehiculo',
                    include: [
                        {
                            model: db.modelos,
                            as: 'modelo',
                            include: [
                                {
                                    model: db.marcas,
                                    as: 'marca'
                                }
                            ]
                        }
                    ]
                }
            ]
        });

        if (!reserva) {
            return res.status(404).json({ message: "Reservación no encontrada" });
        }

        // Generar el PDF de pagaré
        const pdfBuffer = await generatePagarePDF(
            reserva.createdAt,
            reserva.cliente,
        );

        // Enviar el PDF como base64
        res.status(200).json({ pagare: pdfBuffer.toString('base64') });
    } catch (err) {
        console.error('Error al generar el pagaré: ', err.message);
        return res.status(500).json({
            message: err.message || "Ocurrió un error al generar el pagaré"
        });
    }
};

exports.getTotalReservas = async (req, res) => {
    try {
        // Contar solo las reservas activas
        const totalReservasActivas = await db.reservas.count({
            where: {
                estado: 'ACTIVA'  // Asegúrate de que 'activa' es el valor correcto para reservas activas
            }
        });

        res.status(200).json({ total: totalReservasActivas });
    } catch (error) {
        console.error('Error al obtener el total de reservas activas:', error.message);
        res.status(500).json({
            message: 'Error al obtener el total de reservas activas',
            error: error.message
        });
    }
};


exports.getMontoTotalReservas = async (req, res) => {
    try {
        // Sumar el total de todas las reservas
        const totalMonto = await db.reservas.sum('totalRenta');

        // Sumar la diferencia de todas las reservas
        const diferencia = await db.reservas.sum('diferencia');

        // Sumar el total de las reservas canceladas
        const montoCanceladas = await db.reservas.sum('totalRenta', {
            where: {
                estado: 'CANCELADA'
            }
        });

        // Calcular el monto total restando las reservas canceladas
        const total = totalMonto + diferencia - montoCanceladas;

        res.status(200).json({ total });
    } catch (error) {
        console.error('Error al obtener el monto total de reservas:', error.message);
        res.status(500).json({
            message: 'Error al obtener el monto total de reservas',
            error: error.message
        });
    }
};


exports.filtrarReservas = async (req, res) => {
    try {
        const reservasActivas = await db.reservas.findAll({
            where: { estado: 'ACTIVA' },
            include: [
                {
                    model: db.clientes,
                    as: 'cliente',
                    attributes: ['nombre', 'paterno', 'materno', 'telefono']
                }
            ]
        });

        const data = reservasActivas.map(reserva => ({
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
        console.error('Error al filtrar las reservas activas:', error.message);
        res.status(500).json({
            message: 'Error al filtrar las reservas activas',
            error: error.message
        });
    }
};

exports.cambiarEstadoVehiculo = async (req, res) => {
    try {
        const { folio, kms_salida, combustible_salida } = req.body; 

        const reserva = await db.reservas.findOne({ where: { folio } });

        if (!reserva) {
            return res.status(404).json({ message: "Reserva no encontrada" });
        }

        // Actualizar los valores de la reserva
        reserva.tipo_transaccion = 'ALQUILER';
        reserva.estado = 'ACTIVA';
        reserva.kms_salida = kms_salida; 
        reserva.nivel_tanque = combustible_salida; 
        await reserva.save();

        // Obtener y actualizar el estado del vehículo relacionado
        const vehiculo = await reserva.getVehiculo();
        if (vehiculo) {
            vehiculo.estado = 'ALQUILADO';
            await vehiculo.save();
        }

        res.status(200).json({ message: "Reserva activada con éxito", reserva });
    } catch (error) {
        console.error("Error al recibir el vehículo:", error.message);
        res.status(500).json({ message: `Error al recibir el vehículo: ${error.message}` });
    }
};


exports.calendario = async (req, res) => {
    try { 
        const reservas = await db.reservas.findAll({
            where: {
                estado: ['ACTIVA', 'PENDIENTE']
            },
            include: [
                {
                    model: db.clientes,
                    as: 'cliente',
                    attributes: ['nombre', 'paterno', 'materno', 'telefono']
                },
                {
                    model: db.vehiculos,
                    as: 'vehiculo',
                    attributes: ['ano', 'placa'],
                    include: [
                        {
                            model: db.modelos,
                            as: 'modelo',
                            attributes: ['nombre'],
                            include: [
                                {
                                    model: db.marcas,
                                    as: 'marca',
                                    attributes: ['nombre'],
                                },
                            ]
                        }
                    ]
                }
            ]
        });

        const data = reservas.map(reserva => ({
            id: reserva.id,
            folio: reserva.folio,
            tipo_transaccion: reserva.tipo_transaccion,
            estado: reserva.estado,
            fecha_salida: reserva.fecha_salida,
            fecha_llegada: reserva.fecha_llegada,
            createdAt: reserva.createdAt,
            cliente: `${reserva.cliente.nombre} ${reserva.cliente.paterno} ${reserva.cliente.materno}`,
            telefono: reserva.cliente.telefono,
            placa : reserva.vehiculo.placa,
            marca : reserva.vehiculo.modelo.marca.nombre,
            modelo : reserva.vehiculo.modelo.nombre,
            ano : reserva.vehiculo.ano
        }));

        res.status(200).json(data);
    }
    catch (error) {
        console.error('Error al obtener las reservas activas:', error.message);
        res.status(500).json({
            message: 'Error al obtener las reservas activas',
            error: error.message
        });
    }
}