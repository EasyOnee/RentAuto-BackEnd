module.exports = (sequelize, Sequelize) => {
    const Modelo = sequelize.define("modelos", {
        nombre: {
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
        agente_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        }
    });

    Modelo.associate = function (models) {
        Modelo.belongsTo(models.marcas, {
            foreignKey: 'marca_id',
            as: 'marca'
        });

        Modelo.belongsTo(models.users, {
            foreignKey: 'agente_id',
            as: 'agente'
        });
    };

    return Modelo;
};
