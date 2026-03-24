require("dotenv").config();

const moment = require('moment-timezone');
const timezone = moment.tz.guess();

const bcrypt = require("bcrypt");
const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  protocol: "postgres",
  timezone: timezone,
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

sequelize.sync().then(async () => {
  const anyPassword = "admin123";
  const hashPassword = await bcrypt.hash(String(anyPassword), 10);

  const admin = await db.users.findOne({ where: { id: 1 } });

  if (!admin) {
    await db.users.create({
      name: "ADMIN",
      email: "admin@admin.com",
      password: hashPassword,
      role: "SUPERADMIN"
    });
  } else {
    console.log("Admin already exists");
  }

  const agente = await db.users.findOne({ where: { id: 2 } });

  if (!agente) {
    await db.users.create({
      name: "Horacio Portillo Valenzuela",
      email: "horacio@gmail.com",
      password: hashPassword,
      role: "SUPERADMIN"
    });
  } else {
    console.log("Agente already exists");
  }

  const marca = await db.marcas.findOne({ where: { id: 1 } });

  if (!marca) {
    await db.marcas.create({
      nombre: "Toyota",
      agente_id: 1
    });
  } else {
    console.log("Marca already exists");
  }

  const modelo = await db.modelos.findOne({ where: { id: 1 } });

  if (!modelo) {
    await db.modelos.create({
      nombre: "Corolla",
      marca_id: 1,
      agente_id: 1
    });
  } else {
    console.log("Modelo already exists");
  }

  const tipo = await db.tipos.findOne({ where: { id: 1 } });

  if (!tipo) {
    await db.tipos.create({
      nombre: "Sedán",
      agente_id: 1
    });
  } else {
    console.log("Tipo already exists");
  }

  const vehiculo = await db.vehiculos.findOne({ where: { id: 1 } });

  if (!vehiculo) {
    await db.vehiculos.create({
      folio: "123456789",
      marca_id: 1,
      modelo_id: 1,
      deposito: 3000,
      color: "Blanco",
      num_serie: "123456789",
      placa: "ABC123",
      kms: 114325,
      ano: 2014,
      cilindros: 4,
      estado: "DISPONIBLE",
      combustible: "GASOLINA",
      tipo_id: 1,
      tarifa_diaria: 1200,
      dia_adicional: 800,
      hora_adicional: 200,
      agente_id: 1
    });
  } else {
    console.log("Vehículo already exists");
  }
}).catch((error) => {
  console.log(error);
});

module.exports = db;
