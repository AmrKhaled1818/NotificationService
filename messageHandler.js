const log = require('./logger');

function handleNotification(data) {
  // You can later parse real JSON here
  log(`Received Notification: ${data}`);
}

module.exports = handleNotification;
