// --- FITUR PENGATURAN (SETTING) ---

function bukaModalSetting() {
  const savedMode = localStorage.getItem('rt05_setting_mode') || 'normal';
  const savedChatActive = localStorage.getItem('rt05_setting_chat') !== 'false';
  const savedSoundFile = localStorage.getItem('rt05_setting_sound_file') || 'audio/bell2.mp3'; // Default ke folder audio

  document.getElementById('setting-mode-notif').value = savedMode;
  document.getElementById('setting-chat-active').checked = savedChatActive;
  document.getElementById('setting-sound-choice').value = savedSoundFile; // Set dropdown sesuai memori

  document.getElementById('modal-setting').style.display = 'flex';
}

function tutupModalSetting() {
  document.getElementById('modal-setting').style.display = 'none';
}

function simpanPengaturanApp() {
  const mode = document.getElementById('setting-mode-notif').value;
  const chatActive = document.getElementById('setting-chat-active').checked;
  const soundFile = document.getElementById('setting-sound-choice').value; // Ambil pilihan suara

  localStorage.setItem('rt05_setting_mode', mode);
  localStorage.setItem('rt05_setting_chat', chatActive);
  localStorage.setItem('rt05_setting_sound_file', soundFile); // Simpan pilihan suara

  alert('✅ Pengaturan berhasil disimpan!');
  tutupModalSetting();
}

function picuNotifikasiMedia() {
  // 🛑 TAMBAHKAN PENGECEKAN INI: Jika centang chat dimatikan, langsung batalkan (return)
  const isChatActive = localStorage.getItem('rt05_setting_chat') !== 'false';
  if (!isChatActive) return;

  const mode = localStorage.getItem('rt05_setting_mode') || 'normal';
  if (mode === 'sunyi') return;

  // 1. Jalankan Suara Berdasarkan Pilihan Pengguna dari Folder Audio
  if (mode === 'normal' || mode === 'suara') {
    try {
      const selectedSound = localStorage.getItem('rt05_setting_sound_file') || 'audio/bell2.mp3';
      var audio = new Audio(selectedSound); // Memutar file sesuai pilihan di dropdown
      
      audio.play().catch(e => {
        // Fallback jika file gagal dimuat
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
