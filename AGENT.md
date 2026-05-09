# Rednote Screenshot Cropper 开发进展

## 当前状态

已经完成一个可运行的前端 MVP 和一个可打包的 macOS Tauri 本地应用。应用可以在浏览器中启动，也可以打包为 `.app` / `.dmg` 使用。

网页开发模式：

```bash
npm run dev
```

打开：

```txt
http://127.0.0.1:5173/
```

本地应用开发模式：

```bash
source "$HOME/.cargo/env"
npm run tauri dev
```

正式打包：

```bash
source "$HOME/.cargo/env"
npm run tauri build
```

当前应用产物：

```txt
src-tauri/target/release/bundle/macos/Rednote Screenshot Cropper.app
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
  - 点击选择多张图片
  - 拖拽多张图片
  - 剪贴板按钮读取
  - `Command+V` 粘贴图片兜底
  - 清空当前任务，重置导入图片、生成结果、手动选区和提示状态
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
- 增强手动裁剪：
  - 支持拖动选区位置
  - 支持四角拖拽缩放选区
  - 缩放时保持当前输出比例
  - 缩放时自动限制在原图边界内
- 实现基础美化：
  - 背景色
  - 留白
  - 圆角
  - 阴影
  - 标题及标题位置
- 实现导出：
  - 导出当前 PNG
  - 批量导出全部生成结果
  - 复制当前图到剪贴板
- 实现多图导入队列：
  - 一次选择或拖拽多张图片后统一生成结果
  - 右侧结果列表显示所有原图生成的 PNG
  - 批量导出会保存所有结果图
  - 导出文件名包含原图顺序、原图名称和切片序号，减少重名覆盖
- 增强桌面版原生导出：
  - Tauri 环境下导出当前 PNG 会打开系统保存对话框
  - Tauri 环境下批量导出会先打开系统目录选择框
  - 选择目录后通过 Rust command 一次性写入全部 PNG
  - 浏览器环境下继续使用原有浏览器保存 / 下载兜底
- 完成 macOS 应用打包：
  - 已生成 `.app`
  - 已生成 `.dmg`
  - 已安装替换到 `/Applications/Rednote Screenshot Cropper.app`
- 增加正式应用图标：
  - `src-tauri/icons/icon.svg`
  - `src-tauri/icons/icon.png`
  - `src-tauri/icons/icon.icns`
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
  - `resizeCropRectFromHandle`
- 添加 Tauri 目录和基础配置占位：
  - `src-tauri/tauri.conf.json`
  - `src-tauri/Cargo.toml`
  - `src-tauri/src/main.rs`
  - `src-tauri/src/lib.rs`
  - `src-tauri/build.rs`
- 增加 Tauri dialog 权限配置：
  - `src-tauri/capabilities/default.json`
- 增加 Rust 依赖锁文件：
  - `src-tauri/Cargo.lock`

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

### 浏览器导出弹窗

Chrome 对 `showSaveFilePicker()` 有用户激活限制。之前先 `await canvas.toBlob()` 再打开保存框，会导致 Chrome 不弹窗；Safari 可以正常工作。

当前实现：

- 单张导出时先同步请求保存文件句柄，再生成 PNG blob 并写入。
- 批量导出走普通下载链接，避免一次点击触发多个保存弹窗被 Chrome 拦截。
- 下载 URL 延迟释放，避免内嵌浏览器吞掉下载。

相关文件：

- `src/lib/exportEngine.ts`
- `src/components/ExportPanel.tsx`

### Tauri 原生导出

桌面版里浏览器下载 API 不可靠，因此当前实现为：

- 单张导出：调用 `@tauri-apps/plugin-dialog` 的 `save()` 打开系统保存对话框，再通过 Rust command `save_png_file` 写入 PNG。
- 批量导出：调用 `open({ directory: true })` 选择目录，再通过 Rust command `save_png_files` 写入全部 PNG。
- 浏览器端：如果 Tauri 调用不可用，会回退到浏览器 `showSaveFilePicker` 或下载链接。

相关文件：

- `src/lib/exportEngine.ts`
- `src-tauri/src/lib.rs`
- `src-tauri/capabilities/default.json`

### 多图导入和批量导出

最初导入入口只读取 `files[0]`，所以点击选择和拖拽都只能导入第一张图片。当前实现为：

- 文件选择框增加 `multiple`。
- 拖拽和点击选择都会读取完整 `FileList`。
- 状态中保存 `importedImages` 队列和当前预览原图。
- 生成结果时遍历所有导入图片。
- 手动裁剪框只应用于当前预览原图；其他图片在手动裁剪模式下会使用居中裁剪兜底。

相关文件：

- `src/components/ImportPanel.tsx`
- `src/lib/store.ts`
- `src/app/App.tsx`
- `src/lib/exportEngine.ts`

### 应用图标

最初 `tauri.conf.json` 的 `bundle.icon` 为空，打包出的 macOS 应用没有图标。当前已补齐：

- 源图：`src-tauri/icons/icon.svg`
- PNG：`src-tauri/icons/icon.png`、`32x32.png`、`128x128.png`、`128x128@2x.png`
- macOS 图标：`src-tauri/icons/icon.icns`
- 配置：`src-tauri/tauri.conf.json` 的 `bundle.icon`

## 验证结果

以下命令已通过：

```bash
npm run test
npm run build
```

测试结果：

- 1 个测试文件通过
- 6 个测试用例通过

构建结果：

- TypeScript 类型检查通过
- Vite production build 通过
- Tauri release build 通过并生成 `.app`
- 当前环境本轮 DMG 脚本在最后打包阶段失败，但 `.app` 已生成并可安装使用

浏览器验证：

- Vite 开发服务器可在 `http://127.0.0.1:5173/` 打开。
- 已用测试 PNG 验证剪贴板导入。
- 已验证手动裁剪模式显示四角缩放控件。
- 已验证导入后导出按钮解锁。
- 安装新依赖后，旧 `5173` 开发服务器可能保留 Vite 预构建缓存；已用 `5174 --force` 启动新服务器验证页面正常。

