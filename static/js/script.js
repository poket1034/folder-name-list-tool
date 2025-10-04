const dropZone = document.getElementById("drop-zone");
const output = document.getElementById("output");
const searchBox = document.getElementById("search");
const copyAllBtn = document.getElementById("copyAll");
const copyFilteredBtn = document.getElementById("copyFiltered");
const clearBtn = document.getElementById("clearBtn"); // 追加

let allNames = []; // 元データ保持

// ドラッグ中のスタイル変更
dropZone.addEventListener("dragover", (event) => {
  event.preventDefault();
  dropZone.classList.add("dragover");
});
dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("dragover");
});
dropZone.addEventListener("drop", async (event) => {
  event.preventDefault();
  dropZone.classList.remove("dragover");
  output.textContent = "読み込み中...";
  const items = event.dataTransfer.items;
  const promises = [];
  for (const item of items) {
    const entry = item.webkitGetAsEntry?.();
    if (entry && entry.isDirectory) {
      promises.push(readTopLevelEntries(entry));
    }
  }
  await Promise.all(promises);
  renderList(allNames);
});

// フォルダ直下のファイル・フォルダだけ読む
async function readTopLevelEntries(directoryEntry) {
  const reader = directoryEntry.createReader();
  return new Promise((resolve) => {
    reader.readEntries((entries) => {
      for (const ent of entries) {
        if (ent.name.startsWith(".")) continue; // 隠しファイル除外
        const nameWithoutExt = removeExtension(ent.name);
        if (!allNames.includes(nameWithoutExt)) {
          allNames.push(nameWithoutExt); // 既にあるものは追加しない
        }
      }
      resolve();
    });
  });
}

// 拡張子を除いた名前
function removeExtension(filename) {
  return filename.replace(/\.[^/.]+$/, "");
}

// リスト描画（検索フィルタ対応）
function renderList(data) {
  const filtered = data.filter((name) =>
    name.toLowerCase().includes(searchBox.value.toLowerCase())
  );
  if (filtered.length === 0) {
    output.textContent = "ファイルやフォルダが見つかりませんでした。";
    return;
  }
  output.textContent = filtered.join("\n");
}

// 検索イベント
searchBox.addEventListener("input", () => {
  renderList(allNames);
});

// 全コピー
copyAllBtn.addEventListener("click", () => {
  if (allNames.length === 0) return alert("コピーする内容がありません");
  const text = allNames.sort().join("\n");
  navigator.clipboard.writeText(text).then(() => {
    alert("全項目をコピーしました！");
  });
});

// 検索結果コピー
copyFilteredBtn.addEventListener("click", () => {
  const filtered = allNames.filter((name) =>
    name.toLowerCase().includes(searchBox.value.toLowerCase())
  );
  if (filtered.length === 0) return alert("コピーする内容がありません");
  navigator.clipboard.writeText(filtered.join("\n")).then(() => {
    alert("検索結果をコピーしました！");
  });
});

// 削除ボタン
clearBtn.addEventListener("click", () => {
  allNames = [];
  output.textContent = "ここに結果が表示されます";
  searchBox.value = "";
});
