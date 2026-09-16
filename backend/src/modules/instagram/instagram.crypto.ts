import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

import { config } from '../../config/env.js';
import { AppError } from '../../shared/errors/app-error.js';

const algorithm = 'aes-256-gcm';
const ivLength = 12;
const authTagLength = 16;

function encryptionKey() {
  const value = config.encryptionKey;
  if (!value || !/^[0-9a-f]{64}$/i.test(value)) {
    throw new AppError('INSTAGRAM_CONFIGURATION_ERROR', 'Instagram token encryption is not configured.', 503);
  }
  return Buffer.from(value, 'hex');
}

export function createOpaqueToken() {
  return randomBytes(32).toString('base64url');
}

export function hashOpaqueToken(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

export function encryptToken(plaintext: string) {
  const iv = randomBytes(ivLength);
  const cipher = createCipheriv(algorithm, encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString('base64url');
}

export function decryptToken(ciphertext: string) {
  try {
    const payload = Buffer.from(ciphertext, 'base64url');
    const iv = payload.subarray(0, ivLength);
    const authTag = payload.subarray(ivLength, ivLength + authTagLength);
    const encrypted = payload.subarray(ivLength + authTagLength);
    const decipher = createDecipheriv(algorithm, encryptionKey(), iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
  } catch {
    throw new AppError('INSTAGRAM_TOKEN_UNAVAILABLE', 'The Instagram connection token could not be read.', 409);
  }
}
