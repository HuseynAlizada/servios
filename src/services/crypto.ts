import CryptoJS from 'crypto-js';

import type { EncryptConfig } from './types';

export const encryptValue = (value: string, config: EncryptConfig): string =>
  CryptoJS.AES.encrypt(value, config.secret).toString();

export const decryptValue = (encrypted: string, config: EncryptConfig): string | null => {
  try {
    const bytes = CryptoJS.AES.decrypt(encrypted, config.secret);
    return bytes.toString(CryptoJS.enc.Utf8) || null;
  } catch {
    return null;
  }
};

export const obfuscateKey = (key: string, config: EncryptConfig): string =>
  CryptoJS.HmacSHA256(key, config.secret).toString().substring(0, 24);
