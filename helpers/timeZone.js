const moment = require('moment-timezone');

const toIST = (date) => moment(date).tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss');

module.exports = { toIST };
