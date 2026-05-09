import { Download, ImagePlus, Scissors, Wand2 } from "lucide-react";
import { useCallback, useEffect } from "react";
import { CropModeSelector } from "../components/CropModeSelector";
import { ExportPanel } from "../components/ExportPanel";
import { ImportPanel } from "../components/ImportPanel";
import { PreviewCanvas } from "../components/PreviewCanvas";
import { RatioSelector } from "../components/RatioSelector";
import { StylePanel } from "../components/StylePanel";
import { ThumbnailStrip } from "../components/ThumbnailStrip";
import { getCenterCropRect, getOutputSize, getSliceRects, getTopCropRect } from "../lib/cropEngine";
import { renderImage } from "../lib/renderEngine";
import { useAppStore } from "../lib/store";
import type { CropRect, GeneratedImage } from "../types";

export function App() {
  const importedImages = useAppStore((state) => state.importedImages);
  const importedImage = useAppStore((state) => state.importedImage);
  const ratio = useAppStore((state) => state.ratio);
  const cropMode = useAppStore((state) => state.cropMode);
  const style = useAppStore((state) => state.style);
  const manualCropRect = useAppStore((state) => state.manualCropRect);
  const setGeneratedImages = useAppStore((state) => state.setGeneratedImages);
  const setError = useAppStore((state) => state.setError);
  const error = useAppStore((state) => state.error);
  const notice = useAppStore((state) => state.notice);

  const generateImages = useCallback(async () => {
    if (!importedImages.length) {
      setGeneratedImages([]);
      return;
    }

    try {
      const targetRatio = ratio.width / ratio.height;
      const outputSize = getOutputSize(ratio.width, ratio.height);

      const generatedImages: GeneratedImage[] = [];
      for (let sourceIndex = 0; sourceIndex < importedImages.length; sourceIndex += 1) {
        const sourceImage = importedImages[sourceIndex];
        const sourceManualCropRect = sourceImage.id === importedImage?.id ? manualCropRect : null;
        const rects = getCropRects(
          sourceImage.width,
          sourceImage.height,
          targetRatio,
          cropMode,
          sourceManualCropRect
        );

        for (let sliceIndex = 0; sliceIndex < rects.length; sliceIndex += 1) {
          const canvas = await renderImage(sourceImage, rects[sliceIndex], outputSize, style);
          generatedImages.push({
            id: crypto.randomUUID(),
            index: generatedImages.length,
            sourceImageId: sourceImage.id,
            sourceIndex,
            sourceName: sourceImage.name,
            sliceIndex,
            canvas,
            width: canvas.width,
            height: canvas.height
          });
        }
      }

      setGeneratedImages(generatedImages);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Canvas 渲染失败。");
    }
  }, [cropMode, importedImage?.id, importedImages, manualCropRect, ratio, setError, setGeneratedImages, style]);

  useEffect(() => {
    void generateImages();
  }, [generateImages]);

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">
            <Scissors size={20} />
          </div>
          <div>
            <h1>Rednote Screenshot Cropper</h1>
            <p>截图转小红书竖版图</p>
          </div>
        </div>
        <div className="topbar-actions">
          <span>
            <ImagePlus size={16} />
            本地处理
          </span>
          <span>
            <Wand2 size={16} />
            1080px 高清输出
          </span>
          <span>
            <Download size={16} />
            PNG 导出
          </span>
        </div>
      </header>

      {error ? <div className="error-banner">{error}</div> : null}
      {!error && notice ? <div className="notice-banner">{notice}</div> : null}

      <section className="workspace">
        <aside className="sidebar left-panel">
          <ImportPanel />
          <RatioSelector />
          <CropModeSelector />
          <StylePanel />
        </aside>

        <section className="preview-panel">
          <PreviewCanvas />
        </section>

        <aside className="sidebar right-panel">
          <ThumbnailStrip />
          <ExportPanel />
        </aside>
      </section>
    </main>
  );
}

function getCropRects(
  imageWidth: number,
  imageHeight: number,
  targetRatio: number,
  cropMode: string,
  manualCropRect: CropRect | null
) {
  if (cropMode === "slice") {
    return getSliceRects(imageWidth, imageHeight, targetRatio);
  }

  if (cropMode === "top") {
    return [getTopCropRect(imageWidth, imageHeight, targetRatio)];
  }

  if (cropMode === "manual" && manualCropRect) {
    return [manualCropRect];
  }

  return [getCenterCropRect(imageWidth, imageHeight, targetRatio)];
}
