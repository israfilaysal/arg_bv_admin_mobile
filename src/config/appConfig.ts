export const IS_DEV = __DEV__;

// Canlı ve Lokal Portal Kök Adresleri
export const LOCAL_PORTAL_URL = 'http://local.argteknoloji.com/portal';
export const LOCAL_WIFI_URL = 'http://192.168.1.102:8085/portal';
export const EMULATOR_PORTAL_URL = 'http://10.0.2.2/portal';
export const LIVE_PORTAL_URL = 'https://admin.bundanvarmi.com/portal';

// Uyumluluk için takma adlar (Aliases)
export const LOCAL_SERVICE_URL = LOCAL_PORTAL_URL;
export const LIVE_SERVICE_URL = LIVE_PORTAL_URL;

// Varsayılan Portal Kök Adresi (Geliştirme / Test aşamasında local portal kullanılır)
export const DEFAULT_PORTAL_URL = LOCAL_PORTAL_URL;
export const URL_BASE = DEFAULT_PORTAL_URL;

/**
 * Kullanıcının girdiği adresi Portal Kök Adresi (örn: https://admin.bundanvarmi.com/portal) formatına normalize eder.
 */
export function normalizePortalUrl(inputUrl?: string | null): string {
  if (!inputUrl || typeof inputUrl !== 'string' || inputUrl.trim().length === 0) {
    return DEFAULT_PORTAL_URL;
  }

  let clean = inputUrl.trim();
  while (clean.endsWith('/')) {
    clean = clean.slice(0, -1);
  }

  // Eğer kullanıcı servis yolunu yazdıysa portal köküne kırp
  const lower = clean.toLowerCase();
  if (lower.endsWith('/arg-bv/bvservice')) {
    clean = clean.slice(0, -17);
  } else if (lower.endsWith('/arg-session/sessionservice/token')) {
    clean = clean.slice(0, -32);
  } else if (lower.endsWith('/arg-session/sessionservice')) {
    clean = clean.slice(0, -26);
  }

  // Eğer kullanıcı sonuna /portal eklemediyse ekle
  if (!clean.toLowerCase().endsWith('/portal')) {
    clean = `${clean}/portal`;
  }

  return clean;
}

export const normalizeServiceUrl = normalizePortalUrl;




