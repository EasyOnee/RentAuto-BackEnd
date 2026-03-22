module.exports = (sequelize, Sequelize) => {
    const Vehiculo = sequelize.define("vehiculos", {
        folio: {
            type: Sequelize.STRING,
            allowNull: false
        },
        marca_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: 'marcas',
                key: 'id'
            }
        },
        modelo_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: 'modelos',
                key: 'id'
            }
        },
        deposito: {
            type: Sequelize.DECIMAL(10, 2),
            allowNull: false
        },
        color: {
            type: Sequelize.STRING,
            allowNull: false
        },
        num_serie: {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true
        },
        placa: {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true
        },
        kms: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        ano: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        cilindros: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        estado: {
            type: Sequelize.ENUM("DISPONIBLE", "MANTENIMIENTO", "REPARACION", "NO_DISPONIBLE", "RESERVADO", "ALQUILADO"),
            allowNull: false
        },
        combustible: {
            type: Sequelize.ENUM("GASOLINA", "DIESEL", "GAS", "HIBRIDO", "ELECTRICO", "OTRO"),
            allowNull: false
        },
        tipo_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: 'tipos',
                key: 'id'
            }
        },
        tarifa_diaria: {
            type: Sequelize.DECIMAL(10, 2),
            allowNull: false
        },
        dia_adicional: {
            type: Sequelize.DECIMAL(10, 2),
            allowNull: false
        },
        hora_adicional: {
            type: Sequelize.DECIMAL(10, 2),
            allowNull: false
        },
        foto: {
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
        }
    });

    Vehiculo.associate = function (models) {
        Vehiculo.belongsTo(models.modelos, {
            foreignKey: 'modelo_id',
            as: 'modelo'
        });

        Vehiculo.belongsTo(models.tipos, {
            foreignKey: 'tipo_id',
            as: 'tipo'
        });
        
        Vehiculo.belongsTo(models.users, {
            foreignKey: 'agente_id',
            as: 'agente'
        });
    };

    return Vehiculo;
};
