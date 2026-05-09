import type { ImportedImage } from "../types";

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

export function isSupportedImage(file: File) {
  return ACCEPTED_TYPES.includes(file.type);
}

export async function loadImageFile(file: File): Promise<ImportedImage> {
  if (!isSupportedImage(file)) {
    throw new Error("无法读取这张图片，请换一张 PNG、JPG 或 WEBP。");
  }

  const src = URL.createObjectURL(file);
  const image = await loadHtmlImage(src);

  return {
    id: crypto.randomUUID(),
    name: file.name || "pasted-image",
    width: image.naturalWidth,
    height: image.naturalHeight,
    src
  };
}

export function loadHtmlImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("图片读取失败。"));
    image.src = src;
  });
}

export async function getClipboardImageFile(): Promise<File> {
  if (!navigator.clipboard?.read) {
    throw new Error("当前浏览器不允许直接读取剪贴板，请复制图片后按 Command+V 粘贴。");
  }

  const items = await navigator.clipboard.read();

  for (const item of items) {
    const type = item.types.find((itemType) => itemType.startsWith("image/"));
    if (type) {
      const blob = await item.getType(type);
      return new File([blob], "clipboard-image.png", { type });
    }
  }

  throw new Error("剪贴板里没有可用图片。");
}

export function getImageFileFromClipboardData(clipboardData: DataTransfer | null): File | null {
  if (!clipboardData) return null;

  const file = Array.from(clipboardData.files).find((item) => item.type.startsWith("image/"));
  if (file) return file;

  const item = Array.from(clipboardData.items).find((clipboardItem) => clipboardItem.type.startsWith("image/"));
  return item?.getAsFile() ?? null;
}
