import { AlignVerticalSpaceAround, Crosshair, PanelTop, Rows3 } from "lucide-react";
import { useAppStore } from "../lib/store";
import type { CropMode } from "../types";

const MODES: Array<{ value: CropMode; label: string; icon: typeof Crosshair }> = [
  { value: "center", label: "居中", icon: AlignVerticalSpaceAround },
  { value: "top", label: "顶部", icon: PanelTop },
  { value: "manual", label: "手动", icon: Crosshair },
  { value: "slice", label: "切图", icon: Rows3 }
];

export function CropModeSelector() {
  const cropMode = useAppStore((state) => state.cropMode);
  const setCropMode = useAppStore((state) => state.setCropMode);

  return (
    <section className="panel-section">
      <div className="section-title">
        <Crosshair size={16} />
        <h2>裁剪</h2>
      </div>
      <div className="mode-list">
        {MODES.map((mode) => {
          const Icon = mode.icon;
          return (
            <button
              className={cropMode === mode.value ? "is-active" : ""}
              key={mode.value}
              type="button"
              onClick={() => setCropMode(mode.value)}
            >
              <Icon size={16} />
              {mode.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}
