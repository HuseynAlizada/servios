import { CookieManager, isBrowser } from 'everyday-helper';

import { encryptValue, decryptValue, obfuscateKey } from './crypto';
import type { TokenConfig, SingleTokenConfig, TokenCookieOptions, EncryptConfig } from './types';

const DEFAULT_ACCESS_TOKEN_KEY = 'accessToken';
const DEFAULT_REFRESH_TOKEN_KEY = 'refreshToken';

const DEFAULT_COOKIE_OPTIONS: Required<TokenCookieOptions> = {
  path: '/',
  expires: 7,
  secure: true,
  httpOnly: false,
  sameSite: 'Strict' as const,
};

const DEFAULT_REFRESH_COOKIE_OPTIONS: Required<TokenCookieOptions> = {
  path: '/',
  expires: 30,
  secure: true,
  httpOnly: false,
  sameSite: 'Strict' as const,
};

let globalTokenConfig: {
  tokenKey: string;
  encrypt?: EncryptConfig;
  cookieOptions: Required<TokenCookieOptions>;
  storage: 'cookie' | 'localStorage' | 'sessionStorage';
  refreshToken?: {
    tokenKey: string;
    cookieOptions: Required<TokenCookieOptions>;
    encrypt?: EncryptConfig;
    storage: 'cookie' | 'localStorage' | 'sessionStorage';
  };
} = {
  storage: 'cookie',
  tokenKey: DEFAULT_ACCESS_TOKEN_KEY,
  cookieOptions: DEFAULT_COOKIE_OPTIONS,
  refreshToken: {
    storage: 'cookie',
    tokenKey: DEFAULT_REFRESH_TOKEN_KEY,
    cookieOptions: DEFAULT_REFRESH_COOKIE_OPTIONS,
  },
};

export const configureToken = (config: TokenConfig): void => {
  globalTokenConfig = {
    tokenKey: config.tokenKey || DEFAULT_ACCESS_TOKEN_KEY,
    storage: config.storage || 'cookie',
    cookieOptions: {
      ...DEFAULT_COOKIE_OPTIONS,
      ...config.cookieOptions,
    },
    encrypt: config.encrypt,
    refreshToken: config.refreshToken
      ? {
          tokenKey: config.refreshToken.tokenKey || DEFAULT_REFRESH_TOKEN_KEY,
          storage: config.refreshToken.storage || 'cookie',
          cookieOptions: {
            ...DEFAULT_REFRESH_COOKIE_OPTIONS,
            ...config.refreshToken.cookieOptions,
          },
          encrypt: config.refreshToken.encrypt,
        }
      : {
          storage: 'cookie',
          tokenKey: DEFAULT_REFRESH_TOKEN_KEY,
          cookieOptions: DEFAULT_REFRESH_COOKIE_OPTIONS,
        },
  };
};

const resolveStorageKey = (tokenKey: string, encrypt?: EncryptConfig): string =>
  encrypt ? obfuscateKey(tokenKey, encrypt) : tokenKey;

const setTokenInStorage = (
  token: string,
  storage: 'cookie' | 'localStorage' | 'sessionStorage',
  tokenKey: string,
  cookieOptions?: TokenCookieOptions,
  encrypt?: EncryptConfig,
): void => {
  const key = resolveStorageKey(tokenKey, encrypt);
  const value = encrypt ? encryptValue(token, encrypt) : token;

  switch (storage) {
    case 'localStorage':
      if (isBrowser()) {
        localStorage.setItem(key, value);
      }
      break;
    case 'sessionStorage':
      if (isBrowser()) {
        sessionStorage.setItem(key, value);
      }
      break;
    case 'cookie':
    default:
      CookieManager.set(key, value, {
        ...DEFAULT_COOKIE_OPTIONS,
        ...cookieOptions,
      });
      break;
  }
};

