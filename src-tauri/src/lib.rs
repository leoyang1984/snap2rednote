use std::{fs, path::PathBuf};

use base64::{engine::general_purpose::STANDARD, Engine};
use serde::Deserialize;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct ExportedPng {
    filename: String,
    data_base64: String,
}

#[tauri::command]
fn save_png_files(directory: String, files: Vec<ExportedPng>) -> Result<usize, String> {
    let export_dir = PathBuf::from(directory);
    if !export_dir.is_dir() {
        return Err("导出目录不存在。".to_string());
    }

    for file in &files {
        let filename = sanitize_png_filename(&file.filename)?;
        let bytes = STANDARD
            .decode(&file.data_base64)
            .map_err(|_| format!("{} 不是有效的 PNG 数据。", filename))?;
        let mut path = export_dir.clone();
        path.push(filename);
        fs::write(&path, bytes).map_err(|error| format!("保存 {} 失败：{}", path.display(), error))?;
    }

    Ok(files.len())
}

fn sanitize_png_filename(filename: &str) -> Result<String, String> {
    let basename = PathBuf::from(filename)
        .file_name()
        .and_then(|name| name.to_str())
        .map(str::to_string)
        .ok_or_else(|| "导出文件名无效。".to_string())?;

    if !basename.ends_with(".png") || basename.contains('/') || basename.contains('\\') {
        return Err(format!("导出文件名无效：{}", filename));
    }

    Ok(basename)
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![save_png_files])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
