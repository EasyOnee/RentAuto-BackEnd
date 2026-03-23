const express = require("express");
const cors = require("cors");
const session = require('express-session');

const app = express();
global.__basedir = __dirname;

const cors_ = require("./app/config/cors.config");

var corsOptions = {
  origin: cors_.allowed_origins
};

app.use(cors(corsOptions));

// Configuración de sesión
app.use(session({
  resave: false,
  saveUninitialized: true,
  secret: process.env.ACCESS_TOKEN_SECRET || 'supersecret'

}));

const db = require("./app/models");

// Conectar a la base de datos
async function testConnection() {
  try {
    await db.sequelize.authenticate();
    
    console.log("Connected to Database");
  } catch (e) {
    console.log(e.message);
  }
}

testConnection();

app.get("/", (req, res) => {
  res.json({ message: "RentAuto" });
});

// **Excluye express.json() y express.urlencoded() de las rutas que manejan archivos**

// Rutas para Vehículos (manejo de archivos) - Asegúrate de que multer esté configurado correctamente
require("./app/routes/automationRoutes/vehiculos.routes")(app);
require("./app/routes/automationRoutes/file.routes")(app);

// **Solo habilita el middleware de body-parser después de las rutas de archivos**
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// Rutas adicionales que no manejan archivos
require("./app/routes/automationRoutes/auth.routes")(app);
require("./app/routes/automationRoutes/authenticated.routes")(app);
require("./app/routes/automationRoutes/crud.routes")(app);
require("./app/routes/automationRoutes/users.routes")(app);
require("./app/routes/automationRoutes/tipos.routes")(app);
require("./app/routes/automationRoutes/modelos.routes")(app);
require("./app/routes/automationRoutes/clientes.routes")(app);
require("./app/routes/automationRoutes/reservas.routes")(app);
require("./app/routes/automationRoutes/recibir-vehiculo.routes")(app);
require("./app/routes/automationRoutes/anular-reservas.routes")(app);
require("./app/routes/automationRoutes/bitacoraRecibir.routes")(app);
require("./app/routes/automationRoutes/reporte.routes")(app);
require("./app/routes/app.routes")(app);

const PORT = process.env.PORT || 8080;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});
