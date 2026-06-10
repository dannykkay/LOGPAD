const crypto = require('crypto');

const createVerificationToken = () => {
  return crypto.randomInt(100000, 999999).toString();
};

module.exports = createVerificationToken;