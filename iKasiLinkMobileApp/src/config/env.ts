import Config from 'react-native-config';

export const ENV = {
	apiBaseUrl: Config.API_BASE_URL || 'https://api.kasilink.example',
	sentryDsn: Config.SENTRY_DSN || '',
	socketUrl: Config.SOCKET_URL || 'wss://realtime.kasilink.example',
};