本地应用验证：

- Rust / Cargo 已安装并可用。
- `npm run tauri dev` 已跑通。
- `npm run tauri build` 已生成 release `.app`。
- `/Applications/Rednote Screenshot Cropper.app` 已安装替换并可启动。
- App bundle 中已验证 `CFBundleIconFile = icon.icns`。

## 当前限制

### 手动裁剪仍可继续打磨

当前手动裁剪已经支持拖动位置、按钮缩放和四角拖拽缩放。后续还可以增强：

- 选区尺寸显示
- 重置选区
- 键盘微调
- 更明显的选区边线和控制点 hover 状态

## 下次建议开发顺序

1. 实机再检查桌面版多图导入、单张导出、批量导出、复制当前图四个流程。
2. 优化导出成功提示，让桌面版和网页端提示文案区分开。
3. 排查当前环境中 DMG 最后打包脚本失败原因。
3. 优化手动裁剪细节：尺寸显示、重置选区、键盘微调。
4. 优化长图分段生成性能，避免大图同步渲染时 UI 卡顿。
5. 补更多验收测试和错误场景测试。

## 常用命令

```bash
npm install
npm run dev
npm run test
npm run build
npm run tauri dev
npm run tauri build
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
- Tauri Rust 入口：`src-tauri/src/lib.rs`
- 应用图标：`src-tauri/icons/icon.svg`

## 下次接手提醒

本地应用可能仍在运行。需要重新打包或替换 `/Applications` 时，先退出：

```bash
osascript -e 'quit app "Rednote Screenshot Cropper"'
```

如果网页开发端口被占用，可以停止旧 Vite 进程，或让 Vite 自动换端口。
