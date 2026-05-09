# Rednote Screenshot Cropper — Codex 开发规格说明

> 目标：开发一个本地 Mac 桌面工具，把 Mac 上的大截图、网页截图、窗口截图，快速裁剪/切分/排版成适合 Rednote / 小红书发布的手机竖版图片。

---

## 1. 项目名称

暂定名称：**Rednote Screenshot Cropper**

可选名称：

- RedCrop
- NoteShot
- Snap2Rednote
- Rednote Shot Studio

---

## 2. 一句话需求

用户可以把一张 Mac 大截图拖入工具，选择 Rednote 常用比例后，工具自动将截图裁剪或切分成多张适合手机阅读的竖版图片，并支持圆角、留白、背景、标题和批量导出。

---

## 3. 目标用户

主要用户：

- 经常在 Rednote / 小红书发布教程、笔记、产品介绍的人
- 使用 Mac 截图后，需要把横向或超长截图转成手机竖图的人
- 设计师、开发者、课程创作者、自媒体创作者

---

## 4. 核心使用场景

### 场景 1：普通大截图转竖图

用户截取一张 Mac 窗口截图，拖入工具，选择 `4:5`，工具自动生成一张竖版图。

### 场景 2：长截图自动分段

用户导入一张网页长截图，选择 `9:16` 或 `4:5`，工具自动把它切成多张连续图片，方便 Rednote 图文发布。

### 场景 3：截图美化排版

用户导入截图后，工具自动给截图加圆角、阴影、浅色背景和上下留白，使其更像 Rednote 风格的笔记图片。

---

## 5. MVP 范围

第一版只做以下功能：

1. 图片导入
   - 拖拽导入
   - 从剪贴板粘贴图片
   - 支持 PNG / JPG / JPEG / WEBP

2. 输出比例
   - 3:4
   - 4:5
   - 9:16
   - 1:1
   - 自定义宽高比

3. 裁剪模式
   - 居中裁剪
   - 顶部优先裁剪
   - 手动选区裁剪
   - 自动分段切图

4. 基础美化
   - 背景色
   - 圆角
   - 留白
   - 阴影
   - 可选标题文字

5. 导出
   - 导出 PNG
   - 批量导出多张图片
   - 复制当前预览图到剪贴板

---

## 6. 非 MVP 范围

以下功能第一版不做，但保留扩展空间：

- AI 自动识别重点区域
- OCR 识别文字密度
- 自动生成 Rednote 标题
- Rednote API 发布
- 云同步
- 模板市场
- 登录系统
- 订阅付费系统

---

## 7. 推荐技术栈

建议使用：

- **Tauri**：桌面应用壳
- **React**：前端界面
- **TypeScript**：类型安全
- **Vite**：前端构建
- **Rust / Tauri Command**：本地文件读写、导出、剪贴板能力
- **Canvas API**：图片裁剪、切分、排版渲染

原因：

- 比 Electron 轻
- 适合 Mac 桌面小工具
- 可以访问本地文件系统
- 前端开发效率高

---

## 8. 项目目录建议

```txt
rednote-screenshot-cropper/
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── components/
│   │   ├── ImportPanel.tsx
│   │   ├── RatioSelector.tsx
│   │   ├── CropModeSelector.tsx
│   │   ├── PreviewCanvas.tsx
│   │   ├── StylePanel.tsx
│   │   ├── ExportPanel.tsx
│   │   └── ThumbnailStrip.tsx
│   ├── lib/
│   │   ├── imageLoader.ts
│   │   ├── cropEngine.ts
│   │   ├── sliceEngine.ts
│   │   ├── renderEngine.ts
│   │   ├── exportEngine.ts
│   │   └── clipboard.ts
│   ├── types/
│   │   └── index.ts
│   └── styles/
│       └── global.css
├── src-tauri/
│   ├── src/
│   │   └── main.rs
│   └── tauri.conf.json
├── package.json
├── tsconfig.json
└── README.md
```

---

## 9. 数据模型

```ts
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
  title?: string;
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
  blob?: Blob;
  width: number;
  height: number;
}
```

---

## 10. 核心裁剪逻辑

### 10.1 输出画布尺寸

默认输出宽度建议为：

```ts
const DEFAULT_OUTPUT_WIDTH = 1080;
```

根据比例计算高度：

