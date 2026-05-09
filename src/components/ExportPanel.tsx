import { ClipboardCopy, Download, Images } from "lucide-react";
import { copyCanvasToClipboard, downloadCanvas, downloadGeneratedImages, getImageFilename } from "../lib/exportEngine";
import { useAppStore } from "../lib/store";

export function ExportPanel() {
  const generatedImages = useAppStore((state) => state.generatedImages);
  const selectedGeneratedImageId = useAppStore((state) => state.selectedGeneratedImageId);
  const setError = useAppStore((state) => state.setError);
  const setNotice = useAppStore((state) => state.setNotice);
  const selectedImage = generatedImages.find((image) => image.id === selectedGeneratedImageId) ?? generatedImages[0];

  async function runExport(action: () => Promise<void>) {
    try {
      await action();
      setNotice("导出已触发。如果没有保存弹窗，请检查浏览器下载列表或下载文件夹。");
    } catch (error) {
      setError(error instanceof Error ? error.message : "导出失败，请检查保存路径。");
    }
  }

  return (
    <section className="panel-section">
      <div className="section-title">
        <Download size={16} />
        <h2>导出</h2>
      </div>
      <div className="export-actions">
        <button
          disabled={!selectedImage}
          type="button"
          onClick={() => selectedImage && void runExport(() => downloadCanvas(selectedImage.canvas, getImageFilename(selectedImage.index)))}
        >
          <Download size={16} />
          导出当前 PNG
        </button>
        <button
          disabled={!generatedImages.length}
          type="button"
          onClick={() => void runExport(() => downloadGeneratedImages(generatedImages))}
        >
          <Images size={16} />
          批量导出
        </button>
        <button
          disabled={!selectedImage}
          type="button"
          onClick={() => selectedImage && void runExport(() => copyCanvasToClipboard(selectedImage.canvas))}
        >
          <ClipboardCopy size={16} />
          复制当前图
        </button>
      </div>
    </section>
  );
}
