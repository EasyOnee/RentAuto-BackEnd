module.exports = (sequelize, Sequelize) => {
    const Marca = sequelize.define("marcas", {
        nombre: {
            type: Sequelize.STRING,
            allowNull: false
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

    Marca.associate = function (models) {
        Marca.belongsTo(models.users, {
            foreignKey: 'agente_id',
            as: 'agente'
        });
    };

    return Marca;
};