```ts
function getOutputSize(ratioWidth: number, ratioHeight: number) {
  const width = 1080;
  const height = Math.round((width * ratioHeight) / ratioWidth);
  return { width, height };
}
```

示例：

- 1:1 → 1080 × 1080
- 3:4 → 1080 × 1440
- 4:5 → 1080 × 1350
- 9:16 → 1080 × 1920

---

### 10.2 居中裁剪

目标：保持输出比例，从原图中间裁出最大可用区域。

算法：

```ts
function getCenterCropRect(imageWidth: number, imageHeight: number, targetRatio: number): CropRect {
  const imageRatio = imageWidth / imageHeight;

  if (imageRatio > targetRatio) {
    const cropHeight = imageHeight;
    const cropWidth = cropHeight * targetRatio;
    return {
      x: (imageWidth - cropWidth) / 2,
      y: 0,
      width: cropWidth,
      height: cropHeight,
    };
  }

  const cropWidth = imageWidth;
  const cropHeight = cropWidth / targetRatio;
  return {
    x: 0,
    y: (imageHeight - cropHeight) / 2,
    width: cropWidth,
    height: cropHeight,
  };
}
```

---

### 10.3 顶部优先裁剪

目标：适合网页、文章、代码截图，保留顶部内容。

```ts
function getTopCropRect(imageWidth: number, imageHeight: number, targetRatio: number): CropRect {
  const centerRect = getCenterCropRect(imageWidth, imageHeight, targetRatio);
  return {
    ...centerRect,
    y: 0,
  };
}
```

需要注意：

- 如果计算出的裁剪高度大于原图高度，需要 fallback 到居中裁剪逻辑
- y 不可小于 0
- y + height 不可超过 imageHeight

---

### 10.4 自动分段切图

目标：把一张长截图切成多张同样比例的竖图。

基本逻辑：

1. 先确定输出比例
2. 以原图宽度为基准，计算每一段的裁剪高度
3. 从顶部开始向下切
4. 最后一张如果不足一屏，可以：
   - 顶部对齐并补背景
   - 或向上回拉，保证最后一张内容填满

推荐第一版使用“向上回拉”：

```ts
function getSliceRects(imageWidth: number, imageHeight: number, targetRatio: number): CropRect[] {
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
      height: sliceHeight,
    });

    y += sliceHeight;
  }

  const lastY = Math.max(0, imageHeight - sliceHeight);
  const lastRect = {
    x: 0,
    y: lastY,
    width: sliceWidth,
    height: sliceHeight,
  };

  const previous = rects[rects.length - 1];
  if (!previous || previous.y !== lastRect.y) {
    rects.push(lastRect);
  }

  return rects;
}
```

后续可加入 `overlap` 参数，让相邻图片保留少量重叠内容，提升阅读连续性。

---

## 11. 渲染逻辑

渲染流程：

1. 创建输出 canvas
2. 填充背景色
3. 计算内容区域
4. 如果有标题，预留标题高度
5. 将裁剪后的截图绘制到内容区域
6. 应用圆角 clipping
7. 应用阴影
8. 导出为 PNG

伪代码：

```ts
async function renderImage(
  sourceImage: HTMLImageElement,
  cropRect: CropRect,
  outputSize: { width: number; height: number },
  style: CanvasStyle
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement("canvas");
  canvas.width = outputSize.width;
  canvas.height = outputSize.height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context is not available");

  ctx.fillStyle = style.backgroundColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const titleHeight = style.title && style.titlePosition !== "none" ? style.titleFontSize * 2.2 : 0;
  const contentX = style.padding;
  const contentY = style.titlePosition === "top" ? style.padding + titleHeight : style.padding;
  const contentWidth = canvas.width - style.padding * 2;
  const contentHeight = canvas.height - style.padding * 2 - titleHeight;

  if (style.title && style.titlePosition === "top") {
    ctx.fillStyle = "#111111";
    ctx.font = `600 ${style.titleFontSize}px system-ui, -apple-system, BlinkMacSystemFont`;
    ctx.fillText(style.title, style.padding, style.padding + style.titleFontSize);
  }

  drawRoundedImage(ctx, sourceImage, cropRect, {
    x: contentX,
    y: contentY,
    width: contentWidth,
    height: contentHeight,
    radius: style.borderRadius,
    shadow: style.shadow,
  });

  return canvas;
}
```

---

## 12. UI 设计

### 主界面布局

