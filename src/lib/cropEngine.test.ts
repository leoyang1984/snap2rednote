import { describe, expect, it } from "vitest";
import { getCenterCropRect, getOutputSize, getSliceRects, getTopCropRect, resizeCropRectFromHandle } from "./cropEngine";

describe("cropEngine", () => {
  it("calculates preset output sizes from 1080px width", () => {
    expect(getOutputSize(1, 1)).toEqual({ width: 1080, height: 1080 });
    expect(getOutputSize(3, 4)).toEqual({ width: 1080, height: 1440 });
    expect(getOutputSize(4, 5)).toEqual({ width: 1080, height: 1350 });
    expect(getOutputSize(9, 16)).toEqual({ width: 1080, height: 1920 });
  });

  it("returns centered crop rect with target ratio", () => {
    expect(getCenterCropRect(2000, 1000, 4 / 5)).toEqual({
      x: 600,
      y: 0,
      width: 800,
      height: 1000
    });
  });

  it("pins top crop to y zero", () => {
    expect(getTopCropRect(1000, 2000, 4 / 5)).toEqual({
      x: 0,
      y: 0,
      width: 1000,
      height: 1250
    });
  });

  it("slices long images and pulls the last slice upward", () => {
    expect(getSliceRects(1000, 2800, 4 / 5)).toEqual([
      { x: 0, y: 0, width: 1000, height: 1250 },
      { x: 0, y: 1250, width: 1000, height: 1250 },
      { x: 0, y: 1550, width: 1000, height: 1250 }
    ]);
  });

  it("resizes manual crop from a corner while preserving ratio", () => {
    expect(
      resizeCropRectFromHandle({
        rect: { x: 100, y: 100, width: 400, height: 500 },
        handle: "se",
        deltaX: 80,
        deltaY: 0,
        targetRatio: 4 / 5,
        imageWidth: 1000,
        imageHeight: 1000
      })
    ).toEqual({ x: 100, y: 100, width: 480, height: 600 });
  });

  it("keeps the opposite corner fixed when resizing northwest", () => {
    expect(
      resizeCropRectFromHandle({
        rect: { x: 100, y: 100, width: 400, height: 500 },
        handle: "nw",
        deltaX: -80,
        deltaY: 0,
        targetRatio: 4 / 5,
        imageWidth: 1000,
        imageHeight: 1000
      })
    ).toEqual({ x: 20, y: 0, width: 480, height: 600 });
  });
});
