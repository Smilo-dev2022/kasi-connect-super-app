import { API_BASE } from "./config";

export async function ensureServiceWorker(): Promise<ServiceWorkerRegistration> {
  if (!('serviceWorker' in navigator)) throw new Error('Service workers not supported');
  const reg = await navigator.serviceWorker.register('/sw.js');
  return reg;
}

async function getVapidPublicKey(): Promise<Uint8Array> {
  const res = await fetch(`${API_BASE}/push/vapidPublicKey`);
  const json = await res.json();
  const base64 = json.key as string;
  return urlBase64ToUint8Array(base64);
}

export async function subscribePush(authToken: string): Promise<boolean> {
  const reg = await ensureServiceWorker();
  const vapidKey = await getVapidPublicKey();
  const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: vapidKey });
  const response = await fetch(`${API_BASE}/push/subscribe`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${authToken}` },
    body: JSON.stringify({ subscription: sub }),
  });
  return response.ok;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

