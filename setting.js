// --- FITUR PENGATURAN (SETTING) ---

function bukaModalSetting() {
  const savedMode = localStorage.getItem('rt05_setting_mode') || 'normal';
  const savedChatActive = localStorage.getItem('rt05_setting_chat') !== 'false';

  document.getElementById('setting-mode-notif').value = savedMode;
  document.getElementById('setting-chat-active').checked = savedChatActive;

  document.getElementById('modal-setting').style.display = 'flex';
}

function tutupModalSetting() {
  document.getElementById('modal-setting').style.display = 'none';
}

function simpanPengaturanApp() {
  const mode = document.getElementById('setting-mode-notif').value;
  const chatActive = document.getElementById('setting-chat-active').checked;

  localStorage.setItem('rt05_setting_mode', mode);
  localStorage.setItem('rt05_setting_chat', chatActive);

  alert('✅ Pengaturan berhasil disimpan!');
  tutupModalSetting();
}

function picuNotifikasiMedia() {
  const mode = localStorage.getItem('rt05_setting_mode') || 'normal';
  if (mode === 'sunyi') return;

  // 1. Jalankan Suara (Bisa pakai file MP3 kustom atau fungsi bawaan)
  if (mode === 'normal' || mode === 'suara') {
    try {
      // Opsi A: Menggunakan file audio MP3 (pastikan Anda punya file 'notif.mp3' di folder proyek)
      var audio = new Audio('notif.mp3');
      audio.play().catch(e => {
        // Fallback ke suara bawaan jika file MP3 belum ada
        if (typeof mainkanSuaraBeep === 'function') {
          mainkanSuaraBeep();
        }
      });
    } catch (err) {
      if (typeof mainkanSuaraBeep === 'function') {
        mainkanSuaraBeep();
      }
    }
  }

  // 2. Jalankan Getar
  if (mode === 'normal' || mode === 'getar') {
    try {
      if ('vibrate' in navigator) {
        navigator.vibrate([150, 100, 150]);
      }
    } catch (e) {
      console.log("Vibrate error:", e);
    }
  }
}
