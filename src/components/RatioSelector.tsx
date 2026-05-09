import { RectangleVertical } from "lucide-react";
import { RATIO_PRESETS } from "../lib/constants";
import { useAppStore } from "../lib/store";

export function RatioSelector() {
  const ratio = useAppStore((state) => state.ratio);
  const setRatio = useAppStore((state) => state.setRatio);

  return (
    <section className="panel-section">
      <div className="section-title">
        <RectangleVertical size={16} />
        <h2>比例</h2>
      </div>
      <div className="segmented-grid">
        {RATIO_PRESETS.map((preset) => (
          <button
            className={ratio.preset === preset.preset ? "is-active" : ""}
            key={preset.preset}
            type="button"
            onClick={() => setRatio(preset)}
          >
            {preset.preset}
          </button>
        ))}
      </div>
      <div className="inline-inputs">
        <label>
          <span>宽</span>
          <input
            min="1"
            type="number"
            value={ratio.width}
            onChange={(event) =>
              setRatio({ preset: "custom", width: Number(event.target.value) || 1, height: ratio.height })
            }
          />
        </label>
        <label>
          <span>高</span>
          <input
            min="1"
            type="number"
            value={ratio.height}
            onChange={(event) =>
              setRatio({ preset: "custom", width: ratio.width, height: Number(event.target.value) || 1 })
            }
          />
        </label>
      </div>
    </section>
  );
}
