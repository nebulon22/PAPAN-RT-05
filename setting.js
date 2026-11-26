// =========================================================
// 1. KONFIGURASI DEFAULT & STATE AUDIO / HAPTIC
// =========================================================
const DEFAULT_SOUND_GRUP = 'audio/bell2.mp3';
const DEFAULT_SOUND_PRIVATE = 'audio/ping1.mp3';

const POLA_HAPTIC = {
  preview: [18, 45, 28],           // Ketukan ganda halus saat tes mode
  grup: [22, 40, 15],              // Denyut lembut pesan grup
  private: [16, 38, 16, 45, 32],   // Irama "tik-tik-tuk" pesan pribadi
  info: [25, 50, 40]               // Ketukan tegas pengumuman RT
};

const notifAudioCache = {
  grup: null,
  private: null
};

let isAudioUnlocked = false;
let audioPreviewAktif = null;

// =========================================================
// 2. INISIALISASI LAZY AUDIO & AUTOPLAY UNLOCK
// =========================================================
function initNotifAudioCache() {
  if (!notifAudioCache.grup) {
    notifAudioCache.grup = new Audio(localStorage.getItem('rt05_setting_sound_grup') || DEFAULT_SOUND_GRUP);
    notifAudioCache.grup.preload = 'auto';
  }
  if (!notifAudioCache.private) {
    notifAudioCache.private = new Audio(localStorage.getItem('rt05_setting_sound_private') || DEFAULT_SOUND_PRIVATE);
    notifAudioCache.private.preload = 'auto';
  }
}

// Muat file MP3 diam-diam setelah peta tampil penuh (tidak membebani render awal)
setTimeout(initNotifAudioCache, 5000);

function unlockPwaAudio() {
  initNotifAudioCache();
  if (isAudioUnlocked) return;

  Object.values(notifAudioCache).forEach(audio => {
    if (!audio) return;
    const prevMuted = audio.muted;
    audio.muted = true;
    audio.play().then(() => {
      audio.pause();
      audio.currentTime = 0;
      audio.muted = prevMuted;

      if (!isAudioUnlocked) {
        isAudioUnlocked = true;
        ['touchstart', 'click', 'keydown'].forEach(evt => {
          window.removeEventListener(evt, unlockPwaAudio);
        });
      }
    }).catch(() => {
      audio.muted = prevMuted;
    });
  });
}

['touchstart', 'click', 'keydown'].forEach(evt => {
  window.addEventListener(evt, unlockPwaAudio, { passive: true });
});

// =========================================================
// 3. KONTROL MODAL PENGATURAN & SIMPAN PREFERENSI
// =========================================================
window.bukaModalSetting = function() {
  const mode = localStorage.getItem('rt05_setting_mode') || 'normal';
  const chatAktif = localStorage.getItem('rt05_setting_chat') !== 'false';
  const privateAktif = localStorage.getItem('rt05_setting_private_active') !== 'false';
  const soundGrup = localStorage.getItem('rt05_setting_sound_grup') || DEFAULT_SOUND_GRUP;
  const soundPrivate = localStorage.getItem('rt05_setting_sound_private') || DEFAULT_SOUND_PRIVATE;

  document.getElementById('setting-mode-notif').value = mode;
  document.getElementById('setting-chat-active').checked = chatAktif;
  document.getElementById('setting-private-active').checked = privateAktif;
  document.getElementById('setting-sound-grup').value = soundGrup;
  document.getElementById('setting-sound-private').value = soundPrivate;
  document.getElementById('modal-setting').style.display = 'flex';
};

window.tutupModalSetting = function() {
  if (audioPreviewAktif) {
    audioPreviewAktif.pause();
    audioPreviewAktif.currentTime = 0;
  }
  const modal = document.getElementById('modal-setting');
  if (modal) modal.style.display = 'none';
};

