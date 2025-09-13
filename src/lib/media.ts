// Media service using IndexedDB for storing original files and generated thumbnails

export type MediaCategory = "image" | "video" | "audio" | "other";

export interface MediaRecord {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  createdAt: number;
  category: MediaCategory;
  width?: number;
  height?: number;
  duration?: number;
  blob: Blob;
  thumbnail: Blob | null;
}

export interface MediaSummary {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  createdAt: number;
  category: MediaCategory;
  thumbnailUrl: string;
}

const DB_NAME = "kasilink-media-db";
const DB_VERSION = 1;
const STORE_NAME = "media";
const FALLBACK_THUMBNAIL = "/placeholder.svg";
const mediaApiBase = ((import.meta as any).env?.VITE_MEDIA_API as string | undefined) || undefined;

function openMediaDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("createdAt", "createdAt", { unique: false });
        store.createIndex("category", "category", { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => Promise<T> | T): Promise<T> {
  const db = await openMediaDB();
  try {
    const tx = db.transaction(STORE_NAME, mode);
    const store = tx.objectStore(STORE_NAME);
    const result = await fn(store);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
    return result;
  } finally {
    db.close();
  }
}

function generateId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function getCategoryFromMime(mimeType: string): MediaCategory {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  return "other";
}

async function createImageThumbnail(file: File, maxSize = 384): Promise<{ blob: Blob; width: number; height: number }> {
  const imageBitmap = await createImageBitmap(file);
  const ratio = imageBitmap.width / imageBitmap.height;
  let targetWidth = maxSize;
  let targetHeight = Math.round(maxSize / ratio);
  if (imageBitmap.height > imageBitmap.width) {
    targetHeight = maxSize;
    targetWidth = Math.round(maxSize * ratio);
  }

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context not available");
  ctx.drawImage(imageBitmap, 0, 0, targetWidth, targetHeight);

  const blob: Blob = await new Promise((resolve) => canvas.toBlob((b) => resolve(b || new Blob()), "image/webp", 0.8));
  return { blob, width: imageBitmap.width, height: imageBitmap.height };
}

async function loadVideoMetadata(file: File): Promise<HTMLVideoElement> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.src = objectUrl;
    await new Promise<void>((resolve, reject) => {
      const onLoaded = () => resolve();
      const onError = () => reject(new Error("Failed to load video metadata"));
      video.addEventListener("loadedmetadata", onLoaded, { once: true });
      video.addEventListener("error", onError, { once: true });
    });
    return video;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function createVideoThumbnail(file: File, maxSize = 384): Promise<{ blob: Blob; width: number; height: number; duration: number }> {
  const objectUrl = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.src = objectUrl;
  video.muted = true;
  (video as any).playsInline = true;
  await new Promise<void>((resolve) => {
    const onLoaded = async () => {
      try {
        const targetTime = Math.min(0.1, (video.duration || 1) / 10);
        if (Number.isFinite(video.duration)) {
          video.currentTime = targetTime;
          await new Promise<void>((r2) => video.addEventListener("seeked", () => r2(), { once: true }));
        }
        resolve();
      } catch {
        resolve();
      }
    };
    video.addEventListener("loadeddata", onLoaded, { once: true });
    video.addEventListener("error", () => resolve(), { once: true });
  });

  const ratio = (video.videoWidth || 16) / (video.videoHeight || 9);
  let targetWidth = maxSize;
  let targetHeight = Math.round(maxSize / ratio);
  if ((video.videoHeight || 9) > (video.videoWidth || 16)) {
    targetHeight = maxSize;
    targetWidth = Math.round(maxSize * ratio);
  }

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context not available");
  ctx.drawImage(video, 0, 0, targetWidth, targetHeight);

  const blob: Blob = await new Promise((resolve) => canvas.toBlob((b) => resolve(b || new Blob()), "image/webp", 0.8));
  const width = video.videoWidth || targetWidth;
  const height = video.videoHeight || targetHeight;
  const duration = Number.isFinite(video.duration) ? video.duration : 0;

  URL.revokeObjectURL(objectUrl);
  return { blob, width, height, duration };
}

export async function addMedia(file: File): Promise<MediaSummary> {
  const id = generateId();
  const createdAt = Date.now();
  const mimeType = file.type || "application/octet-stream";
  const category = getCategoryFromMime(mimeType);

  // If media API is configured, upload to backend (S3/MinIO) using presigned PUT
  if (mediaApiBase) {
    // Request presigned URL
    const presignRes = await fetch(`${mediaApiBase}/uploads/presign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentType: mimeType, fileName: file.name, folder: category }),
    });
    if (!presignRes.ok) throw new Error("failed-to-presign-upload");
    const { url, headers, key } = (await presignRes.json()) as { url: string; method: string; key: string; headers: Record<string, string> };

    // Upload file directly to object storage
    const putRes = await fetch(url, { method: "PUT", headers, body: file });
    if (!putRes.ok) throw new Error("upload-failed");

    // Build thumbnail URL using media service thumbnail endpoint for images
    const thumbnailUrl = isImage(mimeType)
      ? `${mediaApiBase}/thumb?key=${encodeURIComponent(key)}&w=384&format=webp&q=80`
      : FALLBACK_THUMBNAIL;

    return {
      id,
      name: file.name,
      mimeType,
      size: file.size,
      createdAt,
      category,
      thumbnailUrl,
    };
  }

  // Fallback: client-side only (IndexedDB + generated thumbnails)
  let width: number | undefined;
  let height: number | undefined;
  let duration: number | undefined;
  let thumbnail: Blob | null = null;

  try {
    if (category === "image") {
      const thumb = await createImageThumbnail(file);
      thumbnail = thumb.blob;
      width = thumb.width;
      height = thumb.height;
    } else if (category === "video") {
      const thumb = await createVideoThumbnail(file);
      thumbnail = thumb.blob;
      width = thumb.width;
      height = thumb.height;
      duration = thumb.duration;
    } else {
      thumbnail = null;
    }
  } catch {
    thumbnail = null;
  }

  const record: MediaRecord = {
    id,
    name: file.name,
    mimeType,
    size: file.size,
    createdAt,
    category,
    width,
    height,
    duration,
    blob: file,
    thumbnail,
  };

  await withStore("readwrite", async (store) => {
    await new Promise<void>((resolve, reject) => {
      const req = store.add(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  });

  const thumbnailUrl = record.thumbnail ? URL.createObjectURL(record.thumbnail) : FALLBACK_THUMBNAIL;
  return {
    id: record.id,
    name: record.name,
    mimeType: record.mimeType,
    size: record.size,
    createdAt: record.createdAt,
    category: record.category,
    thumbnailUrl,
  };
}

export async function listMedia(): Promise<MediaSummary[]> {
  const records = await withStore<MediaRecord[]>("readonly", async (store) => {
    if ("getAll" in store) {
      const all: MediaRecord[] = await new Promise((resolve, reject) => {
        const req = (store as any).getAll();
        req.onsuccess = () => resolve(req.result as MediaRecord[]);
        req.onerror = () => reject(req.error);
      });
      return all;
    }
    const items: MediaRecord[] = [];
    await new Promise<void>((resolve, reject) => {
      const cursorReq = store.openCursor();
      cursorReq.onsuccess = (ev) => {
        const cursor = (ev.target as IDBRequest).result as IDBCursorWithValue | null;
        if (cursor) {
          items.push(cursor.value as MediaRecord);
          cursor.continue();
        } else {
          resolve();
        }
      };
      cursorReq.onerror = () => reject(cursorReq.error);
    });
    return items;
  });

  const sorted = records.sort((a, b) => b.createdAt - a.createdAt);
  return sorted.map((r) => ({
    id: r.id,
    name: r.name,
    mimeType: r.mimeType,
    size: r.size,
    createdAt: r.createdAt,
    category: r.category,
    thumbnailUrl: r.thumbnail ? URL.createObjectURL(r.thumbnail) : FALLBACK_THUMBNAIL,
  }));
}

export async function getMediaObjectUrl(id: string): Promise<string> {
  if (mediaApiBase) {
    // When using backend storage, the id is not the storage key; companies often return keys after metadata creation.
    // For this demo, prompt callers to pass the storage key instead of id for remote fetch, or use /media/proxy when key is known.
    throw new Error("getMediaObjectUrl is not supported with remote media API in this demo");
  }
  const record = await withStore<MediaRecord | undefined>("readonly", async (store) => {
    const result: MediaRecord | undefined = await new Promise((resolve, reject) => {
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result as MediaRecord | undefined);
      req.onerror = () => reject(req.error);
    });
    return result;
  });
  if (!record) throw new Error("Media not found");
  return URL.createObjectURL(record.blob);
}

export async function deleteMedia(id: string): Promise<void> {
  await withStore("readwrite", async (store) => {
    await new Promise<void>((resolve, reject) => {
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  });
}

export async function clearAllMedia(): Promise<void> {
  await withStore("readwrite", async (store) => {
    await new Promise<void>((resolve, reject) => {
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  });
}

export function revokeSummaryUrls(summaries: MediaSummary[]): void {
  for (const item of summaries) {
    if (item.thumbnailUrl && item.thumbnailUrl !== FALLBACK_THUMBNAIL) {
      try { URL.revokeObjectURL(item.thumbnailUrl); } catch {}
    }
  }
}

export function isImage(mime: string): boolean { return mime.startsWith("image/"); }
export function isVideo(mime: string): boolean { return mime.startsWith("video/"); }
export function isAudio(mime: string): boolean { return mime.startsWith("audio/"); }