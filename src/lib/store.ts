import { create } from "zustand";
import { DEFAULT_RATIO, DEFAULT_STYLE } from "./constants";
import type { CanvasStyle, CropMode, CropRect, GeneratedImage, ImportedImage, OutputRatio } from "../types";

interface AppState {
  importedImages: ImportedImage[];
  importedImage: ImportedImage | null;
  selectedImportedImageId: string | null;
  ratio: OutputRatio;
  cropMode: CropMode;
  style: CanvasStyle;
  generatedImages: GeneratedImage[];
  selectedGeneratedImageId: string | null;
  manualCropRect: CropRect | null;
  error: string;
  notice: string;
  setImportedImage: (image: ImportedImage | null) => void;
  setImportedImages: (images: ImportedImage[]) => void;
  selectImportedImage: (id: string | null) => void;
  clearWorkspace: () => void;
  setRatio: (ratio: OutputRatio) => void;
  setCropMode: (mode: CropMode) => void;
  setStyle: (style: Partial<CanvasStyle>) => void;
  setGeneratedImages: (images: GeneratedImage[]) => void;
  selectGeneratedImage: (id: string | null) => void;
  setManualCropRect: (rect: CropRect | null) => void;
  removeGeneratedImage: (id: string) => void;
  setError: (message: string) => void;
  setNotice: (message: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  importedImages: [],
  importedImage: null,
  selectedImportedImageId: null,
  ratio: DEFAULT_RATIO,
  cropMode: "center",
  style: DEFAULT_STYLE,
  generatedImages: [],
  selectedGeneratedImageId: null,
  manualCropRect: null,
  error: "",
  notice: "",
  setImportedImage: (image) =>
    set({
      importedImages: image ? [image] : [],
      importedImage: image,
      selectedImportedImageId: image?.id ?? null,
      generatedImages: [],
      selectedGeneratedImageId: null,
      manualCropRect: null,
      error: "",
      notice: image ? "图片已导入，预览正在生成。" : ""
    }),
  setImportedImages: (images) =>
    set({
      importedImages: images,
      importedImage: images[0] ?? null,
      selectedImportedImageId: images[0]?.id ?? null,
      generatedImages: [],
      selectedGeneratedImageId: null,
      manualCropRect: null,
      error: "",
      notice: images.length > 1 ? `已导入 ${images.length} 张图片，预览正在生成。` : images.length ? "图片已导入，预览正在生成。" : ""
    }),
  selectImportedImage: (id) => {
    const image = get().importedImages.find((item) => item.id === id) ?? null;
    set({
      importedImage: image,
      selectedImportedImageId: image?.id ?? null,
      manualCropRect: null
    });
  },
  clearWorkspace: () =>
    set({
      importedImages: [],
      importedImage: null,
      selectedImportedImageId: null,
      generatedImages: [],
      selectedGeneratedImageId: null,
      manualCropRect: null,
      error: "",
      notice: "已清空，可以开始下一批图片。"
    }),
  setRatio: (ratio) => set({ ratio }),
  setCropMode: (cropMode) => set({ cropMode }),
  setStyle: (style) => set((state) => ({ style: { ...state.style, ...style } })),
  setGeneratedImages: (generatedImages) =>
    set((state) => ({
      generatedImages,
      selectedGeneratedImageId:
        generatedImages.find((image) => image.sourceImageId === state.selectedImportedImageId)?.id ??
        generatedImages[0]?.id ??
        null
    })),
  selectGeneratedImage: (selectedGeneratedImageId) => {
    const generatedImage = get().generatedImages.find((image) => image.id === selectedGeneratedImageId);
    const sourceImage =
      generatedImage && get().importedImages.find((image) => image.id === generatedImage.sourceImageId);

    set({
      selectedGeneratedImageId,
      importedImage: sourceImage ?? get().importedImage,
      selectedImportedImageId: sourceImage?.id ?? get().selectedImportedImageId,
      manualCropRect: sourceImage && sourceImage.id !== get().selectedImportedImageId ? null : get().manualCropRect
    });
  },
  setManualCropRect: (manualCropRect) => set({ manualCropRect }),
  removeGeneratedImage: (id) => {
    const images = get().generatedImages.filter((image) => image.id !== id);
    set({
      generatedImages: images,
      selectedGeneratedImageId: images[0]?.id ?? null
    });
  },
  setError: (error) => set({ error, notice: error ? "" : get().notice }),
  setNotice: (notice) => set({ notice, error: notice ? "" : get().error })
}));
