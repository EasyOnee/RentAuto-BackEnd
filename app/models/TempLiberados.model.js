module.exports = (sequelize, Sequelize) => {
    const TempLiberados = sequelize.define("temp_liberados", {
        usuario_id: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        folioReserva: {
            type: Sequelize.INTEGER,
            allowNull: false
        }
    });

    return TempLiberados;
};
