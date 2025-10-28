import axios, { AxiosInstance } from 'axios';
import { ENV } from '@api/../config/env';
import * as Keychain from 'react-native-keychain';

export interface ApiClientOptions {
  baseURL: string;
  getAccessToken?: () => Promise<string | null> | string | null;
  ward?: string;
}

export function createApiClient(options: ApiClientOptions): AxiosInstance {
  const instance = axios.create({
    baseURL: options.baseURL,
    timeout: 15000,
  });

  instance.interceptors.request.use(async config => {
    const token = typeof options.getAccessToken === 'function' ? await options.getAccessToken() : null;
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (options.ward) {
      config.headers = config.headers ?? {};
      (config.headers as any)['x-ward'] = options.ward;
    }
    return config;
  });

  return instance;
}

// Default API instance that automatically pulls the token from secure storage
export const api = createApiClient({
  baseURL: ENV.apiBaseUrl,
  ward: ENV.ward,
  getAccessToken: async () => {
    try {
      const creds = await Keychain.getGenericPassword({ service: 'ikasi-token' });
      return creds ? creds.password : null;
    } catch {
      return null;
    }
  },
});

