/**
 * 公開影片目錄。新增影片時，複製一筆物件後修改 id、youtubeId 與文字即可。
 * id 必須唯一，因為它會用來保存該影片的個別觀看紀錄。
 * 這三支是暫用的 YouTube 示範內容；正式上線前請換成已取得授權的教學影片。
 */
window.VIDEO_CATALOG = [
  {
    id: 'gratitude-story',
    youtubeId: 'Jl3lfq47C-Y',
    title: '賣雞蛋的小女孩：感恩',
    description: '從小小的感謝出發，發現身邊人們付出的心意。',
    topic: '感恩',
    emoji: '☀️'
  },
  {
    id: 'gratitude-practice',
    youtubeId: 'aJaFUph3eBE',
    title: '時時感恩',
    description: '練習看見生活裡值得珍惜的人事物，說出真誠的謝謝。',
    topic: '同理心',
    emoji: '💛'
  },
  {
    id: 'replace-with-approved-video',
    youtubeId: 'M7lc1UVf-VE',
    title: '示範影片：我會負責任',
    description: '此為 YouTube 嵌入功能示範，請替換為正式的品格教育影片。',
    topic: '責任感',
    emoji: '🌱'
  }
];
