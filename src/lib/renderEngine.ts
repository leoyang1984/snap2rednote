import { loadHtmlImage } from "./imageLoader";
import type { CanvasStyle, CropRect, ImportedImage } from "../types";

interface DrawTarget {
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
  shadow: boolean;
}

export async function renderImage(
  importedImage: ImportedImage,
  cropRect: CropRect,
  outputSize: { width: number; height: number },
  style: CanvasStyle
): Promise<HTMLCanvasElement> {
  const sourceImage = await loadHtmlImage(importedImage.src);
  const canvas = document.createElement("canvas");
  canvas.width = outputSize.width;
  canvas.height = outputSize.height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas 渲染失败。");
  }

  ctx.fillStyle = style.backgroundColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const hasTitle = Boolean(style.title.trim()) && style.titlePosition !== "none";
  const titleHeight = hasTitle ? style.titleFontSize * 2.1 : 0;
  const contentX = style.padding;
  const contentY = style.titlePosition === "top" ? style.padding + titleHeight : style.padding;
  const contentWidth = canvas.width - style.padding * 2;
  const contentHeight = canvas.height - style.padding * 2 - titleHeight;

  if (hasTitle && style.titlePosition === "top") {
    drawTitle(ctx, style, style.padding, style.padding + style.titleFontSize);
  }

  drawRoundedImage(ctx, sourceImage, cropRect, {
    x: contentX,
    y: contentY,
    width: contentWidth,
    height: contentHeight,
    radius: style.borderRadius,
    shadow: style.shadow
  });

  if (hasTitle && style.titlePosition === "bottom") {
    drawTitle(ctx, style, style.padding, canvas.height - style.padding - style.titleFontSize * 0.5);
  }

  return canvas;
}

function drawTitle(ctx: CanvasRenderingContext2D, style: CanvasStyle, x: number, y: number) {
  ctx.save();
  ctx.fillStyle = "#1f2328";
  ctx.font = `700 ${style.titleFontSize}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
  ctx.textBaseline = "alphabetic";
  ctx.fillText(style.title, x, y);
  ctx.restore();
}

function drawRoundedImage(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  cropRect: CropRect,
  target: DrawTarget
) {
  ctx.save();

  if (target.shadow) {
    ctx.shadowColor = "rgba(24, 28, 33, 0.18)";
    ctx.shadowBlur = 34;
    ctx.shadowOffsetY = 18;
  }

  roundedRect(ctx, target.x, target.y, target.width, target.height, target.radius);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.clip();
  ctx.shadowColor = "transparent";

  ctx.drawImage(
    image,
    cropRect.x,
    cropRect.y,
    cropRect.width,
    cropRect.height,
    target.x,
    target.y,
    target.width,
    target.height
  );

  ctx.restore();
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
