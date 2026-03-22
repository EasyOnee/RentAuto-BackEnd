/**
 * Servicio para interactuar con la API de Nubarium
 * @module helpers/nubariumService
 * @author Thomas Francisco Orozco Galindo
 * @description Contiene métodos para validar CURP e INE
 * Fecha de creación: 16/08/2024
 * Última modificación: 23/09/2024
 */
require('dotenv').config();
const axios = require('axios');

// Configuración de autenticación
const auth = Buffer.from(`${process.env.NUBARIUM_USER}:${process.env.NUBARIUM_PASSWORD}`).toString('base64');

// Variable para distinguir entre producción y desarrollo
const isProduction = process.env.NODE_ENV === 'production';

// Configuración del tiempo de expiración del token
const TOKEN_EXPIRE_AFTER = isProduction ? 3600 : 60;
const TOKEN_RENEWAL_MARGIN = isProduction ? 300 : 5;
const RETRY_DELAY = 3000; // Retraso de 3 segundos para reintentos en caso de error
const MAX_RETRIES = 3; // Número máximo de reintentos

let jwtToken = null;
let tokenExpiry = null;

// Función para obtener el JWT de Nubarium con reintentos
const getJWT = async (retryCount = 0) => {
/*     try {
        const response = await axios.post('https://api.nubarium.com/global/account/v1/generate-jwt', {
            expireAfter: TOKEN_EXPIRE_AFTER
        }, {
            headers: {
                'Authorization': `Basic ${auth}`
            }
        });

        jwtToken = response.data.bearer_token;
        tokenExpiry = Date.now() + (response.data.expireAfter - TOKEN_RENEWAL_MARGIN) * 1000;
        console.log("Nuevo token obtenido:", jwtToken);

    } catch (error) {
        console.error("Error al obtener el token JWT:", error.response ? error.response.data : error.message);

        // Si falla, intenta nuevamente hasta el máximo de reintentos
        if (retryCount < MAX_RETRIES) {
            console.log(`Reintentando obtener el token JWT... Intento ${retryCount + 1}`);
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY)); // Espera antes de reintentar
            return getJWT(retryCount + 1); // Reintenta obtener el token
        } else {
            throw new Error('No se pudo obtener el token JWT después de varios intentos');
        }
    } */
};

// Función para verificar si el token ha expirado y renovarlo si es necesario
const checkAndRenewToken = async () => {
    if (!jwtToken || Date.now() >= tokenExpiry) {
        console.log("Token caducado o no disponible. Renovando...");
        await getJWT();
    } else {
        //console.log("Token válido. No es necesario renovarlo.");
    }
};

// Función para iniciar la renovación automática del token
const iniciarRenovacionToken = () => {
    setInterval(async () => {
        await checkAndRenewToken(); // Renovar el token automáticamente
    }, (TOKEN_EXPIRE_AFTER - TOKEN_RENEWAL_MARGIN) * 1000);
};

// Llamada inicial para obtener el token al iniciar el servidor
getJWT().then(() => iniciarRenovacionToken()); // Obtén el token inicial y luego inicia la renovación automática

const nubariumService = {
    obtenerDatosINE: async (id, idReverso) => {
        const url = 'https://ocr.nubarium.com/ocr/v1/obtener_datos_id';
        await checkAndRenewToken(); // Verifica y renueva el token si es necesario
        const token = jwtToken;

        try {
            const response = await axios.post(url, {
                id: id,
                idReverso: idReverso
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            return response.data;
        } catch (error) {
            throw new Error('Error al obtener los datos del INE: ' + error.message);
        }
    },

    validarINE: async (cic, identificadorCiudadano) => {
        const url = 'https://ine.nubarium.com/ine/v2/valida_ine';
        await checkAndRenewToken(); // Verifica y renueva el token si es necesario
        const token = jwtToken;

        try {
            const response = await axios.post(url, {
                cic: cic,
                identificadorCiudadano: identificadorCiudadano
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            return response.data;
        } catch (error) {
            throw new Error('Error al validar los datos del INE: ' + error.message);
        }
    },

    validarCURP: async (curp) => {
        const url = 'https://curp.nubarium.com/renapo/v3/valida_curp';
        await checkAndRenewToken(); // Verifica y renueva el token si es necesario
        const token = jwtToken;

        try {
            const response = await axios.post(url, {
                curp: curp
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            return response.data;
        } catch (error) {
            throw new Error('Error al validar el CURP: ' + error.message);
        }
    }
};

module.exports = nubariumService;
