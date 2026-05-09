# Rednote Screenshot Cropper

本地截图裁剪工具，把 Mac 截图、网页长截图或窗口截图转换成适合 Rednote / 小红书发布的竖版图片。

## 使用

当前已经支持 macOS 本地应用。

已构建的应用产物：

```txt
src-tauri/target/release/bundle/macos/Rednote Screenshot Cropper.app
```

安装到系统应用目录：

```bash
ditto "src-tauri/target/release/bundle/macos/Rednote Screenshot Cropper.app" "/Applications/Rednote Screenshot Cropper.app"
```

也可以继续用网页开发模式：

```bash
npm install
npm run dev
```

打开：

```txt
http://127.0.0.1:5173/
```

## 开发

运行测试和前端构建：

```bash
npm run test
npm run build
```

运行 Tauri 本地应用开发模式：

```bash
source "$HOME/.cargo/env"
npm run tauri dev
```

生成 macOS `.app` 和 `.dmg`：

```bash
source "$HOME/.cargo/env"
npm run tauri build
```

## 当前 MVP

- 拖拽、点击选择、剪贴板粘贴图片
- 点击选择和拖拽支持一次导入多张图片
- 一键清空当前导入和生成结果，方便开始下一批任务
- `1:1`、`3:4`、`4:5`、`9:16` 和自定义比例
- 居中裁剪、顶部优先裁剪、手动选区、自动分段切图
- 背景色、留白、圆角、阴影、标题
- 网页端导出当前图、批量导出、复制当前预览图
- macOS 本地应用原生保存当前 PNG、批量选择目录导出
- 批量导出会导出所有已导入图片生成的结果；长截图分段模式下，每张原图可能生成多张 PNG
- macOS 应用图标和 DMG 打包

## 许可证

本项目采用自定义非商业专有许可证。版权和所有权归 Yang Lin 所有，允许个人、学习、评估等非商业用途；禁止未经授权的商业使用、转售、SaaS 化、再授权或商业集成。详见 [LICENSE](LICENSE)。
