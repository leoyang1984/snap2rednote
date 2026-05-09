import { CaseSensitive, Palette, SlidersHorizontal } from "lucide-react";
import { useAppStore } from "../lib/store";

export function StylePanel() {
  const style = useAppStore((state) => state.style);
  const setStyle = useAppStore((state) => state.setStyle);

  return (
    <section className="panel-section">
      <div className="section-title">
        <Palette size={16} />
        <h2>样式</h2>
      </div>
      <label className="field-row color-field">
        <span>背景</span>
        <input
          type="color"
          value={style.backgroundColor}
          onChange={(event) => setStyle({ backgroundColor: event.target.value })}
        />
      </label>
      <RangeField label="留白" max={160} min={0} value={style.padding} onChange={(padding) => setStyle({ padding })} />
      <RangeField
        label="圆角"
        max={72}
        min={0}
        value={style.borderRadius}
        onChange={(borderRadius) => setStyle({ borderRadius })}
      />
      <label className="field-row checkbox-row">
        <span>阴影</span>
        <input type="checkbox" checked={style.shadow} onChange={(event) => setStyle({ shadow: event.target.checked })} />
      </label>
      <label className="field-stack">
        <span>
          <CaseSensitive size={15} />
          标题
        </span>
        <input
          type="text"
          value={style.title}
          placeholder="可选标题"
          onChange={(event) => setStyle({ title: event.target.value })}
        />
      </label>
      <div className="segmented-grid three">
        {(["none", "top", "bottom"] as const).map((position) => (
          <button
            className={style.titlePosition === position ? "is-active" : ""}
            key={position}
            type="button"
            onClick={() => setStyle({ titlePosition: position })}
          >
            {position === "none" ? "无" : position === "top" ? "顶部" : "底部"}
          </button>
        ))}
      </div>
      <RangeField
        label="字号"
        max={80}
        min={24}
        value={style.titleFontSize}
        onChange={(titleFontSize) => setStyle({ titleFontSize })}
      />
    </section>
  );
}

function RangeField({
  label,
  min,
  max,
  value,
  onChange
}: {
  label: string;
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="field-stack">
      <span>
        <SlidersHorizontal size={15} />
        {label}
        <b>{value}</b>
      </span>
      <input min={min} max={max} type="range" value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}