建议三栏布局：

```txt
┌──────────────────────────────────────────────┐
│ 顶部工具栏：项目名 / 导入 / 导出              │
├───────────────┬────────────────┬─────────────┤
│ 左侧设置栏     │ 中间预览区       │ 右侧结果栏  │
│ 比例选择       │ 大图实时预览     │ 缩略图列表  │
│ 裁剪模式       │ 手动裁剪框       │ 单张/批量导出│
│ 样式设置       │                │             │
└───────────────┴────────────────┴─────────────┘
```

### 关键组件

#### ImportPanel

职责：

- 拖拽上传
- 点击选择图片
- 粘贴剪贴板图片

#### RatioSelector

职责：

- 选择 1:1、3:4、4:5、9:16
- 自定义比例输入

#### CropModeSelector

职责：

- 选择 center / top / manual / slice

#### PreviewCanvas

职责：

- 展示当前预览
- 支持缩放
- 支持手动裁剪框
- 支持拖动裁剪区域

#### StylePanel

职责：

- 背景色
- 留白
- 圆角
- 阴影
- 标题

#### ExportPanel

职责：

- 导出当前图
- 导出全部图
- 复制到剪贴板

---

## 13. 默认参数

```ts
export const DEFAULT_RATIO: OutputRatio = {
  preset: "4:5",
  width: 4,
  height: 5,
};

export const DEFAULT_STYLE: CanvasStyle = {
  backgroundColor: "#F7F7F7",
  padding: 72,
  borderRadius: 32,
  shadow: true,
  title: "",
  titleFontSize: 48,
  titlePosition: "none",
};
```

---

## 14. 交互细节

### 导入

- 用户拖入图片后，立即显示预览
- 如果图片过大，前端预览可以降采样，但导出应尽量使用原图质量
- 如果导入失败，显示错误提示

### 分段切图

- 切图模式下，右侧显示所有生成图片缩略图
- 点击缩略图，中间显示该图大预览
- 用户可以删除某一张切片
- 用户可以重新生成

### 手动裁剪

- 显示一个固定比例裁剪框
- 用户可以拖动位置
- 用户可以缩放裁剪框
- 裁剪框不能超出图片边界

### 导出

- 单张导出：保存当前选中图片
- 批量导出：保存为多个 PNG
- 文件名格式：

```txt
rednote-shot-01.png
rednote-shot-02.png
rednote-shot-03.png
```

---

## 15. 错误处理

需要处理：

- 文件不是图片
- 图片读取失败
- 图片尺寸过小
- Canvas 渲染失败
- 剪贴板没有图片
- 导出失败
- 用户取消保存路径选择

错误提示尽量简单：

```txt
无法读取这张图片，请换一张 PNG 或 JPG。
剪贴板里没有可用图片。
导出失败，请检查保存路径。
```

---

## 16. 性能要求

- 20MB 以下图片应流畅处理
- 10000px 高度以内长截图应可正常切分
- 分段切图时避免一次性阻塞 UI
- 大图处理建议使用 `requestIdleCallback` 或分批渲染
- 预览图可以使用缩放版本
- 导出图使用高清 canvas

---

## 17. 验收标准

### 基础导入

- [ ] 可以拖拽导入 PNG
- [ ] 可以拖拽导入 JPG
- [ ] 可以从剪贴板粘贴图片
- [ ] 非图片文件会显示错误提示

### 比例选择

- [ ] 1:1 输出为 1080 × 1080
- [ ] 3:4 输出为 1080 × 1440
- [ ] 4:5 输出为 1080 × 1350
- [ ] 9:16 输出为 1080 × 1920

### 裁剪

- [ ] 居中裁剪结果比例正确
- [ ] 顶部裁剪优先保留顶部内容
- [ ] 分段切图可以生成多张图片
- [ ] 最后一张不会出现空白或越界

### 美化

- [ ] 可以设置背景色
- [ ] 可以设置圆角
- [ ] 可以设置留白
- [ ] 可以开启/关闭阴影
- [ ] 可以添加标题

### 导出

- [ ] 可以导出当前图片
- [ ] 可以批量导出所有图片
- [ ] 导出文件名按序号命名
- [ ] 可以复制当前图片到剪贴板

---

## 18. 开发阶段拆分

### Phase 1：项目初始化

任务：

