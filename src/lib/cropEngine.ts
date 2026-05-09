import { DEFAULT_OUTPUT_WIDTH } from "./constants";
import type { CropRect } from "../types";

export type ResizeHandle = "nw" | "ne" | "sw" | "se";

export function getOutputSize(ratioWidth: number, ratioHeight: number) {
  const width = DEFAULT_OUTPUT_WIDTH;
  const height = Math.round((width * ratioHeight) / ratioWidth);
  return { width, height };
}

export function getCenterCropRect(imageWidth: number, imageHeight: number, targetRatio: number): CropRect {
  const imageRatio = imageWidth / imageHeight;

  if (imageRatio > targetRatio) {
    const cropHeight = imageHeight;
    const cropWidth = cropHeight * targetRatio;
    return {
      x: (imageWidth - cropWidth) / 2,
      y: 0,
      width: cropWidth,
      height: cropHeight
    };
  }

  const cropWidth = imageWidth;
  const cropHeight = cropWidth / targetRatio;
  return {
    x: 0,
    y: Math.max(0, (imageHeight - cropHeight) / 2),
    width: cropWidth,
    height: Math.min(cropHeight, imageHeight)
  };
}

export function getTopCropRect(imageWidth: number, imageHeight: number, targetRatio: number): CropRect {
  const centerRect = getCenterCropRect(imageWidth, imageHeight, targetRatio);
  const height = Math.min(centerRect.height, imageHeight);

  return {
    ...centerRect,
    y: 0,
    height
  };
}

export function clampCropRect(rect: CropRect, imageWidth: number, imageHeight: number): CropRect {
  const width = Math.min(rect.width, imageWidth);
  const height = Math.min(rect.height, imageHeight);
  return {
    x: Math.min(Math.max(0, rect.x), imageWidth - width),
    y: Math.min(Math.max(0, rect.y), imageHeight - height),
    width,
    height
  };
}

export function resizeCropRectFromHandle({
  rect,
  handle,
  deltaX,
  deltaY,
  targetRatio,
  imageWidth,
  imageHeight,
  minWidth = 80
}: {
  rect: CropRect;
  handle: ResizeHandle;
  deltaX: number;
  deltaY: number;
  targetRatio: number;
  imageWidth: number;
  imageHeight: number;
  minWidth?: number;
}): CropRect {
  const growsEast = handle.includes("e");
  const growsSouth = handle.includes("s");
  const anchorX = growsEast ? rect.x : rect.x + rect.width;
  const anchorY = growsSouth ? rect.y : rect.y + rect.height;
  const widthFromHorizontalDrag = growsEast ? rect.width + deltaX : rect.width - deltaX;
  const heightFromVerticalDrag = growsSouth ? rect.height + deltaY : rect.height - deltaY;
  const widthFromVerticalDrag = heightFromVerticalDrag * targetRatio;
  const horizontalChange = Math.abs(widthFromHorizontalDrag - rect.width);
  const verticalChange = Math.abs(widthFromVerticalDrag - rect.width);
  const desiredWidth = horizontalChange >= verticalChange ? widthFromHorizontalDrag : widthFromVerticalDrag;
  const maxWidthByX = growsEast ? imageWidth - anchorX : anchorX;
  const maxHeightByY = growsSouth ? imageHeight - anchorY : anchorY;
  const maxWidth = Math.max(1, Math.min(maxWidthByX, maxHeightByY * targetRatio));
  const nextWidth = Math.min(Math.max(minWidth, desiredWidth), maxWidth);
  const nextHeight = nextWidth / targetRatio;

  return {
    x: growsEast ? anchorX : anchorX - nextWidth,
    y: growsSouth ? anchorY : anchorY - nextHeight,
    width: nextWidth,
    height: nextHeight
  };
}

export function getSliceRects(imageWidth: number, imageHeight: number, targetRatio: number): CropRect[] {
  const sliceWidth = imageWidth;
  const sliceHeight = Math.round(sliceWidth / targetRatio);

  if (sliceHeight >= imageHeight) {
    return [{ x: 0, y: 0, width: imageWidth, height: imageHeight }];
  }

  const rects: CropRect[] = [];
  let y = 0;

  while (y + sliceHeight < imageHeight) {
    rects.push({
      x: 0,
      y,
      width: sliceWidth,
      height: sliceHeight
    });
    y += sliceHeight;
  }

  const lastY = Math.max(0, imageHeight - sliceHeight);
  const lastRect = {
    x: 0,
    y: lastY,
    width: sliceWidth,
    height: sliceHeight
  };

  const previous = rects[rects.length - 1];
  if (!previous || previous.y !== lastRect.y) {
    rects.push(lastRect);
  }

  return rects;
}
