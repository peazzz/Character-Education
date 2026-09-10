# 品格小星球架構決策紀錄

## ADR-001：以原生靜態網站作為第一版

目前頁面提供三支公開影片，只有輕量的登入示範與進度呈現。採用 HTML、CSS、JavaScript 分檔，比加入 Vue 的建置流程更容易理解、修改與直接部署；待出現課程列表、教師後台、跨頁狀態或多人共同開發後，再導入 Vue 是合適的下一步。

影片資料集中於 `assets/video-catalog.js`。網站從這份清單自動產生公開影片卡，因此新增影片不必修改頁面結構或觀看紀錄程式。

## 資料模型（正式版）

- `User`：使用者 ID、顯示名稱、家長／教師關聯與帳號驗證資料。
- `Video`：影片 ID、標題、品格主題、影片網址與時長。
- `ViewingProgress`：使用者 ID、影片 ID、已觀看秒數、完成狀態、最後觀看時間。

目前 `assets/app.js` 僅把示範資料存於瀏覽器的 `localStorage`；這不是正式帳號系統，也不應保存密碼。新示範帳戶由零進度開始，僅在登入狀態中保存影片的觀看秒數與完成狀態。正式版需以驗證服務與資料庫（例如 Supabase 或 Firebase）取代。

## ADR-002：正式版採 Firebase

正式版使用 Firebase Authentication 的 Email／密碼登入，以及 Cloud Firestore 的帳戶持有人、家庭成員與觀看紀錄資料。設定與部署步驟見 `docs/firebase-setup.md`，存取範圍由 `firestore.rules` 限制為帳戶持有人自己的 UID。
