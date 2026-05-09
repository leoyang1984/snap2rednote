# Rednote Screenshot Cropper 开发进展

## 当前状态

已经完成一个可运行的前端 MVP。应用可以在浏览器中启动，完成从截图导入、裁剪/切图、美化到 PNG 导出的主流程。

本地开发地址：

```bash
npm run dev
```

打开：

```txt
http://127.0.0.1:5173/
```

## 已完成

- 初始化 `Vite + React + TypeScript` 项目。
- 创建基础三栏工具界面：
  - 左侧：导入、比例、裁剪模式、样式设置
  - 中间：生成图预览、手动裁剪原图区域
  - 右侧：结果缩略图、导出操作
- 实现图片导入：
  - 拖拽导入
  - 点击选择图片
  - 剪贴板按钮读取
  - `Command+V` 粘贴图片兜底
- 支持输出比例：
  - `1:1`
  - `3:4`
  - `4:5`
  - `9:16`
  - 自定义宽高比
- 实现裁剪模式：
  - 居中裁剪
  - 顶部优先裁剪
  - 手动裁剪
  - 自动分段切图
- 实现基础美化：
  - 背景色
  - 留白
  - 圆角
  - 阴影
  - 标题及标题位置
- 实现导出：
  - 导出当前 PNG
  - 批量导出
  - 复制当前图到剪贴板
- 增加状态提示：
  - 导入成功提示
  - 导出触发提示
  - 剪贴板权限兜底提示
  - 错误提示
- 补充核心算法测试：
  - `getOutputSize`
  - `getCenterCropRect`
  - `getTopCropRect`
  - `getSliceRects`
- 添加 Tauri 目录和基础配置占位：
  - `src-tauri/tauri.conf.json`
  - `src-tauri/Cargo.toml`
  - `src-tauri/src/main.rs`
  - `src-tauri/build.rs`

## 关键修复记录

### 剪贴板粘贴

最初只使用 `navigator.clipboard.read()`，在部分浏览器或权限状态下不可用。

当前实现：

- 按钮点击时仍尝试读取剪贴板。
- 如果浏览器拦截，提示用户复制图片后直接按 `Command+V`。
- 全局监听 `paste` 事件，从 `ClipboardEvent.clipboardData` 中读取图片文件。

相关文件：

- `src/lib/imageLoader.ts`
- `src/components/ImportPanel.tsx`

### Chrome 导出弹窗

Chrome 对 `showSaveFilePicker()` 有用户激活限制。之前先 `await canvas.toBlob()` 再打开保存框，会导致 Chrome 不弹窗；Safari 可以正常工作。

当前实现：

- 单张导出时先同步请求保存文件句柄，再生成 PNG blob 并写入。
- 批量导出走普通下载链接，避免一次点击触发多个保存弹窗被 Chrome 拦截。
- 下载 URL 延迟释放，避免内嵌浏览器吞掉下载。

相关文件：

- `src/lib/exportEngine.ts`
- `src/components/ExportPanel.tsx`

## 验证结果

以下命令已通过：

```bash
npm run test
npm run build
```

测试结果：

- 1 个测试文件通过
- 4 个测试用例通过

构建结果：

- TypeScript 类型检查通过
- Vite production build 通过

## 当前限制

### Tauri 尚未编译验证

当前机器没有 `rustc`：

```txt
zsh:1: command not found: rustc
```

因此 Tauri 桌面壳结构已经准备好，但还没有完成本地桌面应用编译验证。

### 批量导出体验仍偏浏览器

当前批量导出是浏览器下载多张 PNG。桌面版更理想的体验是：

- 选择一个导出文件夹
- 一次性保存全部 PNG
- 文件名按 `rednote-shot-01.png`、`rednote-shot-02.png` 递增

这更适合通过 Tauri 文件系统能力实现。

### 手动裁剪仍是基础版

当前手动裁剪支持：

- 初始化固定比例选区
- 拖动选区
- 按按钮缩放选区

后续可以增强：

- 边角拖拽缩放
- 选区尺寸显示
- 重置选区
- 键盘微调

## 下次建议开发顺序

1. 安装并验证 Rust/Tauri 工具链。
2. 跑通 `npm run tauri dev`。
3. 用 Tauri 实现桌面版文件保存能力。
4. 把批量导出改成选择文件夹后一键保存全部图片。
5. 增强手动裁剪交互。
6. 优化长图分段生成性能，避免大图同步渲染时 UI 卡顿。
7. 补更多验收测试和错误场景测试。

## 常用命令

```bash
npm install
npm run dev
npm run test
npm run build
```

Tauri 工具链安装后可尝试：

```bash
npm run tauri dev
```

## 重要文件索引

- 产品规格：`rednote-screenshot-cropper-codex-spec.md`
- 应用入口：`src/app/App.tsx`
- 样式：`src/styles/global.css`
- 状态管理：`src/lib/store.ts`
- 图片导入：`src/lib/imageLoader.ts`
- 裁剪算法：`src/lib/cropEngine.ts`
- Canvas 渲染：`src/lib/renderEngine.ts`
- 导出逻辑：`src/lib/exportEngine.ts`
- 核心测试：`src/lib/cropEngine.test.ts`
- Tauri 配置：`src-tauri/tauri.conf.json`

## 下次接手提醒

开发服务器可能仍在运行：

```txt
http://127.0.0.1:5173/
```

如果端口被占用，可以先停止旧进程，或让 Vite 自动换端口。
