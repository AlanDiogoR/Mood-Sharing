import { CONFIG } from '../constants/config';

export const getServerBaseUrl = (): string => {
  return CONFIG.API_BASE_URL.replace(/\/api\/?$/, '');
};

export const getAbsoluteUrl = (relativeUrl?: string | null): string | null => {
  if (!relativeUrl) {
    return null;
  }
  if (relativeUrl.startsWith('http://') || relativeUrl.startsWith('https://')) {
    return relativeUrl;
  }
  return `${getServerBaseUrl()}${relativeUrl}`;
};
