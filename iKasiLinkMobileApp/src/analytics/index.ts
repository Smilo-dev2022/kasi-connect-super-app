import * as Sentry from '@sentry/react-native';

export const Analytics = {
	trackScreen(screen: string) {
		Sentry.addBreadcrumb({ category: 'navigation', message: `screen:${screen}`, level: 'info' });
	},
	trackEvent(name: string, data?: Record<string, unknown>) {
		Sentry.addBreadcrumb({ category: 'event', message: name, data, level: 'info' });
	},
};

