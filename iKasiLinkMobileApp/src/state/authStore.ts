import { create } from 'zustand';
import * as Keychain from 'react-native-keychain';

export type AuthState = {
    accessToken: string | null;
    hydrated: boolean;
    setAccessToken: (token: string | null) => Promise<void>;
    loadFromKeychain: () => Promise<void>;
    logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
    accessToken: null,
    hydrated: false,
	setAccessToken: async (token: string | null) => {
		if (token) {
			await Keychain.setGenericPassword('kasi', token, { service: 'ikasi-token' });
            set({ accessToken: token, hydrated: true });
		} else {
			await Keychain.resetGenericPassword({ service: 'ikasi-token' });
            set({ accessToken: null, hydrated: true });
		}
	},
	loadFromKeychain: async () => {
		try {
			const creds = await Keychain.getGenericPassword({ service: 'ikasi-token' });
            if (creds) set({ accessToken: creds.password, hydrated: true });
            else set({ hydrated: true });
        } catch {
            set({ hydrated: true });
        }
	},
	logout: async () => {
		await Keychain.resetGenericPassword({ service: 'ikasi-token' });
        set({ accessToken: null, hydrated: true });
	},
}));