- 初始化 Tauri + React + TypeScript 项目
- 配置 Vite
- 创建基础三栏布局
- 实现全局状态管理

输出：

- 应用可以启动
- 有基础 UI 框架

---

### Phase 2：图片导入与预览

任务：

- 实现拖拽上传
- 实现文件选择上传
- 实现剪贴板粘贴
- 显示原图预览
- 读取图片尺寸

输出：

- 用户可以导入图片并看到预览

---

### Phase 3：比例与裁剪引擎

任务：

- 实现比例选择
- 实现输出尺寸计算
- 实现居中裁剪
- 实现顶部裁剪
- 实现基础预览渲染

输出：

- 用户可以选择比例并看到裁剪后的结果

---

### Phase 4：自动分段切图

任务：

- 实现 `getSliceRects`
- 实现多张图片生成
- 实现缩略图列表
- 支持选择某张切片预览
- 支持删除某张切片

输出：

- 长截图可以自动切成多张手机竖图

---

### Phase 5：样式排版

任务：

- 背景色设置
- 留白设置
- 圆角设置
- 阴影设置
- 标题设置
- 实时预览

输出：

- 图片可以变成 Rednote 风格卡片

---

### Phase 6：导出

任务：

- 导出当前图片
- 批量导出图片
- 复制当前图片到剪贴板
- 文件名自动编号

输出：

- 用户可以拿到最终 PNG 图片

---

## 19. 推荐状态管理结构

可以使用 Zustand。

```ts
interface AppState {
  importedImage: ImportedImage | null;
  ratio: OutputRatio;
  cropMode: CropMode;
  style: CanvasStyle;
  generatedImages: GeneratedImage[];
  selectedGeneratedImageId: string | null;

  setImportedImage: (image: ImportedImage | null) => void;
  setRatio: (ratio: OutputRatio) => void;
  setCropMode: (mode: CropMode) => void;
  setStyle: (style: Partial<CanvasStyle>) => void;
  setGeneratedImages: (images: GeneratedImage[]) => void;
  selectGeneratedImage: (id: string) => void;
}
```

---

## 20. Codex 实施指令

请按以下顺序开发：

1. 创建 Tauri + React + TypeScript 项目。
2. 实现基础三栏 UI。
3. 实现图片导入能力。
4. 实现 Canvas 预览。
5. 实现比例选择。
6. 实现裁剪算法。
7. 实现分段切图算法。
8. 实现样式面板。
9. 实现导出 PNG。
10. 补充错误提示和基础测试。

每完成一个阶段，请确保：

- TypeScript 无类型错误
- 应用可以正常启动
- 核心路径有基本测试
- UI 不要过度复杂，优先保证流程可用

---

## 21. 测试建议

### 单元测试

重点测试：

- `getOutputSize`
- `getCenterCropRect`
- `getTopCropRect`
- `getSliceRects`

### 手动测试图片

准备以下图片：

1. 横向 Mac 窗口截图
2. 竖向网页长截图
3. 很宽的截图
4. 很高的截图
5. 小尺寸图片
6. 非图片文件

---

## 22. 未来扩展方向

- 模板系统
- 手机壳 mockup
- Rednote 封面生成
- OCR 自动识别标题
- 自动去除浏览器边框
- 自动识别内容区域
- 多图拼接
- 图片压缩
- 一键复制所有图片
- 历史项目记录

---

## 23. 产品原则

开发时优先遵守：

1. 操作路径短
2. 默认结果好看
3. 不强迫用户理解裁剪参数
4. 长截图处理要稳定
5. 导出图片要适合手机阅读
6. 所有处理尽量在本地完成
7. 不上传用户图片

---

## 24. 第一版完成定义

当用户可以完成以下流程时，MVP 即可认为完成：

1. 打开应用
2. 拖入一张 Mac 截图
3. 选择 `4:5`
4. 选择 `自动分段切图`
5. 设置圆角、背景和留白
6. 看到多张 Rednote 风格竖图
7. 一键批量导出 PNG

---

## 25. 给 Codex 的补充说明

这不是一个复杂图片编辑器，而是一个面向 Rednote 内容发布的截图转换工具。

请优先实现：

- 可用的导入
- 稳定的裁剪
- 好看的默认样式
- 顺畅的导出

不要一开始就做复杂 AI 功能或模板系统。第一版目标是让用户可以在 1 分钟内把 Mac 截图变成可发布的 Rednote 图片。
