module.exports = (sequelize, Sequelize) => {
    const Reserva = sequelize.define("reservas", {
        folio: {
            type: Sequelize.STRING,
            allowNull: false
        },
        tipo_transaccion: {
            type: Sequelize.ENUM("RESERVA", "ALQUILER"),
            allowNull: false
        },
        cliente_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: 'clientes',
                key: 'id'
            }
        },
        vehiculo_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: 'vehiculos',
                key: 'id'
            }
        },
        destino: {
            type: Sequelize.STRING,
            allowNull: true
        },
        kms_salida: {
            type: Sequelize.INTEGER,
            defaultValue: 0,
            allowNull: true
        },
        nivel_tanque: {
            type: Sequelize.ENUM("E", "1/4", "1/2", "3/4", "F"),
            allowNull: true
        },
        fecha_salida: {
            type: Sequelize.DATE,
            allowNull: false
        },
        fecha_llegada: {
            type: Sequelize.DATE,
            allowNull: false
        },
        deposito: {
            type: Sequelize.DECIMAL(10, 2),
            allowNull: false
        },
        formaPagoDeposito: {
            type: Sequelize.ENUM("EFECTIVO", "CHEQUE", "TARJETA", "TRANSFERENCIA", "DEPOSITO"),
            allowNull: false
        },
        numeroDocDeposito: {
            type: Sequelize.STRING,
            allowNull: true
        },
        totalRenta: {
            type: Sequelize.DECIMAL(10, 2),
            allowNull: false
        },
        formaPagoRenta: {
            type: Sequelize.ENUM("EFECTIVO", "CHEQUE", "TARJETA", "TRANSFERENCIA", "DEPOSITO"),
            allowNull: false
        },
        numeroDocRenta: {
            type: Sequelize.STRING,
            allowNull: true
        },
        estado: {
            type: Sequelize.ENUM("PENDIENTE", "ACTIVA", "FINALIZADA", "CANCELADA"),
            allowNull: false
        },
        hay_diferencia: {
            type: Sequelize.BOOLEAN,
            allowNull: true
        },
        diferencia: {
            type: Sequelize.DECIMAL(10, 2),
            allowNull: true
        },
        nueva_fecha_llegada: {
            type: Sequelize.DATE,
            allowNull: true
        },
        anularReserva: {
            type: Sequelize.STRING,
            allowNull: true
        },
        agente_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        },
    });

    Reserva.associate = function(models) {
        Reserva.belongsTo(models.clientes, {
            foreignKey: 'cliente_id',
            as: 'cliente'
        });
        
        Reserva.belongsTo(models.vehiculos, {
            foreignKey: 'vehiculo_id',
            as: 'vehiculo'
        });

        Reserva.belongsTo(models.users, {
            foreignKey: 'agente_id',
            as: 'agente'
        });
    };

    return Reserva;
};
