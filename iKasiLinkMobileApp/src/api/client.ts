import axios, { AxiosInstance } from 'axios';

export interface ApiClientOptions {
  baseURL: string;
  getAccessToken?: () => Promise<string | null> | string | null;
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
    return config;
  });

  return instance;
}

export const api = createApiClient({ baseURL: 'https://api.kasilink.example' });

