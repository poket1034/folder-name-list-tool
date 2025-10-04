document.addEventListener("DOMContentLoaded", () => {
    const folderInput = document.getElementById("folderInput");
    const targetName = document.getElementById("targetName");
    const previewBody = document.querySelector("#previewList");
    const downloadBtn = document.getElementById("downloadBtn");
    const loadingMsg = document.getElementById("loadingMsg");
    const dropZone = document.getElementById("dropZone");
    let files = [];

    // フォルダ内を再帰的に読む
    function readEntries(entry, path = "") {
        return new Promise((resolve) => {
        if (entry.isFile) {
            entry.file((file) => {
            files.push({
                file: file,
                fullPath: path + file.name
            });
            resolve();
            });
        } else if (entry.isDirectory) {
            const reader = entry.createReader();
            reader.readEntries((entries) => {
            Promise.all(entries.map((e) => readEntries(e, path + entry.name + "/")))
                .then(resolve);
            });
        }
        });
    }
    
    // 📂 フォルダ選択ボタン経由
    folderInput.addEventListener("change", (event) => {
        files = Array.from(event.target.files).map(file => ({
        file,
        fullPath: file.webkitRelativePath || file.name
        }));
        console.log("✅ inputから取得:", files);
        updatePreview();
    });
    
    // 📂 ドラッグ中のスタイル
    dropZone.addEventListener("dragover", (event) => {
        event.preventDefault();
        dropZone.style.backgroundColor = "#eef";
    });
    
    dropZone.addEventListener("dragleave", () => {
        dropZone.style.backgroundColor = "";
    });
    
    // 📂 ドロップ処理
    dropZone.addEventListener("drop", (event) => {
        event.preventDefault();
        dropZone.style.backgroundColor = "";
    
        files = []; // 一旦リセット
    
        const items = event.dataTransfer.items;
        if (items) {
        const promises = [];
        for (let i = 0; i < items.length; i++) {
            const entry = items[i].webkitGetAsEntry();
            if (entry) {
            promises.push(readEntries(entry));
            }
        }
        Promise.all(promises).then(() => {
            console.log("✅ dropから取得:", files);
            updatePreview();
        });
        }
    });

    // プレビュー更新
    function updatePreview() {
        const list = document.querySelector("#previewList");
        list.innerHTML = ""; // 一旦リストを空にする

        if (!files.length) return;

        const replaceWord = targetName.value;

        files.forEach(({ fullPath }) => {
            // .DS_Storeや隠しファイルを除外
            if (fullPath.startsWith(".") || fullPath.includes("/.")) return;

            const replaced = fullPath.replace(/fb|sn|lap|x|gdn|ydn/gi, replaceWord);

            const li = document.createElement("li");
            li.innerHTML = `
                <div><strong>元の名前:</strong> ${fullPath}</div>
                <div><strong>置換後の名前:</strong> <span style="color:blue;">${replaced}</span></div>
            `;
            list.appendChild(li);
        });
    }

    // プルダウン変更時
    targetName.addEventListener("change", updatePreview);

    // ダウンロード
    downloadBtn.addEventListener("click", () => {
        if (!files.length) {
            alert("フォルダを選択してください");
            return;
        }
        loadingMsg.style.display = "block";
    
        const formData = new FormData();
        files.forEach(({ file, fullPath }) => {
            formData.append("folder", file, fullPath);
        });
        formData.append("target_name", targetName.value);
    
        // fetchせずに直接フォーム送信
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/process");
        xhr.responseType = "blob";
    
        xhr.onload = () => {
            loadingMsg.style.display = "none";
            const blob = xhr.response;
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `renamed_${targetName.value}.zip`;
            a.click();
            URL.revokeObjectURL(url);
        };
        xhr.send(formData);
    });
});
