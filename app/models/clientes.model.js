module.exports = (sequelize, Sequelize) => {
    const Cliente = sequelize.define("clientes", {
        nombre: {
            type: Sequelize.STRING,
            allowNull: false
        },
        paterno: {
            type: Sequelize.STRING,
            allowNull: false
        },
        materno: {
            type: Sequelize.STRING,
            allowNull: false
        },
        correo_electronico: {
            type: Sequelize.STRING,
            allowNull: true,
            unique: true
        },
        telefono: {
            type: Sequelize.STRING,
            allowNull: false
        },
        telefono_alternativo: {
            type: Sequelize.STRING,
            allowNull: true
        },
        nacionalidad: {
            type: Sequelize.STRING,
            allowNull: true
        },
        fecha_nacimiento: {
            type: Sequelize.DATEONLY,
            allowNull: false
        },
        genero: {
            type: Sequelize.ENUM("M", "F"),
            allowNull: false
        },
        direccion: {
            type: Sequelize.STRING,
            allowNull: true
        },
        ciudad: {
            type: Sequelize.STRING,
            allowNull: true
        },
        estado: {
            type: Sequelize.STRING,
            allowNull: true
        },
        pais: {
            type: Sequelize.STRING,
            allowNull: true
        },
        codigo_postal: {
            type: Sequelize.STRING,
            allowNull: true
        },
        curp: {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true
        },
        cic: {
            type: Sequelize.INTEGER,
            allowNull: false,
            unique: true
        },
        identificadorCiudadano: {
            type: Sequelize.INTEGER,
            allowNull: false,
            unique: true
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

    Cliente.associate = function (models) {
        Cliente.belongsTo(models.users, {
            foreignKey: 'agente_id',
            as: 'agente'
        });
    };

    return Cliente;
};
