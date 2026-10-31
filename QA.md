# V5 驗證紀錄

## 2026-10-31 學生離線 ZIP 匯出擴充

- 編輯器工具列及 TXT 工坊均新增 ZIP 匯出入口，匯出前執行流程與場景布局檢查。
- 使用者匯出的 ZIP 包含單一檔案的 `index.html`、Windows `執行遊戲.cmd`、`README.txt`，不需 Python、伺服器或網路服務。
- HTML 自帶 JavaScript／Three.js／CSS 和該次作品題庫，遊戲紀錄以作品 ID 分開保存在該瀏覽器的 localStorage。
- `node --test core.test.mjs flow.test.mjs text.test.mjs studio.test.mjs door.test.mjs offline-boot.test.mjs offline-template.test.mjs export-game.test.mjs`：**56 項通過**；`python3 -m unittest -v test_server_launch.py`：**1 項通過**。
- 校驗離線 HTML 模板無外部 stylesheet/script 引用、模組排序、中文 CMD 壓縮檔名、匯出資料 Base64 封裝、惡意 `</script>` 字串不會直接插入 HTML 原始碼。
- **驗收限制：** 本次未在真實 Windows Chrome/Edge 上雙擊學生 ZIP 做圖形操作；實際鍵盤 E、3D 渲染及本地 `file://` 啟動仍需在 Windows 目視確認。正式上傳 GitHub 前必須確認目標儲存庫。

## 2026-10-31 門與通行條件擴充

- 新增 `door.test.mjs` 驗證：舊作品預設自由通行、任務門鎖、道具門鎖、挑戰失敗不發道具、無效/同場域前置條件、刪除前置條件清理、舊回合無道具欄位、全顯示與固定視野、五種模板入口位置、沒有來源的道具警告。
- 測試指令：`node --test core.test.mjs flow.test.mjs text.test.mjs studio.test.mjs door.test.mjs`；新增 12 項門控測試，與原 39 項合計 51 項。
- 語法檢查：`node --check author.js`、`node --check studio.js`、`node --check world.js`。
- **限制**：本次工作環境無可用的本機圖形瀏覽器，且獨立瀏覽器無法連到此容器的 3034 埠。因此立體門的畫面和滑鼠／按鍵實測仍需在 Windows 上啟動後驗收；原檔附帶的 `verified-*.jpg` 是先前 V5 驗收圖，不能視為此次新門截圖。

## 2026-10-31 獨立 3035 啟動修正

- 已在使用者 Chrome 觀察到 `http://127.0.0.1:3034/` 仍載入舊版程式（沒有 `🚪 門與解鎖` 按鈕）。
- `START-V5-DOORS.cmd` 現使用獨立 `3035` 埠，避免舊伺服器占用 3034。`server.py --port 3035` 支援自訂埠，文件匯入來源限制隨實際埠更新。
- `python3 -m unittest -v test_server_launch.py`：1 項啟動整合測試通過，驗證原埠被占用時獨立埠仍可提供新版檔案。
- 舊版與新版埠的 LocalStorage 隔離，跨版作品需手動匯出再匯入 JSON。Windows 上啟動新版仍需使用者目視驗收。

日期：2026-10-30（Asia/Taipei）。V4 原始資料與服務保留。

## 自動測試

`node --test core.test.mjs flow.test.mjs text.test.mjs studio.test.mjs`：**39 項通過**，完整結果見 QA-tests.txt。

沿用題庫／計分／提示／歷程／TXT 測試；新增舊作品遷移、多個場域、視野三模式、排列與實際串接分離、同作品延伸素材保存、刪除解鎖引用、場域自鎖與循環、實際編輯存檔與單間範例。

## 實際瀏覽器操作

內嵌 Chromium，桌面 1440×1000 與原側欄窄視窗。未做真實手機或 Safari 驗收。

- 新頁面無 JS 錯誤。原窄視窗預設收合，TXT 與編輯功能仍可開啟。
- 初始世界畫布 bottom=752、流程視窗 top=766，兩者留有間隙。收合流程後畫布擴大。
- 拖曳左側面板後寬度由 205 變 263，畫布左緣同步移動。
- 拖右面板內側把手後寬度由 310 變 388；拖流程上緣後高度由 220 變 288，畫布 bottom=684、流程 top=698，仍不重疊。
- 流程縮放按鈕 100%→90%；節點 N1 實際拖至 X=96.74、Y=68.06。排序模式將新增知識站排在終點前；按依順序串接後，七節點檢查通過。
- 匯入完整 TXT 後，素材按鈕仍可用。TXT 生成的圖書館使用獨立圖書館模板。
- 新增「護理技能教室 B」，出現獨立床位與點滴架模型；在該場域點地新增知識站、改名並保存，素材為 skills 場域獨立內容。
- 逐步模式起初只顯示校園，其餘三個場域為「未探索」。完成 NPC 與第一關兩題（100 分）後，教學大樓揭露並可進入；圖書館與技能室仍未探索。
- 全部顯示模式列出四個場域並實際切換圖書館。
- 固定模式只有指定技能教室；嘗試返回校園得到「目前設定僅顯示此場域」，未離開房間。
- examples/08-fixed-room.json 實際匯入、開始試玩、完成知識說明，再前往單間挑戰。此範例的前置條件均在同一間內。
- 實際拖移迷你地圖至 (340,225)，縮放至 243×300，另存新編輯作品成功下載。
- 下載的真實 JSON 經程式驗證含 4 場域、7 素材、額外知識站與 workspaceLayout。原檔保留 verification/actual-editor-save.json。
- 按還原版面測得 rightWidth=310、flowHeight=220、miniWidth=205；重新匯入前述實際存檔後，rightWidth=388、flowHeight=288、mini=(340,225,243,300) 全部還原。

## 審查修正

獨立唯讀審查回報五項，均修正：刪除場域解鎖引用、場域解鎖自鎖／循環、匯入布局還原、迷你地圖座標尺寸保存、場域下拉選單不再每 250ms 重建。

另修正缺少布局尺寸時清除舊 inline style、收合迷你地圖高度、試玩隱藏面板不以 0 尺寸覆寫存檔；加入左右內側把手與流程上緣把手以免只能向螢幕外拖曳。

## 界線

逐步揭露為任務解鎖場域，不是步行逐格霧效。幾何為模板示意，不是現況精準建模。

本次沒有發布 GitHub、沒有雲端／AI API、沒有正式學生成效驗證。可發佈為靜態網站；前端模組及素材皆用相對路徑，V4 的瀏覽器題庫與 PDF/Word 擷取功能沿用。
