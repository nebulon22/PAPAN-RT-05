const DEFAULT_SOUND_GRUP = "audio/bell2.mp3",
    DEFAULT_SOUND_PRIVATE = "audio/ping1.mp3",
    notifAudioCache = {
        grup: new Audio(localStorage.getItem("rt05_setting_sound_grup") || "audio/bell2.mp3"),
        private: new Audio(localStorage.getItem("rt05_setting_sound_private") || "audio/ping1.mp3")
    };
notifAudioCache.grup.preload = "auto", notifAudioCache.private.preload = "auto";
let isAudioUnlocked = !1,
    previewAudioPlayer = null;

function unlockPwaAudio() {
    isAudioUnlocked || Object.values(notifAudioCache).forEach(e => {
        const t = e.muted;
        e.muted = !0, e.play().then(() => {
            e.pause(), e.currentTime = 0, e.muted = t, isAudioUnlocked = !0
        }).catch(() => {
            e.muted = t
        })
    })
}

let audioPreviewAktif = null;

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
      playPromise.catch(err => console.warn("Audio preview ditahan:", err));
    }
  } catch (e) {
    console.error("Error audio preview:", e);
  }
};
// Kumpulan pola haptic berkelas (dalam milidetik: [getar, jeda, getar, ...])
const POLA_HAPTIC = {
  // 1. Pratinjau saat ganti dropdown mode (ketukan ganda halus & presisi)
  preview: [18, 45, 28],

  // 2. Pesan Chat Grup masuk (satu denyut lembut tapi terasa)
  grup: [22, 40, 15],

  // 3. Pesan Chat Private masuk (irama "tik-tik-tuk" elegan)
  private: [16, 38, 16, 45, 32],

  // 4. Pengumuman RT / Info Penting (ketukan tegas berirama)
  info: [25, 50, 40]
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
    const fileGrup = document.getElementById('setting-sound-grup')?.value || 'audio/bell2.mp3';
    if (typeof window.previewSuara === 'function') {
      window.previewSuara(fileGrup);
    }
  }
};

function bukaModalSetting() {
    const e = localStorage.getItem("rt05_setting_mode") || "normal",
        t = "false" !== localStorage.getItem("rt05_setting_chat"),
        a = "false" !== localStorage.getItem("rt05_setting_private_active"),
        i = localStorage.getItem("rt05_setting_sound_grup") || "audio/bell2.mp3",
        o = localStorage.getItem("rt05_setting_sound_private") || "audio/ping1.mp3";
    document.getElementById("setting-mode-notif").value = e, document.getElementById("setting-chat-active").checked = t, document.getElementById("setting-private-active").checked = a, document.getElementById("setting-sound-grup").value = i, document.getElementById("setting-sound-private").value = o, document.getElementById("modal-setting").style.display = "flex"
}

function tutupModalSetting() {
    previewAudioPlayer && (previewAudioPlayer.pause(), previewAudioPlayer.currentTime = 0), document.getElementById("modal-setting").style.display = "none"
}

function simpanPengaturanApp() {
    const e = document.getElementById("setting-mode-notif").value,
        t = document.getElementById("setting-chat-active").checked,
        a = document.getElementById("setting-private-active").checked,
        i = document.getElementById("setting-sound-grup").value,
        o = document.getElementById("setting-sound-private").value;
    localStorage.setItem("rt05_setting_mode", e), localStorage.setItem("rt05_setting_chat", t), localStorage.setItem("rt05_setting_private_active", a), localStorage.setItem("rt05_setting_sound_grup", i), localStorage.setItem("rt05_setting_sound_private", o), notifAudioCache.grup.src = i, notifAudioCache.grup.load(), notifAudioCache.private.src = o, notifAudioCache.private.load(), isAudioUnlocked = !1, unlockPwaAudio(), alert("✅ Pengaturan berhasil disimpan!"), tutupModalSetting()
}

function picuNotifikasiMedia(e = "grup") {
    const t = localStorage.getItem("rt05_setting_mode") || "normal";
    if ("sunyi" !== t && !("grup" === e && "false" === localStorage.getItem("rt05_setting_chat") || "private" === e && "false" === localStorage.getItem("rt05_setting_private_active"))) {
        if ("normal" === t || "suara" === t) try {
            const t = "grup" === e ? notifAudioCache.grup : notifAudioCache.private,
                a = "grup" === e ? localStorage.getItem("rt05_setting_sound_grup") || "audio/bell2.mp3" : localStorage.getItem("rt05_setting_sound_private") || "audio/ping1.mp3";
            t.src.endsWith(a) || (t.src = a), t.pause(), t.currentTime = 0, t.play().catch(() => {
                "function" == typeof mainkanSuaraBeep && mainkanSuaraBeep()
            })
        } catch (e) {
            "function" == typeof mainkanSuaraBeep && mainkanSuaraBeep()
        }
        if (("normal" === t || "getar" === t) && !document.hidden) try {
            "vibrate" in navigator && navigator.vibrate([150, 100, 150])
        } catch (e) {}
    }
} ["touchstart", "click", "keydown"].forEach(e => {
    window.addEventListener(e, unlockPwaAudio, {
        passive: !0
    })
});

// Helper terpusat untuk memicu getar & suara saat pesan/info baru masuk
window.picuSuaraDanGetarNotif = function(jenis = 'grup') {
  const mode = localStorage.getItem('rt05_mode_notif') || 'normal';
  if (mode === 'sunyi') return;

  if ((mode === 'normal' || mode === 'getar') && 'vibrate' in navigator) {
    try {
      const pola = POLA_HAPTIC[jenis] || POLA_HAPTIC.grup;
      navigator.vibrate(pola);
    } catch (e) {}
  }

  if (mode === 'normal' || mode === 'suara') {
    const isAktif = jenis === 'private'
      ? (localStorage.getItem('rt05_private_active') !== 'false')
      : (localStorage.getItem('rt05_chat_active') !== 'false');

    if (!isAktif) return;

    const soundFile = jenis === 'private'
      ? (localStorage.getItem('rt05_sound_private') || 'audio/ping1.mp3')
      : (localStorage.getItem('rt05_sound_grup') || 'audio/bell2.mp3');

    if (typeof window.previewSuara === 'function') {
      window.previewSuara(soundFile);
    }
  }
};
