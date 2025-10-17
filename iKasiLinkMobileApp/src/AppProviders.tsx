import React from 'react';
import ThemeProvider from '@theme/ThemeProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Sentry from '@sentry/react-native';
import { ENV } from '@api/../config/env';
import { useEffect } from 'react';
import { useAuthStore } from '@state/authStore';

const queryClient = new QueryClient();

if (ENV.sentryDsn) {
  Sentry.init({ dsn: ENV.sentryDsn, tracesSampleRate: 0.1 });
}

// Basic health ping (development visibility)
export function AppHealthPing(): null {
  const token = useAuthStore(s => s.accessToken);
  useEffect(() => {
    const controller = new AbortController();
    fetch(`${ENV.apiBaseUrl.replace(/\/$/, '')}/health`, {
      headers: token ? { Authorization: `Bearer ${token}` } as any : undefined,
      signal: controller.signal,
    }).catch(() => {});
    return () => controller.abort();
  }, [token]);
  return null;
}

export default function AppProviders({ children }: { children: React.ReactNode }) {
	return (
		<Sentry.TouchEventBoundary>
			<QueryClientProvider client={queryClient}>
				<ThemeProvider>{children}</ThemeProvider>
			</QueryClientProvider>
		</Sentry.TouchEventBoundary>
	);
}