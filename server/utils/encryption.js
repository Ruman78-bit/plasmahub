const CryptoJS = require('crypto-js');

const KEY = process.env.ENCRYPTION_KEY;

const encrypt = (text) => {
  if (text === undefined || text === null || text === '') {
    return text;
  }
  return CryptoJS.AES.encrypt(String(text), KEY).toString();
};

const decrypt = (ciphertext) => {
  if (ciphertext === undefined || ciphertext === null || ciphertext === '') {
    return ciphertext;
  }

  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, KEY);
    const decoded = bytes.toString(CryptoJS.enc.Utf8);
    return decoded || ciphertext;
  } catch (error) {
    return ciphertext;
  }
};

module.exports = {
  encrypt,
  decrypt
};
