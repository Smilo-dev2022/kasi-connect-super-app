import React from 'react';
import ThemeProvider from '@theme/ThemeProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Sentry from '@sentry/react-native';
import { ENV } from '@api/../config/env';

const queryClient = new QueryClient();

if (ENV.sentryDsn) {
	Sentry.init({ dsn: ENV.sentryDsn, tracesSampleRate: 0.1 });
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