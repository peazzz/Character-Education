/**
 * 品格小星球前端互動。
 * 負責：產生影片卡片、控制示範登入、以 YouTube 播放器記錄進度。
 * 正式上線後，請以後端 API 取代 localStorage 的 loadProfile/saveProfile。
 */

const STORAGE_KEY = 'characterPlanetProfile';
const COMPLETION_THRESHOLD = 0.9; // 播到完整影片的 90% 即計為完成。
const PROGRESS_SYNC_INTERVAL = 5000; // 播放中每 5 秒同步一次資料。
const players = new Map();
let profile = loadProfile();

/** 簡化 DOM 查詢。 */
function get(selector) { return document.querySelector(selector); }

/** 讀取瀏覽器中的示範帳戶；損壞資料不影響頁面。 */
function loadProfile() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch { return null; }
}

/** 寫入帳戶資料後，連同學習面板與影片提示一起更新。 */
function saveProfile(nextProfile) {
  profile = nextProfile;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  renderAccount();
  renderVideoStatuses();
}

/** 新帳戶必定由零進度與空白家庭成員清單開始。 */
function createProfile(name, email) { return { name, email, videoProgress: {}, familyMembers: [] }; }

/** 計算個人累積觀看秒數。 */
function totalWatchedSeconds() {
  return profile ? Object.values(profile.videoProgress).reduce((sum, item) => sum + item.watchedSeconds, 0) : 0;
}

/** 計算完成影片數和整體完成百分比。 */
function completionSummary() {
  const completed = profile ? Object.values(profile.videoProgress).filter((item) => item.completed).length : 0;
  return { completed, percent: Math.round((completed / VIDEO_CATALOG.length) * 100) };
}

/** 未登入只顯示登入引導；登入後才顯示數字面板。 */
function renderAccount() {
  const loggedIn = Boolean(profile);
  // hidden 是原生 HTML 屬性，能保證兩個登入狀態的區塊永遠不會一起顯示。
  get('#guest-panel').hidden = loggedIn;
  get('#learning-dashboard').hidden = !loggedIn;
  get('#profile-nav-link').hidden = !loggedIn;
  if (!loggedIn) return;

  const { completed, percent } = completionSummary();
  get('#account-title').textContent = `嗨，${profile.name}！`;
  get('#account-text').textContent = '今天也一起完成一個小小的品格任務。';
  get('#profile-name').textContent = profile.name;
  get('#minutes-value').textContent = Math.floor(totalWatchedSeconds() / 60);
  get('#videos-value').textContent = completed;
  get('#progress-percent').textContent = `${percent}%`;
  get('#progress-bar').style.width = `${percent}%`;
}

/** 從 video-catalog.js 自動產生公開影片卡片。 */
function renderVideoCards() {
  get('#video-grid').innerHTML = VIDEO_CATALOG.map((video) => `
    <article class="video-card" data-video-id="${video.id}">
      <div class="youtube-player" id="player-${video.id}" aria-label="${video.title} YouTube 影片"></div>
      <div class="video-card-content">
        <span class="video-topic">${video.emoji} ${video.topic}</span>
        <h3>${video.title}</h3><p>${video.description}</p>
        <p class="video-status" data-status-for="${video.id}">公開播放・登入後開始記錄</p>
      </div>
    </article>
  `).join('');
}

/** 顯示每支影片對目前使用者的觀看狀態。 */
function renderVideoStatuses() {
  VIDEO_CATALOG.forEach((video) => {
    const status = get(`[data-status-for="${video.id}"]`);
    if (!status) return;
    if (!profile) { status.textContent = '公開播放・登入後開始記錄'; return; }
    const progress = profile.videoProgress[video.id];
    status.textContent = progress?.completed ? '✓ 已完成這支影片' : `正在記錄・已觀看 ${Math.floor(progress?.watchedSeconds || 0)} 秒`;
  });
}

