require('dotenv').config();

const jwt = require('jsonwebtoken');

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'l7iQbjuJ4xv77EJH';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'iY7kRW55dq2keNfD';

// expiresIn // Eg: 60, "2 days", "10h", "7d".
// default ("120" is equal to "120ms").

exports.accessTokenEncode = function accessTokenEncode(data) {
    const token = jwt.sign({
        id: data.id,
        role: data.role
    }, ACCESS_TOKEN_SECRET, {
        expiresIn: "24h"
    });

    return token;
}

exports.refreshTokenEncode = function refreshTokenEncode(data) {
    const token = jwt.sign({
        id: data.id,
        role: data.role
    }, REFRESH_TOKEN_SECRET, {
        expiresIn: "2 days"
    });

    return token;
}

exports.accessTokenDecode = function accessTokenDecode(fn, access_token) {
    try {
        var decoded = jwt.verify(access_token, ACCESS_TOKEN_SECRET);

        fn({ status: true, data: decoded });
    } catch (error) {
        fn({ status: false, message: error.message, code: 403 });
    }
}

exports.refreshTokenDecode = function refreshTokenDecode(fn, refresh_token) {
    try {
        var decoded = jwt.verify(refresh_token, REFRESH_TOKEN_SECRET);

        fn({ status: true, data: decoded });
    } catch (error) {
        fn({ status: false, message: error.message, code: 403 });
    }
}
