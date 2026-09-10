# Firebase 串接準備

## 服務分工

- Firebase Authentication：Email／密碼註冊、登入、登出與密碼重設。
- Cloud Firestore：帳戶持有人、家庭成員與觀看紀錄。

## Firestore 資料形狀

每個帳戶持有人建立一筆 `users/{uid}` 文件：

```text
users/{uid}
  name: "樂樂"
  email: "name@example.com"
  familyMembers: [{ name: "小安", relation: "孩子" }]
  videoProgress: { gratitude-story: { watchedSeconds: 120, completed: false } }
```

## 啟用步驟

1. 在 Firebase Console 建立 Web app。
2. 在 Authentication 啟用 Email／密碼登入。
3. 建立 Cloud Firestore 資料庫。
4. 部署本專案的 `firestore.rules`。
5. 複製 `assets/firebase-config.example.js` 為 `assets/firebase-config.js`，再填入 Console 提供的設定。

在提供 `firebaseConfig` 前，網站維持目前的瀏覽器示範資料模式，不會保存密碼或連線至 Firebase。
