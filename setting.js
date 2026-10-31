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

  alert('✅ Pengaturan berhasil disimpan!');
  tutupModalSetting();
}

function picuNotifikasiMedia(jenisChat = 'grup') {
  const mode = localStorage.getItem('rt05_setting_mode') || 'normal';
  if (mode === 'sunyi') return;

  // Cek apakah jenis chat tersebut diaktifkan centangnya
  if (jenisChat === 'grup') {
    if (localStorage.getItem('rt05_setting_chat') === 'false') return;
  } else if (jenisChat === 'private') {
    if (localStorage.getItem('rt05_setting_private_active') === 'false') return;
  }

  // 1. Jalankan Suara Sesuai Pilihan
  if (mode === 'normal' || mode === 'suara') {
    try {
      let selectedSound = jenisChat === 'grup' 
        ? (localStorage.getItem('rt05_setting_sound_grup') || 'audio/bell2.mp3')
        : (localStorage.getItem('rt05_setting_sound_private') || 'audio/bell1.mp3');

      var audio = new Audio(selectedSound);
      audio.play().catch(e => {
        if (typeof mainkanSuaraBeep === 'function') mainkanSuaraBeep();
      });
    } catch (err) {
      if (typeof mainkanSuaraBeep === 'function') mainkanSuaraBeep();
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
