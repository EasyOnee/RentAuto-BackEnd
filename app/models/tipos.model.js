module.exports = (sequelize, Sequelize) => {
    const Tipo = sequelize.define("tipos", {
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

    Tipo.associate = function (models) {
        Tipo.belongsTo(models.users, {
            foreignKey: 'agente_id',
            as: 'agente'
        });
    };

    return Tipo;
};
