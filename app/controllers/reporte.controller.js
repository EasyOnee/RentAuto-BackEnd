const { Op } = require("sequelize");
const db = require("../models");

// Obtener todas las reservas finalizadas filtradas por fechas, contando y sumando por cliente y obteniendo el desempeño de los vehículos
exports.getReservasFiltradas = async (req, res) => {
  const { startDate, endDate } = req.body;

  // Verificar si se recibieron las fechas
  if (!startDate || !endDate) {
    return res.status(400).json({ message: "Las fechas son requeridas" });
  }

  try {
    // Ajustar las fechas para incluir todo el día en la zona horaria correcta
    const start = new Date(`${startDate}T00:00:00-07:00`);
    const end = new Date(`${endDate}T23:59:59-07:00`);

    // Filtrar las reservas por 'createdAt' dentro del rango de fechas y estado 'FINALIZADA'
    const reservas = await db.reservas.findAll({
      where: {
        createdAt: {
          [Op.between]: [start, end],
        },
        estado: "FINALIZADA",
      },
      attributes: [
        "id",
        "folio",
        "tipo_transaccion",
        "estado",
        "fecha_salida",
        "fecha_llegada",
        "createdAt",
        "totalRenta",
        "vehiculo_id",
      ],
      include: [
        {
          model: db.clientes,
          as: "cliente",
          attributes: ["id", "nombre", "paterno", "materno"],
        },
        {
          model: db.vehiculos,
          as: "vehiculo",
          attributes: ["placa"],
          include: [
            {
              model: db.modelos,
              as: "modelo",
              attributes: ["nombre"],
              include: [
                {
                  model: db.marcas,
                  as: "marca",
                  attributes: ["nombre"],
                },
              ],
            },
          ],
        },
      ],
      order: [
        ["createdAt", "DESC"],
      ],
    });

    // Mapa para clientes y reservas
    let clientesMap = {};
    let totalReservasFinalizadas = reservas.length;

    // Mapa para contar reservas por vehículo (modelo y marca)
    let vehiculosMap = {};

    reservas.forEach((reserva) => {
      // Agrupar y contar por cliente
      const clienteNombre = `${reserva.cliente.nombre} ${reserva.cliente.paterno} ${reserva.cliente.materno}`;
      if (!clientesMap[clienteNombre]) {
        clientesMap[clienteNombre] = {
          nombre: clienteNombre,
          totalReservas: 0,
          totalFinalizadas: 0,
          sumaFinalizadas: 0,
        };
      }
      clientesMap[clienteNombre].totalReservas += 1;
      clientesMap[clienteNombre].totalFinalizadas += 1;
      clientesMap[clienteNombre].sumaFinalizadas += parseFloat(reserva.totalRenta) || 0;

      // Contar las reservas por modelo y marca del vehículo
      const modeloMarcaVehiculo = `${reserva.vehiculo.modelo.marca.nombre} ${reserva.vehiculo.modelo.nombre} - ${reserva.vehiculo.placa}`;
      if (!vehiculosMap[modeloMarcaVehiculo]) {
        vehiculosMap[modeloMarcaVehiculo] = 0; // Inicializar contador
      }
      vehiculosMap[modeloMarcaVehiculo] += 1; // Incrementar contador
    });

    // Convertir el mapa de clientes a un array y ordenar por total de reservaciones finalizadas en orden descendente
    const clientesData = Object.values(clientesMap).sort(
      (a, b) => b.totalFinalizadas - a.totalFinalizadas
    );

    // Mapear los datos de los vehículos para la gráfica
    const vehiculosData = Object.entries(vehiculosMap).map(([vehiculo, count]) => ({
      vehiculo,
      count,
    }));

    // Sumar el total de las reservas finalizadas (totalIngresos)
    const totalIngresos = await db.reservas.sum("totalRenta", {
      where: {
        createdAt: {
          [Op.between]: [start, end],
        },
        estado: "FINALIZADA",
      },
    });


    // Enviar la respuesta con el conteo total, total de ingresos y las reservas filtradas
    return res.status(200).json({
      totalReservasFinalizadas,
      totalReservas: reservas.length,
      totalIngresos: totalIngresos || 0,
      clientesData,
      data: reservas,
      vehiculosData, // Desempeño de los vehículos para la gráfica
    });
  } catch (err) {
    console.error("Error al obtener las reservas filtradas:", err.message);
    return res.status(500).json({
      message: err.message || "Ocurrió un error al obtener las reservas filtradas",
    });
  }
};
