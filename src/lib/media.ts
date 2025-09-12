import localforage from "localforage";

export type MediaKind = "image" | "video" | "audio" | "file";

export interface StoredMediaItem {
  id: string;
  kind: MediaKind;
  name: string;
  size: number;
  type: string;
  createdAt: number;
  blob: Blob;
  thumbnail?: string; // data URL
}

const MEDIA_STORE = "media-items";

const mediaStore = localforage.createInstance({
  name: "app-media",
  storeName: MEDIA_STORE,
  description: "Local media items store",
});

export async function listMedia(): Promise<StoredMediaItem[]> {
  const items: StoredMediaItem[] = [];
  await mediaStore.iterate<StoredMediaItem, void>((value) => {
    items.push(value);
  });
  // newest first
  items.sort((a, b) => b.createdAt - a.createdAt);
  return items;
}

export async function getMedia(id: string): Promise<StoredMediaItem | null> {
  const item = await mediaStore.getItem<StoredMediaItem>(id);
  return item ?? null;
}

export async function deleteMedia(id: string): Promise<void> {
  await mediaStore.removeItem(id);
}

export function detectKind(file: File): MediaKind {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("audio/")) return "audio";
  return "file";
}

export async function generateImageThumbnail(
  fileOrBlob: File | Blob,
  maxSize: number = 256
): Promise<string> {
  const blobUrl = URL.createObjectURL(fileOrBlob);
  try {
    const img = await loadImage(blobUrl);
    const { canvas, ctx } = createCanvasForImage(img, maxSize);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.8);
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}

export async function generateVideoThumbnail(
  file: File,
  seekSeconds: number = 0.1,
  maxSize: number = 256
): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.src = url;
    await videoLoaded(video);
    if (video.duration && !Number.isNaN(video.duration)) {
      video.currentTime = Math.min(seekSeconds, Math.max(0, video.duration - 0.2));
      await videoSeeked(video);
    }
    const canvas = document.createElement("canvas");
    const scale = Math.min(maxSize / video.videoWidth, maxSize / video.videoHeight, 1);
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context not available");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.8);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function videoLoaded(video: HTMLVideoElement): Promise<void> {
  return new Promise((resolve, reject) => {
    const onLoaded = () => {
      cleanup();
      resolve();
    };
    const onError = (e: any) => {
      cleanup();
      reject(e);
    };
    const cleanup = () => {
      video.removeEventListener("loadeddata", onLoaded);
      video.removeEventListener("error", onError);
    };
    video.addEventListener("loadeddata", onLoaded);
    video.addEventListener("error", onError);
  });
}

function videoSeeked(video: HTMLVideoElement): Promise<void> {
  return new Promise((resolve) => {
    const onSeeked = () => {
      video.removeEventListener("seeked", onSeeked);
      resolve();
    };
    video.addEventListener("seeked", onSeeked);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

function createCanvasForImage(
  img: HTMLImageElement,
  maxSize: number
): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
  const width = Math.round(img.width * scale);
  const height = Math.round(img.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas 2D context not available");
  }
  return { canvas, ctx };
}

export async function saveFile(file: File): Promise<StoredMediaItem> {
  const id = crypto.randomUUID();
  const kind = detectKind(file);
  const createdAt = Date.now();
  let thumbnail: string | undefined = undefined;
  try {
    if (kind === "image") {
      thumbnail = await generateImageThumbnail(file);
    } else if (kind === "video") {
      thumbnail = await generateVideoThumbnail(file);
    }
  } catch (err) {
    // ignore thumbnail errors; store main blob anyway
  }
  const item: StoredMediaItem = {
    id,
    kind,
    name: file.name,
    size: file.size,
    type: file.type,
    createdAt,
    blob: file,
    thumbnail,
  };
  await mediaStore.setItem(id, item);
  return item;
}

