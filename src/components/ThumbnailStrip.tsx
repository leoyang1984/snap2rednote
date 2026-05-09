import { Trash2 } from "lucide-react";
import { useMemo } from "react";
import { getImageFilename } from "../lib/exportEngine";
import { useAppStore } from "../lib/store";

export function ThumbnailStrip() {
  const generatedImages = useAppStore((state) => state.generatedImages);
  const selectedGeneratedImageId = useAppStore((state) => state.selectedGeneratedImageId);
  const selectGeneratedImage = useAppStore((state) => state.selectGeneratedImage);
  const removeGeneratedImage = useAppStore((state) => state.removeGeneratedImage);

  const thumbnails = useMemo(
    () =>
      generatedImages.map((image) => ({
        id: image.id,
        index: image.index,
        url: image.canvas.toDataURL("image/png")
      })),
    [generatedImages]
  );

  return (
    <section className="panel-section thumbnail-section">
      <div className="section-title">
        <h2>结果</h2>
        <span>{generatedImages.length}</span>
      </div>
      <div className="thumbnail-list">
        {thumbnails.length ? (
          thumbnails.map((thumbnail) => (
            <div
              className={`thumbnail-item ${thumbnail.id === selectedGeneratedImageId ? "is-active" : ""}`}
              key={thumbnail.id}
            >
              <button type="button" onClick={() => selectGeneratedImage(thumbnail.id)}>
                <img alt={getImageFilename(thumbnail.index)} src={thumbnail.url} />
                <span>{getImageFilename(thumbnail.index)}</span>
              </button>
              <button
                className="delete-thumb"
                title="删除切片"
                type="button"
                onClick={() => removeGeneratedImage(thumbnail.id)}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        ) : (
          <p className="muted">生成后的图片会显示在这里。</p>
        )}
      </div>
    </section>
  );
}
