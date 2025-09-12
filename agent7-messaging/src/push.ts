import { Device, userIdToDevices } from './state';

type PushPayload = {
    title: string;
    body: string;
    collapseId?: string;
};

const FCM_SERVER_KEY = process.env.FCM_SERVER_KEY || '';

async function sendFcmToToken(token: string, payload: PushPayload): Promise<void> {
    if (!FCM_SERVER_KEY) return;
    const res = await fetch('https://fcm.googleapis.com/fcm/send', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `key=${FCM_SERVER_KEY}`,
        },
        body: JSON.stringify({
            to: token,
            notification: { title: payload.title, body: payload.body },
            android: payload.collapseId ? { collapse_key: payload.collapseId } : undefined,
        }),
    });
    if (!res.ok) {
        // eslint-disable-next-line no-console
        console.warn('FCM send failed', res.status);
    }
}

export async function pushNotifyUser(userId: string, payload: PushPayload): Promise<void> {
    const devices: Device[] = userIdToDevices.get(userId) || [];
    const androidTokens = devices.filter((d) => d.platform === 'android').map((d) => d.token);
    await Promise.all(androidTokens.map((t) => sendFcmToToken(t, payload)));
}

