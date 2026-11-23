// --- PRELOAD & UNLOCK AUDIO NOTIFIKASI ---
const notifAudioCache = {
  grup: new Audio(localStorage.getItem('rt05_setting_sound_grup') || 'audio/bell2.mp3'),
  private: new Audio(localStorage.getItem('rt05_setting_sound_private') || 'audio/bell1.mp3')
};
notifAudioCache.grup.preload = 'auto';
notifAudioCache.private.preload = 'auto';

let isAudioUnlocked = false;

function unlockPwaAudio() {
  if (isAudioUnlocked) return;
  Object.values(notifAudioCache).forEach(audioEl => {
    const prevMuted = audioEl.muted;
    audioEl.muted = true;
    audioEl.play().then(() => {
      audioEl.pause();
      audioEl.currentTime = 0;
      audioEl.muted = prevMuted;
      isAudioUnlocked = true;
    }).catch(() => {
      audioEl.muted = prevMuted;
    });
  });
}

// Buka kunci audio pada sentuhan/klik pertama di index.html
['touchstart', 'click', 'keydown'].forEach(evt => {
  window.addEventListener(evt, unlockPwaAudio, { passive: true });
});

// --- FITUR PENGATURAN (SETTING) ---
function bukaModalSetting() {
  const savedMode = localStorage.getItem('rt05_setting_mode') || 'normal';
  const savedChatActive = localStorage.getItem('rt05_setting_chat') !== 'false';
  const savedPrivateActive = localStorage.getItem('rt05_setting_private_active') !== 'false';
  const savedSoundGrup = localStorage.getItem('rt05_setting_sound_grup') || 'audio/bell2.mp3';
  const savedSoundPrivate = localStorage.getItem('rt05_setting_sound_private') || 'audio/bell1.mp3';

  document.getElementById('setting-mode-notif').value = savedMode;
  document.getElementById('setting-chat-active').checked = savedChatActive;
  document.getElementById('setting-private-active').checked = savedPrivateActive;
  document.getElementById('setting-sound-grup').value = savedSoundGrup;
  document.getElementById('setting-sound-private').value = savedSoundPrivate;

  document.getElementById('modal-setting').style.display = 'flex';
}

function tutupModalSetting() {
  document.getElementById('modal-setting').style.display = 'none';
}

function simpanPengaturanApp() {
  const mode = document.getElementById('setting-mode-notif').value;
  const chatActive = document.getElementById('setting-chat-active').checked;
  const privateActive = document.getElementById('setting-private-active').checked;
  const soundGrup = document.getElementById('setting-sound-grup').value;
  const soundPrivate = document.getElementById('setting-sound-private').value;

  localStorage.setItem('rt05_setting_mode', mode);
  localStorage.setItem('rt05_setting_chat', chatActive);
  localStorage.setItem('rt05_setting_private_active', privateActive);
  localStorage.setItem('rt05_setting_sound_grup', soundGrup);
  localStorage.setItem('rt05_setting_sound_private', soundPrivate);

  // Perbarui sumber audio di cache & langsung unlock saat tombol Simpan diklik
  notifAudioCache.grup.src = soundGrup;
  notifAudioCache.grup.load();
  notifAudioCache.private.src = soundPrivate;
  notifAudioCache.private.load();
  isAudioUnlocked = false;
  unlockPwaAudio();

  alert('✅ Pengaturan berhasil disimpan!');
  tutupModalSetting();
}

function picuNotifikasiMedia(jenisChat = 'grup') {
  const mode = localStorage.getItem('rt05_setting_mode') || 'normal';
  if (mode === 'sunyi') return;

  // Cek apakah jenis chat tersebut diaktifkan centangnya
  if (jenisChat === 'grup' && localStorage.getItem('rt05_setting_chat') === 'false') return;
  if (jenisChat === 'private' && localStorage.getItem('rt05_setting_private_active') === 'false') return;

  // 1. Jalankan Suara dari Audio yang Sudah Di-preload & Di-unlock
  if (mode === 'normal' || mode === 'suara') {
    try {
      const targetAudio = jenisChat === 'grup' ? notifAudioCache.grup : notifAudioCache.private;
      const expectedSrc = jenisChat === 'grup'
        ? (localStorage.getItem('rt05_setting_sound_grup') || 'audio/bell2.mp3')
        : (localStorage.getItem('rt05_setting_sound_private') || 'audio/bell1.mp3');

      if (!targetAudio.src.endsWith(expectedSrc)) {
        targetAudio.src = expectedSrc;
      }

      targetAudio.pause();
      targetAudio.currentTime = 0;
      targetAudio.play().catch(() => {
        if (typeof mainkanSuaraBeep === 'function') mainkanSuaraBeep();
      });
    } catch (err) {
      if (typeof mainkanSuaraBeep === 'function') mainkanSuaraBeep();
    }
  }

  // 2. Jalankan Getar (hanya efektif saat layar aktif/foreground)
  if ((mode === 'normal' || mode === 'getar') && !document.hidden) {
    try {
      if ('vibrate' in navigator) {
        navigator.vibrate([150, 100, 150]);
      }
    } catch (e) {}
  }
}
