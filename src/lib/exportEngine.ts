import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import type { GeneratedImage } from "../types";

declare global {
  interface Window {
    __TAURI_INTERNALS__?: unknown;
    showSaveFilePicker?: (options?: {
      suggestedName?: string;
      types?: Array<{
        description: string;
        accept: Record<string, string[]>;
      }>;
    }) => Promise<FileSystemFileHandle>;
  }
}

interface ExportedPng {
  filename: string;
  dataBase64: string;
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
  const savedWithTauri = await trySaveGeneratedImagesWithTauri(images);
  if (savedWithTauri) {
    return;
  }

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

async function trySaveGeneratedImagesWithTauri(images: GeneratedImage[]) {
  if (!window.__TAURI_INTERNALS__) {
    return false;
  }

  let directory: string | null;
  try {
    const selected = await open({
      directory: true,
      multiple: false,
      title: "选择 Rednote 图片导出文件夹"
    });
    directory = typeof selected === "string" ? selected : null;
  } catch (error) {
    if (isTauriUnavailableError(error)) {
      return false;
    }

    throw error;
  }

  if (!directory) {
    throw new Error("用户取消保存目录选择。");
  }

  const files: ExportedPng[] = await Promise.all(
    images.map(async (image) => ({
      filename: getImageFilename(image.index),
      dataBase64: await canvasToPngBase64(image.canvas)
    }))
  );

  try {
    await invoke("save_png_files", { directory, files });
    return true;
  } catch (error) {
    if (isTauriUnavailableError(error)) {
      return false;
    }

    throw error;
  }
}

async function canvasToPngBase64(canvas: HTMLCanvasElement) {
  const blob = await canvasToBlob(canvas);
  return blobToBase64(blob);
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("导出失败，无法读取 PNG 数据。"));
        return;
      }

      resolve(reader.result.split(",")[1] ?? "");
    };
    reader.onerror = () => reject(new Error("导出失败，无法读取 PNG 数据。"));
    reader.readAsDataURL(blob);
  });
}

function isTauriUnavailableError(error: unknown) {
  const message = String(error instanceof Error ? error.message : error).toLowerCase();
  return message.includes("tauri") && (message.includes("not") || message.includes("undefined"));
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
