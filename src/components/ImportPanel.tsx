import { Clipboard, ImagePlus, Trash2, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getClipboardImageFile, getImageFileFromClipboardData, loadImageFile } from "../lib/imageLoader";
import { useAppStore } from "../lib/store";

export function ImportPanel() {
  const inputRef = useRef<HTMLInputElement>(null);
  const setImportedImage = useAppStore((state) => state.setImportedImage);
  const setImportedImages = useAppStore((state) => state.setImportedImages);
  const clearWorkspace = useAppStore((state) => state.clearWorkspace);
  const setError = useAppStore((state) => state.setError);
  const setNotice = useAppStore((state) => state.setNotice);
  const importedImage = useAppStore((state) => state.importedImage);
  const importedImages = useAppStore((state) => state.importedImages);
  const generatedImages = useAppStore((state) => state.generatedImages);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    function handlePaste(event: ClipboardEvent) {
      const file = getImageFileFromClipboardData(event.clipboardData);
      if (!file) return;

      event.preventDefault();
      void importFile(file);
    }

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  });

  async function importFile(file: File | undefined) {
    if (!file) return;

    try {
      const image = await loadImageFile(file);
      setImportedImage(image);
    } catch (error) {
      setError(error instanceof Error ? error.message : "无法读取这张图片，请换一张 PNG 或 JPG。");
    }
  }

  async function importFiles(files: FileList | File[] | null | undefined) {
    const imageFiles = Array.from(files ?? []);
    if (!imageFiles.length) return;

    try {
      const images = await Promise.all(imageFiles.map((file) => loadImageFile(file)));
      setImportedImages(images);
    } catch (error) {
      setError(error instanceof Error ? error.message : "无法读取这些图片，请换成 PNG、JPG 或 WEBP。");
    }
  }

  async function pasteImage() {
    try {
      const file = await getClipboardImageFile();
      await importFile(file);
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "当前浏览器不允许按钮读取剪贴板，请复制图片后直接按 Command+V。"
      );
    }
  }

  return (
    <section className="panel-section">
      <div className="section-title">
        <ImagePlus size={16} />
        <h2>导入</h2>
      </div>
      <button
        className={`drop-zone ${isDragging ? "is-dragging" : ""}`}
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragEnter={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          void importFiles(event.dataTransfer.files);
        }}
      >
        <Upload size={24} />
        <strong>
          {importedImages.length > 1
            ? `已选择 ${importedImages.length} 张图片`
            : importedImage
              ? importedImage.name
              : "拖入截图或点击选择"}
        </strong>
        <span>
          {importedImages.length > 1
            ? "批量生成后可一次导出全部 PNG"
            : importedImage
            ? `${importedImage.width} × ${importedImage.height}`
            : "支持 PNG / JPG / JPEG / WEBP"}
        </span>
      </button>
      <input
        ref={inputRef}
        hidden
        type="file"
        multiple
        accept="image/png,image/jpeg,image/jpg,image/webp"
        onChange={(event) => {
          void importFiles(event.target.files);
          event.currentTarget.value = "";
        }}
      />
      <button className="secondary-button" type="button" onClick={() => void pasteImage()}>
        <Clipboard size={16} />
        从剪贴板粘贴图片
      </button>
      <button
        className="secondary-button"
        disabled={!importedImages.length && !generatedImages.length}
        type="button"
        onClick={clearWorkspace}
      >
        <Trash2 size={16} />
        清空当前任务
      </button>
      <p className="helper-text">按钮被浏览器拦截时，复制图片后直接按 Command+V。</p>
    </section>
  );
}
