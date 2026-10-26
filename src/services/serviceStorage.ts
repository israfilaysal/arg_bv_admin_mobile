import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { DEFAULT_PORTAL_URL, normalizePortalUrl } from '../config/appConfig';

const TOKEN_KEY = 'bv_admin_access_token';
const USER_KEY = 'bv_admin_user_data';
const BASE_URL_KEY = 'bv_admin_base_url';
const CREDS_KEY = 'bv_admin_session_credentials';

export interface SavedCredentials {
  username: string;
  password: string;
  organization: string;
}

// Bellek içi önbellek (In-memory cache)
let _cachedToken: string | null = null;
let _cachedUserData: any | null = null;
let _cachedBaseUrl: string | null = null;
let _cachedCredentials: SavedCredentials | null = null;

// Platform kontrolü: Web ortamında window.localStorage kullanılır
const isWeb = Platform.OS === 'web' || (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined');

async function storageGet(key: string): Promise<string | null> {
  if (isWeb) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

async function storageSet(key: string, value: string): Promise<void> {
  if (isWeb) {
    try {
      window.localStorage.setItem(key, value);
    } catch (e) {
      console.warn('Web storage set error', e);
    }
    return;
  }
  try {
    await SecureStore.setItemAsync(key, value);
  } catch (e) {
    console.warn('SecureStore set error', e);
  }
}

async function storageDelete(key: string): Promise<void> {
  if (isWeb) {
    try {
      window.localStorage.removeItem(key);
    } catch {}
    return;
  }
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {}
}

export const serviceStorage = {
  // ----------------------------------------------------
  // Token İşlemleri
  // ----------------------------------------------------
  getToken: async (): Promise<string | null> => {
    if (_cachedToken) return _cachedToken;
    const val = await storageGet(TOKEN_KEY);
    _cachedToken = val;
    return val;
  },

  setToken: async (token: string): Promise<void> => {
    _cachedToken = token;
    await storageSet(TOKEN_KEY, token);
  },

  removeToken: async (): Promise<void> => {
    _cachedToken = null;
    await storageDelete(TOKEN_KEY);
  },

  // ----------------------------------------------------
  // Kullanıcı Bilgisi
  // ----------------------------------------------------
  getUserData: async (): Promise<any | null> => {
    if (_cachedUserData) return _cachedUserData;
    const raw = await storageGet(USER_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      _cachedUserData = parsed;
      return parsed;
    } catch {
      return null;
    }
  },

  setUserData: async (user: any): Promise<void> => {
    _cachedUserData = user;
    if (user) {
      await storageSet(USER_KEY, JSON.stringify(user));
    } else {
      await storageDelete(USER_KEY);
    }
  },

  // ----------------------------------------------------
  // Oturum Kimlik Bilgileri (Sessiz Yenileme / Re-login için)
  // ----------------------------------------------------
  getSavedCredentials: async (): Promise<SavedCredentials | null> => {
    if (_cachedCredentials) return _cachedCredentials;
    const raw = await storageGet(CREDS_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      _cachedCredentials = parsed;
      return parsed;
    } catch {
      return null;
    }
  },

  setSavedCredentials: async (creds: SavedCredentials): Promise<void> => {
    _cachedCredentials = creds;
    await storageSet(CREDS_KEY, JSON.stringify(creds));
  },

  clearSavedCredentials: async (): Promise<void> => {
    _cachedCredentials = null;
    await storageDelete(CREDS_KEY);
  },

  // ----------------------------------------------------
  // Portal URL Yönetimi
  // ----------------------------------------------------
  getBaseUrl: async (): Promise<string> => {
    if (_cachedBaseUrl) return _cachedBaseUrl;
    const saved = await storageGet(BASE_URL_KEY);
    const normalized = normalizePortalUrl(saved || DEFAULT_PORTAL_URL);
    _cachedBaseUrl = normalized;
    return normalized;
  },

  setBaseUrl: async (url: string): Promise<void> => {
    const normalized = normalizePortalUrl(url);
    _cachedBaseUrl = normalized;
    await storageSet(BASE_URL_KEY, normalized);
  },

  resetBaseUrl: async (): Promise<void> => {
    _cachedBaseUrl = DEFAULT_PORTAL_URL;
    await storageDelete(BASE_URL_KEY);
  },

  // ----------------------------------------------------
  // Oturumu Tamamen Kapatma (Logout)
  // ----------------------------------------------------
  clearAll: async (): Promise<void> => {
    _cachedToken = null;
    _cachedUserData = null;
    _cachedCredentials = null;
    await serviceStorage.removeToken();
    await storageDelete(USER_KEY);
    await storageDelete(CREDS_KEY);
  },
};
