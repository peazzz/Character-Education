/**
 * 個人資料頁的暫存資料管理。
 * 帳戶持有人擁有學習摘要；家庭成員僅記錄名稱與關係。
 * 串接 Firebase 後，請以 Firestore 讀寫取代 localStorage。
 */
const STORAGE_KEY = 'characterPlanetProfile';
let profile = loadProfile();

function get(selector) { return document.querySelector(selector); }

function loadProfile() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch { return null; }
}

function saveProfile(nextProfile) {
  profile = nextProfile;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

/** 將使用者輸入轉成純文字，避免被插入成 HTML。 */
function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
}

function learningSummary() {
  const progressItems = Object.values(profile.videoProgress || {});
  return {
    completedVideos: progressItems.filter((item) => item.completed).length,
    watchedMinutes: Math.floor(progressItems.reduce((total, item) => total + item.watchedSeconds, 0) / 60)
  };
}

function renderMembers() {
  const members = profile.familyMembers || [];
  get('#member-count').textContent = members.length;
  get('#member-list').innerHTML = members.length ? members.map((member, index) => `
    <li class="member-item"><span class="member-avatar">👤</span><div><strong>${escapeHtml(member.name)}</strong><small>${escapeHtml(member.relation)}</small></div><button class="remove-member" data-member-index="${index}" aria-label="移除 ${escapeHtml(member.name)}">移除</button></li>
  `).join('') : '<li class="empty-members"><span aria-hidden="true">🏠</span><strong>還沒有家庭成員</strong><small>點選右上方按鈕，新增一位家人吧！</small></li>';
}

/** 將帳戶持有人資料、學習摘要與家庭清單同步到畫面。 */
function renderPage() {
  const loggedIn = Boolean(profile);
  get('#profile-guest').hidden = loggedIn;
  get('#profile-content').hidden = !loggedIn;
  if (!loggedIn) return;

  // 舊版示範帳戶沒有家庭清單時，補上空陣列保持相容。
  profile.familyMembers ||= [];
  const { completedVideos, watchedMinutes } = learningSummary();
  get('[data-owner-name]').textContent = profile.name;
  get('#overview-email').textContent = profile.email;
  get('#profile-name').value = profile.name;
  get('#profile-email').value = profile.email;
  get('#videos-value').textContent = completedVideos;
  get('#minutes-value').textContent = watchedMinutes;
  renderMembers();
}

function saveOwner(event) {
  event.preventDefault();
  saveProfile({ ...profile, name: get('#profile-name').value.trim() });
  renderPage();
  get('#profile-notice').textContent = '已儲存帳戶資料。';
}

function setMemberFormVisibility(visible) {
  get('#member-form').hidden = !visible;
  get('#show-member-form').hidden = visible;
  if (visible) get('#member-name').focus();
}

function addMember(event) {
  event.preventDefault();
  const member = { name: get('#member-name').value.trim(), relation: get('#member-relation').value.trim() };
  saveProfile({ ...profile, familyMembers: [...profile.familyMembers, member] });
  event.target.reset();
  setMemberFormVisibility(false);
  renderPage();
}

function removeMember(event) {
  const button = event.target.closest('[data-member-index]');
  if (!button) return;
  const index = Number(button.dataset.memberIndex);
  saveProfile({ ...profile, familyMembers: profile.familyMembers.filter((_, memberIndex) => memberIndex !== index) });
  renderPage();
}

function initialisePage() {
  renderPage();
  get('#profile-form')?.addEventListener('submit', saveOwner);
  get('#member-form')?.addEventListener('submit', addMember);
  get('#show-member-form')?.addEventListener('click', () => setMemberFormVisibility(true));
  get('#cancel-member-form')?.addEventListener('click', () => setMemberFormVisibility(false));
  get('#member-list')?.addEventListener('click', removeMember);
  get('#logout-button')?.addEventListener('click', () => { localStorage.removeItem(STORAGE_KEY); profile = null; renderPage(); });
}

initialisePage();
