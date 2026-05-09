import { ImageOff, Move, ZoomIn, ZoomOut } from "lucide-react";
import { PointerEvent, useEffect, useMemo, useRef, useState } from "react";
import { clampCropRect, getCenterCropRect } from "../lib/cropEngine";
import { useAppStore } from "../lib/store";
import type { CropRect } from "../types";

export function PreviewCanvas() {
  const previewRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.34);
  const [dragStart, setDragStart] = useState<{ x: number; y: number; rect: CropRect } | null>(null);
  const importedImage = useAppStore((state) => state.importedImage);
  const cropMode = useAppStore((state) => state.cropMode);
  const ratio = useAppStore((state) => state.ratio);
  const generatedImages = useAppStore((state) => state.generatedImages);
  const selectedGeneratedImageId = useAppStore((state) => state.selectedGeneratedImageId);
  const manualCropRect = useAppStore((state) => state.manualCropRect);
  const setManualCropRect = useAppStore((state) => state.setManualCropRect);
  const selectedImage = generatedImages.find((image) => image.id === selectedGeneratedImageId) ?? generatedImages[0];

  const previewUrl = useMemo(() => {
    if (!selectedImage) return "";
    return selectedImage.canvas.toDataURL("image/png");
  }, [selectedImage]);

  useEffect(() => {
    if (!importedImage || cropMode !== "manual") return;

    const targetRatio = ratio.width / ratio.height;
    setManualCropRect(getCenterCropRect(importedImage.width, importedImage.height, targetRatio));
  }, [cropMode, importedImage, ratio, setManualCropRect]);

  const manualOverlayStyle = useMemo(() => {
    if (!importedImage || !manualCropRect) return undefined;
    return {
      left: `${(manualCropRect.x / importedImage.width) * 100}%`,
      top: `${(manualCropRect.y / importedImage.height) * 100}%`,
      width: `${(manualCropRect.width / importedImage.width) * 100}%`,
      height: `${(manualCropRect.height / importedImage.height) * 100}%`
    };
  }, [importedImage, manualCropRect]);

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!manualCropRect || cropMode !== "manual") return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragStart({ x: event.clientX, y: event.clientY, rect: manualCropRect });
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!dragStart || !importedImage || !previewRef.current) return;

    const bounds = previewRef.current.getBoundingClientRect();
    const imageDx = ((event.clientX - dragStart.x) / bounds.width) * importedImage.width;
    const imageDy = ((event.clientY - dragStart.y) / bounds.height) * importedImage.height;
    setManualCropRect(
      clampCropRect(
        {
          ...dragStart.rect,
          x: dragStart.rect.x + imageDx,
          y: dragStart.rect.y + imageDy
        },
        importedImage.width,
        importedImage.height
      )
    );
  }

  function resizeManualCrop(multiplier: number) {
    if (!manualCropRect || !importedImage) return;

    const targetRatio = ratio.width / ratio.height;
    const nextWidth = Math.min(importedImage.width, Math.max(80, manualCropRect.width * multiplier));
    const nextHeight = Math.min(importedImage.height, nextWidth / targetRatio);
    setManualCropRect(
      clampCropRect(
        {
          x: manualCropRect.x + (manualCropRect.width - nextWidth) / 2,
          y: manualCropRect.y + (manualCropRect.height - nextHeight) / 2,
          width: nextWidth,
          height: nextHeight
        },
        importedImage.width,
        importedImage.height
      )
    );
  }

  return (
    <div className="preview-wrap">
      <div className="preview-toolbar">
        <div>
          <strong>{selectedImage ? `${selectedImage.width} × ${selectedImage.height}` : "等待导入图片"}</strong>
          <span>{cropMode === "slice" ? `${generatedImages.length} 张切片` : "当前预览"}</span>
        </div>
        <div className="icon-actions">
          {cropMode === "manual" ? (
            <>
              <button title="缩小选区" type="button" onClick={() => resizeManualCrop(0.9)}>
                <ZoomOut size={16} />
              </button>
              <button title="放大选区" type="button" onClick={() => resizeManualCrop(1.1)}>
                <ZoomIn size={16} />
              </button>
            </>
          ) : null}
        </div>
      </div>

      <div className="preview-stage">
        {previewUrl ? (
          <img
            alt="生成预览"
            className="generated-preview"
            src={previewUrl}
            style={{ width: `${(selectedImage?.width ?? 1080) * scale}px` }}
          />
        ) : (
          <div className="empty-preview">
            <ImageOff size={40} />
            <span>拖入截图后会在这里生成竖版预览</span>
          </div>
        )}

        {importedImage && cropMode === "manual" ? (
          <div className="manual-source">
            <div
              ref={previewRef}
              className="source-image-box"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={() => setDragStart(null)}
            >
              <img alt="原图手动裁剪" src={importedImage.src} />
              <div className="crop-overlay" style={manualOverlayStyle}>
                <Move size={18} />
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <label className="zoom-control">
        <span>预览缩放</span>
        <input
          max="0.62"
          min="0.18"
          step="0.02"
          type="range"
          value={scale}
          onChange={(event) => setScale(Number(event.target.value))}
        />
      </label>
    </div>
  );
}
