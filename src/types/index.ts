export type OutputRatioPreset = "1:1" | "3:4" | "4:5" | "9:16" | "custom";

export type CropMode = "center" | "top" | "manual" | "slice";

export interface OutputRatio {
  preset: OutputRatioPreset;
  width: number;
  height: number;
}

export interface CanvasStyle {
  backgroundColor: string;
  padding: number;
  borderRadius: number;
  shadow: boolean;
  title: string;
  titleFontSize: number;
  titlePosition: "top" | "bottom" | "none";
}

export interface ImportedImage {
  id: string;
  name: string;
  width: number;
  height: number;
  src: string;
}

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface GeneratedImage {
  id: string;
  index: number;
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
}
