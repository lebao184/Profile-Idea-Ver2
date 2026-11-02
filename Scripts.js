const weekdayElement = document.getElementById('weekday');
const dateElement = document.getElementById('dateLine');
const timeElement = document.getElementById('timeLine');
const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const timezone = 'Asia/Ho_Chi_Minh';
function getVietnamNow() {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const part = (type) => Number(parts.find((item) => item.type === type).value);
  return { year: part('year'), month: part('month') - 1, day: part('day'), date: new Date() };
}
const vietnamToday = getVietnamNow();
let viewedMonth = new Date(vietnamToday.year, vietnamToday.month, 1);

function updateClock() {
  const now = getVietnamNow();
  const weekday = new Intl.DateTimeFormat('en-US', { timeZone: timezone, weekday: 'long' }).format(now.date).toUpperCase();
  const date = new Intl.DateTimeFormat('en-GB', { timeZone: timezone, day: '2-digit', month: 'long', year: 'numeric' }).format(now.date).toUpperCase();
  const time = new Intl.DateTimeFormat('en-GB', { timeZone: timezone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(now.date);
  weekdayElement.textContent = weekday;
  dateElement.textContent = date.replace(/ (\d{4})$/, ', $1');
  timeElement.textContent = `- ${time} -`;
  if (viewedMonth.getFullYear() === now.year && viewedMonth.getMonth() === now.month) drawCalendar(viewedMonth, now);
}

function drawCalendar(month, today = getVietnamNow()) {
  const year = month.getFullYear();
  const index = month.getMonth();
  document.getElementById('monthName').textContent = monthNames[index];
  const firstWeekday = (new Date(year, index, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, index + 1, 0).getDate();
  const isCurrentMonth = year === today.year && index === today.month;
  const cells = [];
  const weekCount = Math.ceil((firstWeekday + daysInMonth) / 7);
  for (let position = 0; position < weekCount * 7; position += 1) {
    const day = position - firstWeekday + 1;
    if (day < 1 || day > daysInMonth) {
      cells.push('<span class="day-empty" aria-hidden="true"></span>');
      continue;
    }
    const todayClass = isCurrentMonth && day === today.day ? ' today' : '';
    cells.push(`<span class="day${todayClass}">${day}</span>`);
  }
  document.getElementById('calendarDays').innerHTML = cells.join('');
}

document.getElementById('prevMonth').addEventListener('click', () => { viewedMonth.setMonth(viewedMonth.getMonth() - 1); drawCalendar(viewedMonth); });
document.getElementById('nextMonth').addEventListener('click', () => { viewedMonth.setMonth(viewedMonth.getMonth() + 1); drawCalendar(viewedMonth); });
updateClock();
drawCalendar(viewedMonth);
setInterval(updateClock, 15000);

const settingsPanel = document.getElementById('settingsPanel');
function togglePanel(panel, open) {
  panel.classList.toggle('open', open);
  panel.setAttribute('aria-hidden', String(!open));
}
document.getElementById('settingsTrigger').addEventListener('click', () => togglePanel(settingsPanel, !settingsPanel.classList.contains('open')));
document.getElementById('settingsClose').addEventListener('click', () => togglePanel(settingsPanel, false));
const themeToggle = document.getElementById('themeToggle');
const themeStart = document.getElementById('themeColorStart');
const themeEnd = document.getElementById('themeColorEnd');
const gradientToggle = document.getElementById('gradientToggle');
const preferenceKey = 'shyred-profile-preferences-v2';
function applyThemeColors(save = true) {
  document.documentElement.style.setProperty('--theme-start', themeStart.value);
  document.documentElement.style.setProperty('--theme-end', themeEnd.value);
  document.documentElement.style.setProperty('--theme-paint', gradientToggle.checked
    ? `linear-gradient(120deg, ${themeStart.value}, ${themeEnd.value})`
    : themeStart.value);
  document.documentElement.style.setProperty('--accent', themeStart.value);
  if (save) savePreferences();
}
function savePreferences() {
  try {
    localStorage.setItem(preferenceKey, JSON.stringify({ start: themeStart.value, end: themeEnd.value, gradient: gradientToggle.checked, dark: document.body.classList.contains('dark-theme') }));
  } catch (_) { /* Local storage may be disabled; settings still work for this session. */ }
}
try {
  const saved = JSON.parse(localStorage.getItem(preferenceKey) || 'null');
  if (saved) {
    if (/^#[\da-f]{6}$/i.test(saved.start || '')) themeStart.value = saved.start;
    if (/^#[\da-f]{6}$/i.test(saved.end || '')) themeEnd.value = saved.end;
    gradientToggle.checked = saved.gradient !== false;
    document.body.classList.toggle('dark-theme', Boolean(saved.dark));
  }
} catch (_) { /* Start with the default appearance if preferences cannot be read. */ }
applyThemeColors(false);
themeToggle.textContent = document.body.classList.contains('dark-theme') ? 'Chuyển nền sáng' : 'Chuyển nền tối';
themeStart.addEventListener('input', () => applyThemeColors());
themeEnd.addEventListener('input', () => applyThemeColors());
gradientToggle.addEventListener('change', () => applyThemeColors());
themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark-theme');
  themeToggle.textContent = document.body.classList.contains('dark-theme') ? 'Chuyển nền sáng' : 'Chuyển nền tối';
  savePreferences();
});

const objectUrls = new Map();
function replaceObjectUrl(key, file) {
  if (objectUrls.has(key)) URL.revokeObjectURL(objectUrls.get(key));
  const url = URL.createObjectURL(file);
  objectUrls.set(key, url);
  return url;
}
document.getElementById('avatarUpload').addEventListener('change', (event) => {
  const file = event.target.files?.[0];
  if (file) {
    const avatar = document.querySelector('.nameplate img');
    avatar.src = replaceObjectUrl('avatar', file);
    avatar.classList.add('custom-media');
  }
});
const backdrop = document.getElementById('backdrop');
const backdropVideo = document.getElementById('backdropVideo');
document.getElementById('backgroundUpload').addEventListener('change', (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  const url = replaceObjectUrl('background', file);
  backdrop.classList.add('custom-media-background');
  if (file.type.startsWith('video/')) {
    backdrop.style.backgroundImage = 'none';
    backdropVideo.src = url;
    backdropVideo.hidden = false;
    backdropVideo.play().catch(() => {});
  } else {
    backdropVideo.pause();
    backdropVideo.removeAttribute('src');
    backdropVideo.load();
    backdropVideo.hidden = true;
    backdrop.style.backgroundImage = `linear-gradient(180deg,rgba(255,255,255,.12),rgba(240,240,240,.08) 48%,rgba(0,0,0,.48)),url("${url}")`;
  }
});
['galleryUpload1', 'galleryUpload2', 'galleryUpload3'].forEach((id, index) => {
  document.getElementById(id).addEventListener('change', (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const tile = document.querySelectorAll('.gallery-tile')[index];
    const url = replaceObjectUrl(`gallery-${index}`, file);
    const image = tile.querySelector('img');
    image.src = url;
    image.classList.add('custom-media');
    tile.dataset.image = url;
  });
});

const searchPanel = document.getElementById('searchPanel');
const searchInput = document.getElementById('gallerySearch');
document.querySelector('.search-trigger').addEventListener('click', (event) => {
  event.preventDefault();
  togglePanel(searchPanel, true);
  searchInput.focus();
});
document.getElementById('searchClose').addEventListener('click', () => {
  togglePanel(searchPanel, false);
  searchInput.value = '';
  document.querySelectorAll('.gallery-tile').forEach((tile) => tile.hidden = false);
});
searchInput.addEventListener('input', () => {
  const query = searchInput.value.trim().toLocaleLowerCase('vi');
  document.querySelectorAll('.gallery-tile').forEach((tile) => {
    const description = `${tile.getAttribute('aria-label')} ${tile.querySelector('img').alt}`.toLocaleLowerCase('vi');
    tile.hidden = query !== '' && !description.includes(query);
  });
});

const viewer = document.getElementById('imageViewer');
const viewerImage = viewer.querySelector('img');
document.querySelectorAll('.gallery-tile').forEach((tile) => tile.addEventListener('click', () => {
  viewerImage.src = tile.dataset.image;
  viewerImage.alt = tile.querySelector('img').alt;
  togglePanel(viewer, true);
}));
function closeViewer() { togglePanel(viewer, false); viewerImage.removeAttribute('src'); }
document.getElementById('viewerClose').addEventListener('click', closeViewer);
viewer.addEventListener('click', (event) => { if (event.target === viewer) closeViewer(); });
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    togglePanel(settingsPanel, false);
    togglePanel(searchPanel, false);
    closeViewer();
  }
});

