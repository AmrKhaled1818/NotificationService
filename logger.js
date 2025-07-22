const fs = require('fs');

function log(message) {
  const timestamp = new Date().toISOString();
  const fullMessage = `[${timestamp}] ${message}\n`;
  fs.appendFileSync('messages.txt', fullMessage);
}

module.exports = log;
