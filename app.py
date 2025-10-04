from flask import Flask, render_template, request, send_file
import os, shutil, tempfile,io, zipfile

app = Flask(__name__)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/rename")
def rename_page():
    return render_template("rename.html")

@app.route("/process", methods=["POST"])
def process():
    uploaded_files = request.files.getlist("folder")
    target_name = request.form.get("target_name")

    if not uploaded_files or not target_name:
        return "ファイルまたはターゲット名が不足", 400

    temp_dir = tempfile.mkdtemp()
    base_dir = os.path.join(temp_dir, "upload")
    os.makedirs(base_dir, exist_ok=True)

    # 置換対象ワード
    replace_targets = ["fb", "sn", "lap", "x","gdn","ydn"]

    # アップロードされたファイルを元の階層構造で保存
    for file in uploaded_files:
        if not file.filename or file.filename.endswith("/"):
            # ディレクトリ扱いのものはスキップ
            continue

        # アップロードされたファイルの相対パス
        parts = file.filename.split("/")

        filename = parts[-1]
        dirs = parts[:-1]

        if filename.startswith("."):
            continue

        # 各階層・ファイル名に置換処理
        new_dirs = []
        for part in dirs:
                # 🔹 隠しファイルを除外
            if part.startswith("."):
                continue
            replaced = part
            for t in replace_targets:
                replaced = part.replace(t, target_name)
            new_dirs.append(replaced)

        # ファイル名部分の置換
        new_filename = filename
        for t in replace_targets:
            new_filename = new_filename.replace(t, target_name)

        print("DEBUG original filename:", filename)
        print("DEBUG new filename:", new_filename)

        # 保存先パス（置換後）
        new_path = os.path.join(base_dir, *new_dirs, new_filename)

        os.makedirs(os.path.dirname(new_path), exist_ok=True)
        file.save(new_path)

    # zip化
    zip_path = os.path.join(temp_dir, f"renamed_{target_name}.zip")
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(base_dir):
            for file in files:
                abs_path = os.path.join(root, file)
                rel_path = os.path.relpath(abs_path, base_dir)  # 相対パスで格納
                zipf.write(abs_path, rel_path)

    return send_file(zip_path,
                    as_attachment=True,
                    download_name=f"renamed_{target_name}.zip")

if __name__ == "__main__":
    app.run(debug=True)