const playButton = document.getElementById('playButton');
const progress = document.getElementById('trackProgress');
const audio = document.getElementById('profileAudio');
const currentTimeLabel = document.querySelector('.current-time');
const durationLabel = document.querySelector('.duration');
const volumeControl = document.getElementById('volumeControl');
const repeatButton = document.getElementById('repeatButton');
audio.volume = Number(volumeControl.value);
function formatTime(seconds) { return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`; }
function syncPlayer() {
  const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
  const current = Number.isFinite(audio.currentTime) ? audio.currentTime : 0;
  currentTimeLabel.textContent = formatTime(Math.floor(current));
  durationLabel.textContent = formatTime(Math.floor(duration));
  progress.value = duration ? String(current / duration * 100) : '0';
}
audio.addEventListener('loadedmetadata', syncPlayer);
audio.addEventListener('durationchange', syncPlayer);
audio.addEventListener('timeupdate', syncPlayer);
audio.addEventListener('play', () => {
  playButton.textContent = 'Ⅱ';
  playButton.setAttribute('aria-label', 'Tạm dừng nhạc');
});
audio.addEventListener('pause', () => {
  playButton.textContent = '▶';
  playButton.setAttribute('aria-label', 'Phát nhạc');
});
audio.addEventListener('ended', () => { audio.currentTime = 0; syncPlayer(); });
playButton.addEventListener('click', async () => {
  if (audio.paused) {
    try { await audio.play(); } catch (error) { console.error('Không phát được tệp nhạc:', error); }
  } else {
    audio.pause();
  }
});
progress.addEventListener('input', () => {
  if (!Number.isFinite(audio.duration)) return;
  currentTimeLabel.textContent = formatTime(Math.floor(Number(progress.value) / 100 * audio.duration));
});
progress.addEventListener('change', () => {
  if (Number.isFinite(audio.duration)) audio.currentTime = Number(progress.value) / 100 * audio.duration;
});
document.getElementById('rewindButton').addEventListener('click', () => { audio.currentTime = Math.max(0, audio.currentTime - 10); });
document.getElementById('forwardButton').addEventListener('click', () => {
  if (Number.isFinite(audio.duration)) audio.currentTime = Math.min(audio.duration, audio.currentTime + 10);
});
volumeControl.addEventListener('input', () => { audio.volume = Number(volumeControl.value); });
repeatButton.addEventListener('click', () => {
  audio.loop = !audio.loop;
  repeatButton.classList.toggle('active', audio.loop);
  repeatButton.setAttribute('aria-pressed', String(audio.loop));
  repeatButton.setAttribute('aria-label', audio.loop ? 'Tắt chế độ lặp lại' : 'Bật chế độ lặp lại');
  repeatButton.title = audio.loop ? 'Tắt lặp lại' : 'Bật lặp lại';
});
audio.addEventListener('error', () => showToast('Không tìm thấy tệp Tự Sự.mp3.'));
syncPlayer();
audio.autoplay = true;
audio.play().catch(() => showToast('Trình duyệt chặn tự phát có tiếng — nhấn ▶ để bắt đầu.'));
