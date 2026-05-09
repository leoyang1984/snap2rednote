import type { CanvasStyle, OutputRatio } from "../types";

export const DEFAULT_OUTPUT_WIDTH = 1080;

export const RATIO_PRESETS: OutputRatio[] = [
  { preset: "1:1", width: 1, height: 1 },
  { preset: "3:4", width: 3, height: 4 },
  { preset: "4:5", width: 4, height: 5 },
  { preset: "9:16", width: 9, height: 16 }
];

export const DEFAULT_RATIO: OutputRatio = {
  preset: "4:5",
  width: 4,
  height: 5
};

export const DEFAULT_STYLE: CanvasStyle = {
  backgroundColor: "#f6f2ec",
  padding: 72,
  borderRadius: 32,
  shadow: true,
  title: "",
  titleFontSize: 48,
  titlePosition: "none"
};
