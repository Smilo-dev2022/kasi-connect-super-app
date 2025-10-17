import Config from 'react-native-config';

export const ENV = {
	apiBaseUrl: Config.API_BASE_URL || 'https://api.kasilink.example',
	sentryDsn: Config.SENTRY_DSN || '',
	socketUrl: Config.SOCKET_URL || 'ws://localhost:8080/ws',
    ward: Config.WARD || 'Ward 48',
};