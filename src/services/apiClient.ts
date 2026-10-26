import axios from 'axios';
import { DEFAULT_PORTAL_URL, normalizePortalUrl } from '../config/appConfig';
import { serviceStorage } from './serviceStorage';
import { ArgResult } from '../types';

export const apiClient = axios.create({
  baseURL: DEFAULT_PORTAL_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Eşzamanlı isteklerde mükerrer oturum açmayı engelleyen tekil yenileme sözü
let refreshPromise: Promise<string | null> | null = null;

async function doSilentRelogin(): Promise<string | null> {
  try {
    const creds = await serviceStorage.getSavedCredentials();
    if (!creds || !creds.username || !creds.password) {
      return null;
    }

    const currentBaseUrl = await serviceStorage.getBaseUrl();
    const normalizedUrl = normalizePortalUrl(currentBaseUrl);
    const loginUrl = `${normalizedUrl}/arg-Session/SessionService/Token/Login`;

    const headers: any = { 'Content-Type': 'application/json' };
    if (
      normalizedUrl.includes('192.168.') ||
      normalizedUrl.includes('10.0.2.2') ||
      normalizedUrl.includes('127.0.0.1')
    ) {
      headers['Host'] = 'local.argteknoloji.com';
    }

    // Döngüye girmemek için bağımsız axios çağrısı
    const res = await axios.post(
      loginUrl,
      {
        UserName: creds.username.trim(),
        Password: creds.password,
        SystemCode: creds.organization?.trim() || 'arg',
      },
      {
        headers,
        timeout: 15000,
      }
    );

    const d = res.data;
    const val = d?.data ?? d?.Data ?? d?.value ?? d?.Value;
    const token =
      val?.token ??
      val?.Token ??
      val?.accesstoken ??
      val?.AccessToken ??
      val?.jwt ??
      val?.Jwt;

    if (token) {
      await serviceStorage.setToken(token);
      const userData = val?.userInfoEntity ?? val?.user ?? val;
      if (userData) {
        await serviceStorage.setUserData(userData);
      }
      return token;
    }
    return null;
  } catch (err) {
    console.warn('[Silent Relogin Failed]:', err);
    return null;
  }
}

apiClient.interceptors.request.use(
  async (config) => {
    // Dinamik olarak kayıtlı Portal URL'sini al
    try {
      const currentBaseUrl = await serviceStorage.getBaseUrl();
      if (currentBaseUrl) {
        config.baseURL = normalizePortalUrl(currentBaseUrl);
      }
    } catch {}

    const targetUrl = (config.baseURL || '') + (config.url || '');
    if (
      targetUrl.includes('192.168.') ||
      targetUrl.includes('10.0.2.2') ||
      targetUrl.includes('127.0.0.1')
    ) {
      config.headers = config.headers || {};
      config.headers['Host'] = 'local.argteknoloji.com';
    }

    const token = await serviceStorage.getToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    const d = response.data;
    if (d && typeof d === 'object') {
      const resulttype = d.resulttype ?? d.ResultType ?? d.resultType ?? (d.success ? 1 : 2);
      const data = d.data ?? d.Data ?? d.value ?? d.Value;
      const description = d.description ?? d.Description ?? d.message ?? d.Message;
      return {
        ...d,
        resulttype,
        ResultType: resulttype,
        data,
        Data: data,
        description,
        Description: description,
        value: data,
        Value: data,
      };
    }
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const url = (originalRequest?.url || '').toLowerCase();

    // 401 durumunda ve eğer bu bir giriş isteği değilse ve daha önce retry yapılmadıysa sessizce oturumu yenile
    const isLoginEndpoint = url.includes('/token/login') || url.includes('/sessionservice/token');
    if (status === 401 && !originalRequest?._retry && !isLoginEndpoint) {
      originalRequest._retry = true;

      if (!refreshPromise) {
        refreshPromise = doSilentRelogin().finally(() => {
          refreshPromise = null;
        });
      }

      const newToken = await refreshPromise;
      if (newToken) {
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        // Başarılı oturum tazelemesi sonrası isteği tekrarla
        return apiClient(originalRequest);
      }
    }

    const errData = error.response?.data;
    const message =
      errData?.Description ||
      errData?.description ||
      errData?.message ||
      errData?.Message ||
      (status === 401 ? 'Oturum süresi dolmuş veya yetkiniz yok (401).' : error.message) ||
      'Bir bağlantı hatası oluştu';

    console.warn(`[API Error ${status || ''}] ${error.config?.url}:`, message);
    return Promise.resolve({
      resulttype: 2,
      ResultType: 2,
      status,
      message,
      description: message,
      Description: message,
    } as any);
  }
);
