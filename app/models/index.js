require("dotenv").config();

const moment = require('moment-timezone');
const timezone = moment.tz.guess();

const bcrypt = require("bcrypt");
const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  protocol: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
/*   pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  } */
}); 

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.vehiculos = require("./vehiculos.model.js")(sequelize, Sequelize);
db.clientes = require("./clientes.model.js")(sequelize, Sequelize);
db.marcas = require("./marcas.model.js")(sequelize, Sequelize);
db.modelos = require("./modelos.model.js")(sequelize, Sequelize);
db.tipos = require("./tipos.model.js")(sequelize, Sequelize);
db.users = require("./users.model.js")(sequelize, Sequelize);
db.reservas = require("./reservas.model.js")(sequelize, Sequelize);
db.bitacoraRecibir = require("./bitacoraRecibir.model.js")(sequelize, Sequelize);
db.temp_liberados = require('./TempLiberados.model.js')(sequelize, Sequelize);

// Asociaciones
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
      db[modelName].associate(db);
  }
});


sequelize
  .sync()
  .then(async () => {
    const anyPassword = "admin123";
    const hashPassword = await bcrypt.hash(String(anyPassword), 10);

    // =========================
    // USUARIOS
    // =========================
    const [admin] = await db.users.findOrCreate({
      where: { email: "admin@admin.com" },
      defaults: {
        name: "ADMIN GENERAL",
        email: "admin@admin.com",
        password: hashPassword,
        role: "SUPERADMIN",
        isActive: true,
      },
    });

    const [agente] = await db.users.findOrCreate({
      where: { email: "horacio@gmail.com" },
      defaults: {
        name: "Horacio Portillo Valenzuela",
        email: "horacio@gmail.com",
        password: hashPassword,
        role: "AGENTE",
        isActive: true,
      },
    });

    const [administrador] = await db.users.findOrCreate({
      where: { email: "admin.rentauto@gmail.com" },
      defaults: {
        name: "Administrador RentAuto",
        email: "admin.rentauto@gmail.com",
        password: hashPassword,
        role: "ADMIN",
        isActive: true,
      },
    });

    console.log("Usuarios listos");

    // =========================
    // MARCAS
    // =========================
    const [marcaToyota] = await db.marcas.findOrCreate({
      where: { nombre: "Toyota", agente_id: admin.id },
      defaults: {
        nombre: "Toyota",
        agente_id: admin.id,
      },
    });

    const [marcaNissan] = await db.marcas.findOrCreate({
      where: { nombre: "Nissan", agente_id: admin.id },
      defaults: {
        nombre: "Nissan",
        agente_id: admin.id,
      },
    });

    const [marcaChevrolet] = await db.marcas.findOrCreate({
      where: { nombre: "Chevrolet", agente_id: admin.id },
      defaults: {
        nombre: "Chevrolet",
        agente_id: admin.id,
      },
    });

    console.log("Marcas listas");

    // =========================
    // MODELOS
    // =========================
    const [modeloCorolla] = await db.modelos.findOrCreate({
      where: { nombre: "Corolla", marca_id: marcaToyota.id, agente_id: admin.id },
      defaults: {
        nombre: "Corolla",
        marca_id: marcaToyota.id,
        agente_id: admin.id,
      },
    });

    const [modeloHilux] = await db.modelos.findOrCreate({
      where: { nombre: "Hilux", marca_id: marcaToyota.id, agente_id: admin.id },
      defaults: {
        nombre: "Hilux",
        marca_id: marcaToyota.id,
        agente_id: admin.id,
      },
    });

    const [modeloVersa] = await db.modelos.findOrCreate({
      where: { nombre: "Versa", marca_id: marcaNissan.id, agente_id: admin.id },
      defaults: {
        nombre: "Versa",
        marca_id: marcaNissan.id,
        agente_id: admin.id,
      },
    });

    const [modeloAveo] = await db.modelos.findOrCreate({
      where: { nombre: "Aveo", marca_id: marcaChevrolet.id, agente_id: admin.id },
      defaults: {
        nombre: "Aveo",
        marca_id: marcaChevrolet.id,
        agente_id: admin.id,
      },
    });

    console.log("Modelos listos");

    // =========================
    // TIPOS
    // =========================
    const [tipoSedan] = await db.tipos.findOrCreate({
      where: { nombre: "Sedán", agente_id: admin.id },
      defaults: {
        nombre: "Sedán",
        agente_id: admin.id,
      },
    });

    const [tipoPickup] = await db.tipos.findOrCreate({
      where: { nombre: "Pickup", agente_id: admin.id },
      defaults: {
        nombre: "Pickup",
        agente_id: admin.id,
      },
    });

    const [tipoSUV] = await db.tipos.findOrCreate({
      where: { nombre: "SUV", agente_id: admin.id },
      defaults: {
        nombre: "SUV",
        agente_id: admin.id,
      },
    });

    console.log("Tipos listos");

    // =========================
    // VEHÍCULOS
    // =========================
    const [vehiculo1] = await db.vehiculos.findOrCreate({
      where: { placa: "SON-123-A" },
      defaults: {
        folio: "VH-0001",
        marca_id: marcaToyota.id,
        modelo_id: modeloCorolla.id,
        deposito: 3000,
        color: "Blanco",
        num_serie: "JTDBR32E540123456",
        placa: "SON-123-A",
        kms: 114325,
        ano: 2019,
        cilindros: 4,
        estado: "DISPONIBLE",
        combustible: "GASOLINA",
        tipo_id: tipoSedan.id,
        tarifa_diaria: 1200,
        dia_adicional: 800,
        hora_adicional: 200,
        foto: "https://dummyimage.com/600x400/cccccc/000000&text=Corolla",
        agente_id: admin.id,
      },
    });

    const [vehiculo2] = await db.vehiculos.findOrCreate({
      where: { placa: "SON-456-B" },
      defaults: {
        folio: "VH-0002",
        marca_id: marcaToyota.id,
        modelo_id: modeloHilux.id,
        deposito: 5000,
        color: "Gris",
        num_serie: "MR0FX3CDXK0123456",
        placa: "SON-456-B",
        kms: 85420,
        ano: 2021,
        cilindros: 6,
        estado: "DISPONIBLE",
        combustible: "DIESEL",
        tipo_id: tipoPickup.id,
        tarifa_diaria: 1800,
        dia_adicional: 1200,
        hora_adicional: 300,
        foto: "https://dummyimage.com/600x400/cccccc/000000&text=Hilux",
        agente_id: admin.id,
      },
    });

    const [vehiculo3] = await db.vehiculos.findOrCreate({
      where: { placa: "SON-789-C" },
      defaults: {
        folio: "VH-0003",
        marca_id: marcaNissan.id,
        modelo_id: modeloVersa.id,
        deposito: 2500,
        color: "Rojo",
        num_serie: "3N1CN7AP0KL123456",
        placa: "SON-789-C",
        kms: 65890,
        ano: 2020,
        cilindros: 4,
        estado: "DISPONIBLE",
        combustible: "GASOLINA",
        tipo_id: tipoSedan.id,
        tarifa_diaria: 1100,
        dia_adicional: 700,
        hora_adicional: 180,
        foto: "https://dummyimage.com/600x400/cccccc/000000&text=Versa",
        agente_id: admin.id,
      },
    });

    console.log("Vehículos listos");

    // =========================
    // CLIENTES
    // OJO: cic e identificadorCiudadano son INTEGER en tu modelo
    // =========================
    const [cliente1] = await db.clientes.findOrCreate({
      where: { curp: "PEMJ900101HSRLRN01" },
      defaults: {
        nombre: "Juan",
        paterno: "Pérez",
        materno: "Martínez",
        correo_electronico: "juan.perez@gmail.com",
        telefono: "6441234567",
        telefono_alternativo: "6447654321",
        nacionalidad: "Mexicana",
        fecha_nacimiento: "1990-01-01",
        genero: "M",
        direccion: "Calle Morelos 123",
        ciudad: "Ciudad Obregón",
        estado: "Sonora",
        pais: "México",
        codigo_postal: "85000",
        curp: "PEMJ900101HSRLRN01",
        cic: 987654321,
        identificadorCiudadano: 8901,
        foto: "https://dummyimage.com/300x300/cccccc/000000&text=Cliente+1",
        agente_id: admin.id,
      },
    });

    const [cliente2] = await db.clientes.findOrCreate({
      where: { curp: "LOPR920215MSRPNR02" },
      defaults: {
        nombre: "Laura",
        paterno: "López",
        materno: "Ruiz",
        correo_electronico: "laura.lopez@gmail.com",
        telefono: "6442223344",
        telefono_alternativo: "6443334455",
        nacionalidad: "Mexicana",
        fecha_nacimiento: "1992-02-15",
        genero: "F",
        direccion: "Av. Miguel Alemán 450",
        ciudad: "Ciudad Obregón",
        estado: "Sonora",
        pais: "México",
        codigo_postal: "85120",
        curp: "LOPR920215MSRPNR02",
        cic: 123456789,
        identificadorCiudadano: 4567,
        foto: "https://dummyimage.com/300x300/cccccc/000000&text=Cliente+2",
        agente_id: admin.id,
      },
    });

    console.log("Clientes listos");

    // =========================
    // RESERVAS
    // =========================
    const [reserva1] = await db.reservas.findOrCreate({
      where: { folio: "RSV-0001" },
      defaults: {
        folio: "RSV-0001",
        tipo_transaccion: "RESERVA",
        cliente_id: cliente1.id,
        vehiculo_id: vehiculo1.id,
        destino: "Hermosillo",
        kms_salida: 114325,
        nivel_tanque: "3/4",
        fecha_salida: new Date("2026-03-25T10:00:00"),
        fecha_llegada: new Date("2026-03-27T10:00:00"),
        deposito: 3000,
        formaPagoDeposito: "TARJETA",
        numeroDocDeposito: "DEP-001",
        totalRenta: 2400,
        formaPagoRenta: "TRANSFERENCIA",
        numeroDocRenta: "REN-001",
        estado: "PENDIENTE",
        hay_diferencia: false,
        diferencia: 0,
        nueva_fecha_llegada: null,
        anularReserva: null,
        agente_id: admin.id,
      },
    });

    const [reserva2] = await db.reservas.findOrCreate({
      where: { folio: "RSV-0002" },
      defaults: {
        folio: "RSV-0002",
        tipo_transaccion: "ALQUILER",
        cliente_id: cliente2.id,
        vehiculo_id: vehiculo2.id,
        destino: "Guaymas",
        kms_salida: 85420,
        nivel_tanque: "F",
        fecha_salida: new Date("2026-03-26T09:00:00"),
        fecha_llegada: new Date("2026-03-29T09:00:00"),
        deposito: 5000,
        formaPagoDeposito: "EFECTIVO",
        numeroDocDeposito: "DEP-002",
        totalRenta: 5400,
        formaPagoRenta: "TARJETA",
        numeroDocRenta: "REN-002",
        estado: "ACTIVA",
        hay_diferencia: false,
        diferencia: 0,
        nueva_fecha_llegada: null,
        anularReserva: null,
        agente_id: agente.id,
      },
    });

    console.log("Reservas listas");

    // =========================
    // BITÁCORA DE RECIBIR
    // =========================
    const [bitacora1] = await db.bitacora.findOrCreate({
      where: { folioReserva: reserva2.id, id_vehiculo: vehiculo2.id },
      defaults: {
        folioReserva: reserva2.id,
        id_vehiculo: vehiculo2.id,
        kilometraje_recibido: 85780,
        combustible_recibido: "3/4",
        observaciones: "Vehículo recibido en buen estado, sin daños visibles.",
        releasedBy: agente.id,
        receivedBy: admin.id,
      },
    });

    console.log("Bitácora lista");

    // =========================
    // TEMP LIBERADOS
    // =========================
    const [tempLiberado1] = await db.temp_liberados.findOrCreate({
      where: { usuario_id: admin.id, folioReserva: reserva1.id },
      defaults: {
        usuario_id: admin.id,
        folioReserva: reserva1.id,
      },
    });

    console.log("Temp liberados listo");

    console.log("Seed completado correctamente");
  })
  .catch((error) => {
    console.log("Error al ejecutar seed:", error);
  });
module.exports = db;
