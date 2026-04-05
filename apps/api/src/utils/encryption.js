const crypto = require('crypto');

/**
 * End-to-end encryption between client and server
 * Client encrypts sensitive data before sending; server decrypts
 * Separate from payment provider integration
 */

const ENCRYPTION_KEY = process.env.E2E_ENCRYPTION_KEY || crypto.randomBytes(32);
const IV_LENGTH = 16;

/**
 * Encrypt data with AES-256-GCM
 */
function encryptData(data) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  
  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return {
    iv: iv.toString('hex'),
    encryptedData: encrypted,
    authTag: authTag.toString('hex'),
  };
}

/**
 * Decrypt data with AES-256-GCM
 */
function decryptData(encrypted) {
  try {
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      ENCRYPTION_KEY,
      Buffer.from(encrypted.iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(encrypted.authTag, 'hex'));
    
    let decrypted = decipher.update(encrypted.encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  } catch (err) {
    throw new Error(`Decryption failed: ${err.message}`);
  }
}

/**
 * Middleware to decrypt E2E encrypted requests
 */
function e2eDecryptMiddleware(req, res, next) {
  if (req.body._encrypted) {
    try {
      const decrypted = decryptData(req.body._encrypted);
      req.body = { ...req.body, ...decrypted };
      delete req.body._encrypted;
    } catch (err) {
      return res.status(400).json({ error: 'decryption_failed' });
    }
  }
  next();
}

module.exports = {
  encryptData,
  decryptData,
  e2eDecryptMiddleware,
  ENCRYPTION_KEY: ENCRYPTION_KEY.toString('hex'),
};