window.simpanPengaturanApp = function() {
  initNotifAudioCache();

  const mode = document.getElementById('setting-mode-notif').value;
  const chatAktif = document.getElementById('setting-chat-active').checked;
  const privateAktif = document.getElementById('setting-private-active').checked;
  const soundGrup = document.getElementById('setting-sound-grup').value;
  const soundPrivate = document.getElementById('setting-sound-private').value;

  localStorage.setItem('rt05_setting_mode', mode);
  localStorage.setItem('rt05_setting_chat', chatAktif);
  localStorage.setItem('rt05_setting_private_active', privateAktif);
  localStorage.setItem('rt05_setting_sound_grup', soundGrup);
  localStorage.setItem('rt05_setting_sound_private', soundPrivate);

  notifAudioCache.grup.src = soundGrup;
  notifAudioCache.grup.load();
  notifAudioCache.private.src = soundPrivate;
  notifAudioCache.private.load();

  isAudioUnlocked = false;
  unlockPwaAudio();

  alert('✅ Pengaturan berhasil disimpan!');
  window.tutupModalSetting();
};

// =========================================================
// 4. PRATINJAU SUARA & GETAR (SAAT PILIH DI DROPDOWN)
// =========================================================
window.previewSuara = function(filePath) {
  if (!filePath) return;
  try {
    if (audioPreviewAktif) {
      audioPreviewAktif.pause();
      audioPreviewAktif.currentTime = 0;
    }
    audioPreviewAktif = new Audio(filePath);
    audioPreviewAktif.volume = 1.0;
    const playPromise = audioPreviewAktif.play();
    if (playPromise !== undefined) {
      playPromise.catch(err => console.warn('Audio preview ditahan:', err));
    }
  } catch (e) {
    console.error('Error audio preview:', e);
  }
};

window.previewModeNotif = function(mode) {
  const bolehGetar = (mode === 'normal' || mode === 'getar');
  const bolehSuara = (mode === 'normal' || mode === 'suara');

  if (bolehGetar && 'vibrate' in navigator) {
    try {
      navigator.vibrate(POLA_HAPTIC.preview);
    } catch (e) {}
  }

  if (bolehSuara) {
    const fileGrup = document.getElementById('setting-sound-grup')?.value || DEFAULT_SOUND_GRUP;
    window.previewSuara(fileGrup);
  }
};

// =========================================================
// 5. PEMICU NOTIFIKASI TERPUSAT (CHAT GRUP, PRIVATE, INFO)
// =========================================================
window.picuNotifikasiMedia = function(jenis = 'grup') {
  initNotifAudioCache();

  const mode = localStorage.getItem('rt05_setting_mode') || 'normal';
  if (mode === 'sunyi') return;

  // Cek apakah notifikasi untuk jenis chat tersebut diaktifkan
  if (jenis === 'grup' && localStorage.getItem('rt05_setting_chat') === 'false') return;
  if (jenis === 'private' && localStorage.getItem('rt05_setting_private_active') === 'false') return;

  // 1. Putar Suara
  if (mode === 'normal' || mode === 'suara') {
    try {
      const isPrivate = (jenis === 'private');
      const player = isPrivate ? notifAudioCache.private : notifAudioCache.grup;
      const savedSrc = isPrivate
        ? (localStorage.getItem('rt05_setting_sound_private') || DEFAULT_SOUND_PRIVATE)
        : (localStorage.getItem('rt05_setting_sound_grup') || DEFAULT_SOUND_GRUP);

      if (!player.src.endsWith(savedSrc)) {
        player.src = savedSrc;
      }
      player.pause();
      player.currentTime = 0;
      player.play().catch(() => {
        if (typeof mainkanSuaraBeep === 'function') mainkanSuaraBeep();
      });
    } catch (e) {
      if (typeof mainkanSuaraBeep === 'function') mainkanSuaraBeep();
    }
  }

  // 2. Getar Haptic (Hanya saat layar aktif)
  if ((mode === 'normal' || mode === 'getar') && !document.hidden && 'vibrate' in navigator) {
    try {
      const pola = POLA_HAPTIC[jenis] || POLA_HAPTIC.grup;
      navigator.vibrate(pola);
    } catch (e) {}
  }
};

// Alias agar panggilan lama maupun baru tetap berfungsi identik
window.picuSuaraDanGetarNotif = window.picuNotifikasiMedia;
