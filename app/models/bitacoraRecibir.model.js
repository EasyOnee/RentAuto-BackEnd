module.exports = (sequelize, Sequelize) => {
    const BitacoraRecibir = sequelize.define("bitacora", {
        folioReserva: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        id_vehiculo: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        kilometraje_recibido: {
            type: Sequelize.FLOAT,
            allowNull: false
        }, 
        combustible_recibido: {
            type: Sequelize.ENUM("E", "1/4", "1/2", "3/4", "F"),
            allowNull: false
        },
        observaciones: {
            type: Sequelize.STRING,
            allowNull: true
        },
        //la presona que libera el vehículo
        releasedBy: {
            type: Sequelize.INTEGER,
            allowNull: true
        },
        // La persona que recibe el vehículo
        receivedBy: {
            type: Sequelize.INTEGER,
            allowNull: true
        }
    });

    return BitacoraRecibir;
};
