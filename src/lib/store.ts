import { create } from "zustand";
import { DEFAULT_RATIO, DEFAULT_STYLE } from "./constants";
import type { CanvasStyle, CropMode, CropRect, GeneratedImage, ImportedImage, OutputRatio } from "../types";

interface AppState {
  importedImage: ImportedImage | null;
  ratio: OutputRatio;
  cropMode: CropMode;
  style: CanvasStyle;
  generatedImages: GeneratedImage[];
  selectedGeneratedImageId: string | null;
  manualCropRect: CropRect | null;
  error: string;
  notice: string;
  setImportedImage: (image: ImportedImage | null) => void;
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
  importedImage: null,
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
      importedImage: image,
      generatedImages: [],
      selectedGeneratedImageId: null,
      manualCropRect: null,
      error: "",
      notice: image ? "图片已导入，预览正在生成。" : ""
    }),
  setRatio: (ratio) => set({ ratio }),
  setCropMode: (cropMode) => set({ cropMode }),
  setStyle: (style) => set((state) => ({ style: { ...state.style, ...style } })),
  setGeneratedImages: (generatedImages) =>
    set({
      generatedImages,
      selectedGeneratedImageId: generatedImages[0]?.id ?? null
    }),
  selectGeneratedImage: (selectedGeneratedImageId) => set({ selectedGeneratedImageId }),
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