const getTokenFromStorage = (
  storage: 'cookie' | 'localStorage' | 'sessionStorage',
  tokenKey: string,
  encrypt?: EncryptConfig,
): string | null => {
  const key = resolveStorageKey(tokenKey, encrypt);

  let raw: string | null = null;

  switch (storage) {
    case 'localStorage':
      raw = isBrowser() ? localStorage.getItem(key) : null;
      break;
    case 'sessionStorage':
      raw = isBrowser() ? sessionStorage.getItem(key) : null;
      break;
    case 'cookie':
    default:
      raw = CookieManager.get(key);
  }

  if (!raw) return null;
  return encrypt ? decryptValue(raw, encrypt) : raw;
};

const removeTokenFromStorage = (
  storage: 'cookie' | 'localStorage' | 'sessionStorage',
  tokenKey: string,
  cookieOptions?: TokenCookieOptions,
  encrypt?: EncryptConfig,
): void => {
  const key = resolveStorageKey(tokenKey, encrypt);

  switch (storage) {
    case 'localStorage':
      if (isBrowser()) {
        localStorage.removeItem(key);
      }
      break;
    case 'sessionStorage':
      if (isBrowser()) {
        sessionStorage.removeItem(key);
      }
      break;
    case 'cookie':
    default:
      CookieManager.remove(key, {
        path: cookieOptions?.path || '/',
      });
      break;
  }
};

export const setToken = (token: string, config?: TokenConfig): void => {
  const tokenConfig = config || globalTokenConfig;
  const tokenKey = tokenConfig.tokenKey || DEFAULT_ACCESS_TOKEN_KEY;
  const storage = tokenConfig.storage || 'cookie';
  setTokenInStorage(token, storage, tokenKey, tokenConfig.cookieOptions, tokenConfig.encrypt);
};

export const getToken = (config?: TokenConfig): string | null => {
  const tokenConfig = config || globalTokenConfig;
  const tokenKey = tokenConfig.tokenKey || DEFAULT_ACCESS_TOKEN_KEY;
  const storage = tokenConfig.storage || 'cookie';
  return getTokenFromStorage(storage, tokenKey, tokenConfig.encrypt);
};

export const removeToken = (config?: TokenConfig): void => {
  const tokenConfig = config || globalTokenConfig;
  const tokenKey = tokenConfig.tokenKey || DEFAULT_ACCESS_TOKEN_KEY;
  const storage = tokenConfig.storage || 'cookie';
  removeTokenFromStorage(storage, tokenKey, tokenConfig.cookieOptions, tokenConfig.encrypt);
};

export const setRefreshToken = (token: string, config?: TokenConfig): void => {
  const refreshConfig = config?.refreshToken || globalTokenConfig.refreshToken;
  if (!refreshConfig) return;

  const tokenKey = refreshConfig.tokenKey || DEFAULT_REFRESH_TOKEN_KEY;
  const storage = refreshConfig.storage || 'cookie';
  setTokenInStorage(token, storage, tokenKey, refreshConfig.cookieOptions, refreshConfig.encrypt);
};

export const getRefreshToken = (config?: TokenConfig): string | null => {
  const refreshConfig = config?.refreshToken || globalTokenConfig.refreshToken;
  if (!refreshConfig) return null;

  const tokenKey = refreshConfig.tokenKey || DEFAULT_REFRESH_TOKEN_KEY;
  const storage = refreshConfig.storage || 'cookie';
  return getTokenFromStorage(storage, tokenKey, refreshConfig.encrypt);
};

export const removeRefreshToken = (config?: TokenConfig): void => {
  const refreshConfig = config?.refreshToken || globalTokenConfig.refreshToken;
  if (!refreshConfig) return;

  const tokenKey = refreshConfig.tokenKey || DEFAULT_REFRESH_TOKEN_KEY;
  const storage = refreshConfig.storage || 'cookie';
  removeTokenFromStorage(storage, tokenKey, refreshConfig.cookieOptions, refreshConfig.encrypt);
};
