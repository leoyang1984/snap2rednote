import type { GeneratedImage } from "../types";

declare global {
  interface Window {
    showSaveFilePicker?: (options?: {
      suggestedName?: string;
      types?: Array<{
        description: string;
        accept: Record<string, string[]>;
      }>;
    }) => Promise<FileSystemFileHandle>;
  }
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("导出失败，请检查保存路径。"));
      }
    }, "image/png");
  });
}

export async function downloadCanvas(canvas: HTMLCanvasElement, filename: string) {
  if (window.showSaveFilePicker) {
    const handle = await getSaveFileHandle(filename);
    const blob = await canvasToBlob(canvas);
    await writeBlobToHandle(handle, blob);
    return;
  }

  const blob = await canvasToBlob(canvas);
  downloadBlob(blob, filename);
}

export async function downloadGeneratedImages(images: GeneratedImage[]) {
  for (const image of images) {
    const blob = await canvasToBlob(image.canvas);
    downloadBlob(blob, getImageFilename(image.index));
  }
}

export async function copyCanvasToClipboard(canvas: HTMLCanvasElement) {
  const blob = await canvasToBlob(canvas);
  await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
}

export function getImageFilename(index: number) {
  return `rednote-shot-${String(index + 1).padStart(2, "0")}.png`;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

async function getSaveFileHandle(filename: string) {
  const handle = await window.showSaveFilePicker?.({
    suggestedName: filename,
    types: [
      {
        description: "PNG 图片",
        accept: {
          "image/png": [".png"]
        }
      }
    ]
  });

  if (!handle) {
    throw new Error("用户取消保存路径选择。");
  }

  return handle;
}

async function writeBlobToHandle(handle: FileSystemFileHandle, blob: Blob) {
  const writable = await handle.createWritable();
  await writable.write(blob);
  await writable.close();
}