/** 示範版登入／註冊共用同一個不儲存密碼的表單。 */
function openAuthDialog() { get('#auth-dialog').showModal(); }

/** YouTube API 準備好時，為每一支影片建立可追蹤的播放器。 */
window.onYouTubeIframeAPIReady = function initialiseYouTubePlayers() {
  VIDEO_CATALOG.forEach((video) => {
    const player = new YT.Player(`player-${video.id}`, {
      videoId: video.youtubeId,
      playerVars: { rel: 0, modestbranding: 1, playsinline: 1 },
      events: { onStateChange: (event) => handlePlayerState(video.id, event) }
    });
    players.set(video.id, { player, timer: null, lastCurrentTime: 0 });
  });
};

/** 僅在播放時啟動五秒計時器；暫停或結束時停止並保存最後一次狀態。 */
function handlePlayerState(videoId, event) {
  const entry = players.get(videoId);
  if (!entry) return;
  if (event.data === YT.PlayerState.PLAYING) {
    // 每次重新播放都以當前位置為新的計時基準，避免把暫停時間算入。
    entry.lastCurrentTime = entry.player.getCurrentTime();
    if (!entry.timer) entry.timer = window.setInterval(() => recordProgress(videoId), PROGRESS_SYNC_INTERVAL);
  } else {
    window.clearInterval(entry.timer);
    entry.timer = null;
    recordProgress(videoId);
  }
}

/**
 * 依相鄰兩次播放器位置的差值累計實際秒數；播放器位置超過 90% 即完成。
 * 公開影片在未登入時仍可播放，但完全不保存任何觀看資料。
 */
function recordProgress(videoId) {
  if (!profile) return;
  const entry = players.get(videoId);
  if (!entry?.player?.getDuration) return;
  const duration = entry.player.getDuration();
  const currentTime = entry.player.getCurrentTime();
  if (!duration || !currentTime) return;

  // 拖曳進度列不應換取大量時數，因此每次最多計入一個同步區間加一秒。
  const maximumDelta = PROGRESS_SYNC_INTERVAL / 1000 + 1;
  const watchedDelta = Math.min(Math.max(0, currentTime - entry.lastCurrentTime), maximumDelta);
  entry.lastCurrentTime = currentTime;
  const current = profile.videoProgress[videoId] || { watchedSeconds: 0, completed: false };
  const nextProgress = {
    watchedSeconds: current.watchedSeconds + watchedDelta,
    completed: current.completed || currentTime / duration >= COMPLETION_THRESHOLD
  };
  saveProfile({ ...profile, videoProgress: { ...profile.videoProgress, [videoId]: nextProgress } });
}

/** 帳戶建立後從 0 開始，不預設任何觀看紀錄。 */
function handleAuthSubmit(event) {
  event.preventDefault();
  saveProfile(createProfile(get('#user-name').value.trim(), get('#email').value));
  get('#auth-dialog').close();
}

/** 頁面入口：先畫卡片，再啟動事件與 YouTube IFrame API。 */
function initialisePage() {
  renderVideoCards();
  renderAccount();
  renderVideoStatuses();
  get('#register-button').addEventListener('click', openAuthDialog);
  get('#login-button').addEventListener('click', openAuthDialog);
  get('#cancel-button').addEventListener('click', () => get('#auth-dialog').close());
  get('#auth-form').addEventListener('submit', handleAuthSubmit);
  get('#logout-button').addEventListener('click', () => {
    localStorage.removeItem(STORAGE_KEY);
    profile = null;
    renderAccount();
    renderVideoStatuses();
  });
  get('#continue-button').addEventListener('click', () => get('#lesson').scrollIntoView({ behavior: 'smooth' }));
  const youtubeApi = document.createElement('script');
  youtubeApi.src = 'https://www.youtube.com/iframe_api';
  document.head.appendChild(youtubeApi);
}

initialisePage();
