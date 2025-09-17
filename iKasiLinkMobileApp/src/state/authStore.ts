import { create } from 'zustand';
import * as Keychain from 'react-native-keychain';

export type AuthState = {
	accessToken: string | null;
	setAccessToken: (token: string | null) => Promise<void>;
	loadFromKeychain: () => Promise<void>;
	logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
	accessToken: null,
	setAccessToken: async (token: string | null) => {
		if (token) {
			await Keychain.setGenericPassword('kasi', token, { service: 'ikasi-token' });
			set({ accessToken: token });
		} else {
			await Keychain.resetGenericPassword({ service: 'ikasi-token' });
			set({ accessToken: null });
		}
	},
	loadFromKeychain: async () => {
		try {
			const creds = await Keychain.getGenericPassword({ service: 'ikasi-token' });
			if (creds) set({ accessToken: creds.password });
		} catch {}
	},
	logout: async () => {
		await Keychain.resetGenericPassword({ service: 'ikasi-token' });
		set({ accessToken: null });
	},
}));