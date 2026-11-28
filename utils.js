// utils.js - Kumpulan Konfigurasi, Firebase Global, & Fungsi Pendukung RT 05

const RT05_CONFIG = {
    PETA_PROXY_URL: "https://peta.papan05.my.id", 
    UPLOADER_URL: "https://uploader.papan05.my.id",
    ADMIN_API_URL: "https://admin-worker.papan05.my.id",
    DATABASE_URL: "https://papan05-21a56-default-rtdb.asia-southeast1.firebasedatabase.app",
    FIREBASE: {
        apiKey: "AIzaSyCYbBVdgNRUw0BBiqMAoNgO0SPFhIhG2m8",
        authDomain: "papan05-21a56.firebaseapp.com",
        databaseURL: "https://papan05-21a56-default-rtdb.asia-southeast1.firebasedatabase.app",
        projectId: "papan05-21a56",
        storageBucket: "papan05-21a56.firebasestorage.app",
        messagingSenderId: "1068108426437",
        appId: "1:1068108426437:web:429a9b35b92d8622ab94ac"
    },
    BATAS_WILAYAH: [
        [-7.7441031, 110.3835], [-7.7447197, 110.3852273], [-7.743848, 110.3854633],
        [-7.7440818, 110.3861822], [-7.742955, 110.3864933], [-7.7428593, 110.3858925],
        [-7.7407331, 110.3866972], [-7.7404886, 110.3861929], [-7.740563, 110.3848089],
        [-7.7399995, 110.3831674], [-7.740159, 110.382234], [-7.7414879, 110.3818906],
        [-7.7421789, 110.3819979], [-7.7428699, 110.3838755], [-7.7441031, 110.3835]
    ]
};

// ==========================================
// INISIALISASI FIREBASE V10 + ANONYMOUS AUTH (LAZY / NON-BLOCKING)(TERISOLASI PER HALAMAN)
// ==========================================
async function initFirebaseLazy() {
  const path = window.location.pathname.toLowerCase();
  const isChatPage = path.includes('chat');
  const isAdminPage = path.includes('admin');

  // 1. Jika di chat.html, biarkan chat.html mengelola instans "rt05ChatApp" sendiri
  if (isChatPage) return;

  if (window.db && window.auth) return;

  try {
    const [
      { initializeApp, getApps },
      { getDatabase, ref, onValue, update, remove, push, set, get, limitToLast, query, goOffline, goOnline },
      {
        getAuth,
        initializeAuth,
        browserLocalPersistence,
        browserSessionPersistence,
        inMemoryPersistence,
        signInAnonymously,
        signInWithEmailAndPassword,
        onAuthStateChanged
      }
    ] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js"),
      import("https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js")
    ]);

    // 2. Pisahkan nama instans: Admin memakai "rt05AdminApp", Index memakai "[DEFAULT]"
    const appName = isAdminPage ? 'rt05AdminApp' : '[DEFAULT]';
    let app = getApps().find(a => a.name === appName);
    if (!app) {
      app = isAdminPage
        ? initializeApp(RT05_CONFIG.FIREBASE, 'rt05AdminApp')
        : initializeApp(RT05_CONFIG.FIREBASE);
    }

    const db = getDatabase(app, RT05_CONFIG.FIREBASE.databaseURL);

    let auth;
    try {
      auth = initializeAuth(app, {
        persistence: [browserLocalPersistence, browserSessionPersistence, inMemoryPersistence]
      });
    } catch (e) {
      auth = getAuth(app);
    }

    // EKSPOS UTILITIES KE GLOBAL WINDOW
    window.db = db;
    window.auth = auth;
    window.firebaseRef = ref;
    window.firebaseOnValue = onValue;
    window.firebaseUpdate = update;
    window.firebaseRemove = remove;
    window.firebasePush = push;
    window.firebaseSet = set;
    window.firebaseGet = get;
    window.firebaseLimitToLast = limitToLast;
    window.firebaseQuery = query;
    window.firebaseGoOffline = goOffline;
    window.firebaseGoOnline = goOnline;
    window.signInAnonymously = signInAnonymously;
    window.signInWithEmailAndPassword = signInWithEmailAndPassword;
    window.onAuthStateChanged = onAuthStateChanged;

    // 3. Jika halaman ADMIN: Jangan login otomatis sebelum PIN Admin dimasukkan!
    if (isAdminPage) {
      window.dispatchEvent(new Event('firebaseSiap'));
      return;
    }

    // 4. Jika halaman INDEX: Login Anonim otomatis untuk baca data publik & badge
    onAuthStateChanged(auth, (user) => {
      if (!user) {
        signInAnonymously(auth).then(() => {
          console.log("🟢 Autentikasi Anonim Index Berhasil.");
        }).catch((err) => {
          console.error("🔴 Gagal Login Anonim:", err);
        });
      } else {
        window.isFirebaseAuthReady = true;
        window.dispatchEvent(new Event('firebaseSiapIndex'));
      }
    });
  } catch (err) {
    console.error("Gagal memuat modul Firebase:", err);
  }
}

// Jalankan pemuatan Firebase setelah halaman utama selesai render awal (idle)
if ('requestIdleCallback' in window) {
  requestIdleCallback(() => initFirebaseLazy(), { timeout: 2500 });
} else {
  setTimeout(() => initFirebaseLazy(), 1200);
}
// Putus WebSocket sementara saat masuk Back-Forward Cache (bfcache) agar bebas error konsol & lolos audit Lighthouse
window.addEventListener('pagehide', () => {
  if (window.db && typeof window.firebaseGoOffline === 'function') {
    window.firebaseGoOffline(window.db);
  }
});

window.addEventListener('pageshow', (event) => {
  if (event.persisted && window.db && typeof window.firebaseGoOnline === 'function') {
    window.firebaseGoOnline(window.db);
  }
});

// ==========================================
// FUNGSI UTILITY PENDUKUNG & PENCARIAN
// ==========================================

function perbaikiKoordinat(val) {
    if (!val) return "";
    var str = val.toString().replace(/,/g, '.').replace(/\s+/g, '');
    var isNegatif = str.startsWith('-');
    str = str.replace(/-/g, '').replace(/\./g, '');
    if (str.length > 2) {
        if (isNegatif && str.startsWith('7')) {
            str = '-7.' + str.substring(1);
        } else if (!isNegatif && str.startsWith('110')) {
            str = '110.' + str.substring(3);
        } else {
            str = (isNegatif ? '-' : '') + str.substring(0, 1) + '.' + str.substring(1);
        }
    }
    return str;
}

function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str).replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
}

function cariLokasi(keyword, daftarData, callbackHasil) {
    if (!keyword || !daftarData) {
        if (callbackHasil) callbackHasil([]);
        return [];
    }
    const query = String(keyword).toLowerCase().trim();
    const queryAngka = query.replace(/^0+/, '');
    const isPureAngka = /^\d+$/.test(query);

    const hasil = daftarData.filter(item => {
        const nama = String(item.nama || item.namaRaw || item.namaWarga || item.nameAsli || item.namaBarang || '').toLowerCase();
        const namaTempat = String(item.namaTempat || item.name || '').toLowerCase();
        const kepalaKeluarga = String(item.kepalaKeluarga || '').toLowerCase();
        const anggota = String(item.anggota || item.anggotaKeluarga || '').toLowerCase();
        const noRumah = String(item.noRumah || '').toLowerCase();
        const noRumahTanpaNol = noRumah.replace(/^0+/, '');
        const keterangan = String(item.keterangan || item.kategori || '').toLowerCase();

        // Jika pencarian berupa angka murni (misal "43"), prioritaskan kecocokan nomor rumah/bangunan persis
        if (isPureAngka && noRumahTanpaNol === queryAngka) return true;

        return nama.includes(query) ||
               namaTempat.includes(query) ||
               kepalaKeluarga.includes(query) ||
               anggota.includes(query) ||
               noRumah.includes(query) ||
               keterangan.includes(query);
    });

    if (callbackHasil) callbackHasil(hasil);
    return hasil;
}

function getIkonKategori(namaAsli, kategoriManual) {
    let emoji = '🏠'; let kategori = 'rumah';
    let namaUpper = namaAsli ? namaAsli.toUpperCase() : '';
    kategoriManual = kategoriManual ? kategoriManual.toLowerCase() : '';
    let bgStyle = 'background: #000000; border: 2px solid #00FF66; color: black; width: 22px; height: 22px; font-size: 12px;';

    if (kategoriManual.includes('kuliner') || namaUpper.includes('COFFEE') || namaUpper.includes('CAFE') || namaUpper.includes('WARUNG') || namaUpper.includes('BAKSO') || namaUpper.includes('AYAM') || namaUpper.includes('SOTO')) {
        kategori = 'kuliner'; emoji = '🍽️';
        bgStyle = 'background: #FFA500; border: 2px solid #FFFFFF; color: black; width: 22px; height: 22px; font-size: 12px;';
    } 
    else if (kategoriManual.includes('minimarket') || kategoriManual.includes('toko') || namaUpper.includes('MART') || namaUpper.includes('TOKO') || namaUpper.includes('LAUNDRY')) {
        kategori = 'minimarket'; emoji = '🏪';
        bgStyle = 'background: #FFFF00; border: 2px solid #FFEA00; color: black; width: 22px; height: 22px; font-size: 12px;';
    } 
    else if (kategoriManual.includes('kost') || kategoriManual.includes('kos') || namaUpper.includes('KOST') || kategoriManual.includes('kontrakan') || namaUpper.includes('WISMA')) {
        kategori = 'kost'; emoji = '🛏️';
        bgStyle = 'background: #f3e8ff; border: 2px solid #a855f7; color: black; width: 22px; height: 22px; font-size: 12px;';
    }
    else if (kategoriManual.includes('fasum') || kategoriManual.includes('umum') || namaUpper.includes('MASJID') || namaUpper.includes('MUSHOLA') || namaUpper.includes('LAPANGAN') || namaUpper.includes('BALAI') || namaUpper.includes('SPORT')) {
        kategori = 'fasum'; emoji = '🏛️';
        bgStyle = 'background: white; border: 2px solid #ef4444; color: black; width: 22px; height: 22px; font-size: 12px;';
        if (namaUpper.includes('MASJID') || namaUpper.includes('MUSHOLA') || kategoriManual.includes('masjid')) {
            emoji = '🕌';
            bgStyle = 'background-color: #0d9488; color: white; border: 2px solid white; width: 28px; height: 28px; font-size: 14px;';
        } else if (namaUpper.includes('LAPANGAN') || namaUpper.includes('SPORT') || namaUpper.includes('BASKETBALL')) {
            emoji = '🏀';
        }
    }
    return { emoji, kategori, bgStyle };
}

function formatTanggalIndo(tanggalInput) {
    if (!tanggalInput) return "-";
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    const date = new Date(tanggalInput);
    if (isNaN(date.getTime())) return tanggalInput;
    return date.toLocaleDateString('id-ID', options);
}

function tampilkanToast(pesan, tipe = 'sukses') {
    let container = document.getElementById('toast-container-rt05');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container-rt05';
        container.style.cssText = 'position: fixed; top: 140px; left: 50%; transform: translateX(-50%); z-index: 9999; display: flex; flex-direction: column; gap: 8px; align-items: center; pointer-events: none;';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    const bg = tipe === 'error' ? '#ef4444' : (tipe === 'warning' ? '#f59e0b' : '#10b981');
    toast.style.cssText = `background: ${bg}; color: white; padding: 8px 16px; border-radius: 20px; font-size: 12px; font-weight: bold; box-shadow: 0 4px 12px rgba(0,0,0,0.25); opacity: 0; transition: opacity 0.3s ease, transform 0.3s ease; transform: translateY(-10px); pointer-events: auto; text-align: center; max-width: 85vw;`;
    toast.innerText = pesan;

    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '1'; toast.style.transform = 'translateY(0)'; }, 10);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-10px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Fitur Senter Ronda (Deteksi Dukungan Torch Secara Langsung)
let mediaStreamSenter = null;
let isSenterAktif = false;

window.toggleSenterRonda = async function() {
  const btn = document.getElementById('btn-senter-ronda');
  const icon = document.getElementById('icon-senter-ronda');
  const status = document.getElementById('status-senter-ronda');

  const setTampilanSenter = (aktif) => {
    isSenterAktif = aktif;
    if (btn) {
      btn.style.background = aktif ? '#fbbf24' : '#1e293b';
      btn.style.color = aktif ? '#0f172a' : '#fbbf24';
      btn.style.borderColor = aktif ? '#f59e0b' : '#334155';
    }
    if (icon) {
      icon.style.color = aktif ? '#0f172a' : '#fbbf24';
    }
    if (status) {
      status.innerText = aktif ? 'ON' : 'OFF';
    }
  };

  if (isSenterAktif) {
    if (mediaStreamSenter) {
      mediaStreamSenter.getTracks().forEach(track => track.stop());
      mediaStreamSenter = null;
    }
    setTampilanSenter(false);
    return;
  }

  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("NO_MEDIA_DEVICES");
    }

    mediaStreamSenter = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' }
    });

    const track = mediaStreamSenter.getVideoTracks()[0];
    const capabilities = (track && typeof track.getCapabilities === 'function')
      ? track.getCapabilities()
      : {};

    // Cek langsung apakah hardware/browser mengizinkan kontrol torch
    if (!capabilities.torch || typeof track.applyConstraints !== 'function') {
      throw new Error("TORCH_UNSUPPORTED");
    }

    await track.applyConstraints({
      advanced: [{ torch: true }]
    });

    setTampilanSenter(true);
  } catch (err) {
    if (mediaStreamSenter) {
      mediaStreamSenter.getTracks().forEach(track => track.stop());
      mediaStreamSenter = null;
    }
    setTampilanSenter(false);

    if (err.message === "TORCH_UNSUPPORTED") {
      alert("ℹ️ Browser pada perangkat ini (seperti iOS/iPhone) membatasi kontrol lampu flash dari web.\n\nSilakan nyalakan senter langsung dari Pusat Kontrol HP sebelum scan QR.");
    } else {
      alert("❌ Senter gagal dinyalakan. Pastikan izin kamera aktif atau gunakan senter bawaan HP.");
    }
  }
};
let unsubscribeInventaris = null;
let unsubscribePeminjaman = null;

function bukaModalInventaris() {
  const modal = document.getElementById('modal-inventaris');
  if (modal) modal.style.display = 'flex';

  const inputCari = document.getElementById('cariPerkakasInput');
  if (inputCari) inputCari.value = '';

  if (!unsubscribeInventaris || !unsubscribePeminjaman) {
    muatDataInventarisModal();
  }
}

function muatDataInventarisModal() {
  const container = document.getElementById('daftar-inventaris-modal');
  if (!container) return;

  if (typeof window.firebaseRef !== 'function' || typeof window.firebaseOnValue !== 'function' || !window.db) {
    setTimeout(muatDataInventarisModal, 100);
    return;
  }

  let dataPerkakas = [];
  let dataPinjaman = [];

  const renderKartu = () => {
    if (dataPerkakas.length === 0) {
      container.innerHTML = `<div style="text-align:center; padding:20px; color:#666; font-size:12px;">Belum ada data perkakas di database.</div>`;
      return;
    }

    const rekapDipinjam = {};
    dataPinjaman.forEach(row => {
      if (row && String(row.status || '').trim().toLowerCase() === 'dipinjam') {
        const namaBarang = String(row.barang || row.namaBarang || row[2] || '').trim();
        const jumlah = parseInt(row.jumlah || row[3], 10) || 0;
        if (namaBarang) {
          rekapDipinjam[namaBarang] = (rekapDipinjam[namaBarang] || 0) + jumlah;
        }
      }
    });

    const keyword = (document.getElementById('cariPerkakasInput')?.value || '').toLowerCase().trim();

    container.innerHTML = dataPerkakas.map(item => {
      const namaItem = escapeHTML(item.namaBarang || item.nama || item.name || 'Perkakas RT');
      const namaKey = String(item.namaBarang || item.nama || item.name || 'Perkakas RT').trim();
      const fotoItem = item.foto || item.fotoUrl || item.image || '';
      const terpakai = rekapDipinjam[namaKey] || 0;
      const totalAwal = parseInt(item.totalStok !== undefined ? item.totalStok : (item.stok !== undefined ? item.stok : item.jumlah), 10) || 0;
      const sisaStok = Math.max(0, totalAwal - terpakai);

      const cocokFilter = !keyword || namaKey.toLowerCase().includes(keyword);
      const displayStyle = cocokFilter ? 'flex' : 'none';

      const statusBadge = sisaStok > 0
        ? `<span style="background: #dcfce7; color: #15803d; font-size: 11.5px; padding: 4px 10px; border-radius: 999px; font-weight: 800; white-space: nowrap;">Tersedia: ${sisaStok}</span>`
        : `<span style="background: #fee2e2; color: #b91c1c; font-size: 11px; padding: 4px 10px; border-radius: 999px; font-weight: 800; white-space: nowrap;">Habis</span>`;

      const htmlFoto = fotoItem
        ? `<img src="${escapeHTML(fotoItem)}" data-click="bukaFotoBesar" data-arg="${escapeHTML(fotoItem)}" alt="${namaItem}" style="width: 44px; height: 44px; object-fit: cover; border-radius: 8px; border: 1px solid #e2e8f0; flex-shrink: 0; cursor: pointer;" loading="lazy" onError="this.style.display='none'">`
        : '';

      return `
  <div style="display: ${displayStyle}; justify-content: space-between; align-items: center; gap: 8px; border: 1px solid #e2e8f0; padding: 7px 10px; border-radius: 9px; background: #fff;">
    <div style="display: flex; align-items: center; gap: 8px; min-width: 0; flex: 1;">
      ${htmlFoto}
      <div style="min-width: 0; flex: 1;">
        <div style="font-size: 13px; font-weight: 700; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${namaItem}</div>
        <div style="font-size: 11px; color: #64748b; line-height: 1.2; margin-top: 2px;">
          Stok: <strong style="color: #334155;">${totalAwal}</strong> &bull; Dipinjam: <strong style="color: #dc2626;">${terpakai}</strong>
        </div>
      </div>
    </div>
    ${statusBadge}
  </div>
`;
    }).join('');
  };

  unsubscribeInventaris = window.firebaseOnValue(window.firebaseRef(window.db, 'inventaris'), (snap) => {
    dataPerkakas = [];
    if (snap.exists()) snap.forEach(child => { dataPerkakas.push(child.val()); });
    renderKartu();
  });

  unsubscribePeminjaman = window.firebaseOnValue(window.firebaseRef(window.db, 'peminjaman'), (snap) => {
    dataPinjaman = [];
    if (snap.exists()) snap.forEach(child => { dataPinjaman.push(child.val()); });
    renderKartu();
  });
}

function tutupModalInventaris() {
  const modal = document.getElementById('modal-inventaris');
  if (modal) modal.style.display = 'none';

  if (typeof unsubscribeInventaris === 'function') {
    unsubscribeInventaris();
    unsubscribeInventaris = null;
  }
  if (typeof unsubscribePeminjaman === 'function') {
    unsubscribePeminjaman();
    unsubscribePeminjaman = null;
  }
}
// Event Delegation & Listener DOM (CSP-Compliant)
document.addEventListener('click', function(e) {
    const target = e.target.closest('[data-click]');
    if (!target) return;

    const fnName = target.getAttribute('data-click');
    const arg = target.getAttribute('data-arg');

    if (typeof window[fnName] === 'function') {
        if (arg !== null) {
            window[fnName](arg, target, e);
        } else {
            window[fnName](e, target);
        }
    } else {
        console.warn(`[CSP Event Delegation] Fungsi window.${fnName} tidak ditemukan.`);
    }
});

document.addEventListener('change', function(e) {
  const target = e.target.closest('[data-change]');
  if (!target) return;

  const fnName = target.getAttribute('data-change');
  if (typeof window[fnName] === 'function') {
    window[fnName](e, target);
  }
});

document.addEventListener('DOMContentLoaded', function() {
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('keypress', function(event) {
      if (event.key === 'Enter') {
        this.blur();
        if (typeof jalankanPencarianPeta === 'function') {
          jalankanPencarianPeta();
        }
      }
    });
  }
});

window.bukaFotoBesar = function(urlFoto, eventOrKeterangan = null) {
  let keterangan = '';

  // Deteksi apakah halaman saat ini adalah halaman admin
  const isHalamanAdmin =
    /admin/i.test(window.location.pathname) ||
    Boolean(document.getElementById('adminPin')) ||
    typeof window.muatPinPetaAdmin === 'function';

  // 1. Deteksi apakah parameter ke-2 adalah Event (dari index.html) atau String keterangan (dari admin.html)
  if (eventOrKeterangan && typeof eventOrKeterangan === 'object' && typeof eventOrKeterangan.stopPropagation === 'function') {
    eventOrKeterangan.stopPropagation();
  } else if (isHalamanAdmin && typeof eventOrKeterangan === 'string') {
    keterangan = eventOrKeterangan.trim();
  }

  // 2. Validasi ketat URL (hanya izinkan http/https atau path gambar lokal, blokir skema berbahaya seperti javascript:)
  const urlBersih = String(urlFoto || '').trim();
  if (!urlBersih || !/^(https?:\/\/|\.?\/)/i.test(urlBersih)) {
    console.warn('URL foto tidak valid atau diblokir:', urlBersih);
    return;
  }

  let modalFoto = document.getElementById('modal-foto-besar');
  if (!modalFoto) {
    modalFoto = document.createElement('div');
    modalFoto.id = 'modal-foto-besar';
    modalFoto.style.cssText = 'display:none; position:fixed; inset:0; width:100vw; height:100vh; background:rgba(2,6,23,0.88); backdrop-filter:blur(4px); z-index:999999; justify-content:center; align-items:center; padding:20px; box-sizing:border-box;';
    modalFoto.innerHTML = `
      <div style="position:relative; max-width:92vw; max-height:88vh; display:flex; flex-direction:column; align-items:center;">
        <button type="button" id="btn-tutup-foto-besar" aria-label="Tutup" style="position:absolute; top:-14px; right:-10px; background:#ef4444; color:#fff; border:2px solid #fff; border-radius:50%; width:32px; height:32px; font-size:15px; cursor:pointer; font-weight:bold; z-index:1000000; box-shadow:0 4px 10px rgba(0,0,0,0.4);">✕</button>
        <img id="img-tampil-besar" src="" alt="Pratinjau Foto" style="max-width:100%; max-height:78vh; border-radius:8px; border:2px solid #334155; object-fit:contain; background:#0f172a; display:block;" />
        <div id="caption-tampil-besar" style="display:none; color:#f8fafc; font-size:12px; margin-top:10px; text-align:center; font-weight:600; max-width:85vw; word-break:break-word;"></div>
      </div>
    `;

    // Pasang listener langsung agar berfungsi di semua halaman (index.html & admin.html)
    modalFoto.querySelector('#btn-tutup-foto-besar').addEventListener('click', () => {
      window.tutupFotoBesar();
    });

    modalFoto.addEventListener('click', (e) => {
      if (e.target.id === 'modal-foto-besar') {
        window.tutupFotoBesar();
      }
    });

    document.body.appendChild(modalFoto);
  }

  const imgElem = document.getElementById('img-tampil-besar');
  if (imgElem) {
    imgElem.src = urlBersih;
  }

// 3. Tampilkan keterangan HANYA di halaman admin menggunakan textContent (100% kebal XSS)
  const captionElem = document.getElementById('caption-tampil-besar');
  if (captionElem) {
    if (isHalamanAdmin && keterangan) {
      captionElem.textContent = keterangan;
      captionElem.style.display = 'block';
    } else {
      captionElem.textContent = '';
      captionElem.style.display = 'none';
    }
  }

  modalFoto.style.display = 'flex';
};

window.tutupFotoBesar = function() {
  const modalFoto = document.getElementById('modal-foto-besar');
  const imgElem = document.getElementById('img-tampil-besar');
  if (modalFoto) modalFoto.style.display = 'none';
  if (imgElem) imgElem.src = ''; // Kosongkan memori gambar saat ditutup
};

// ==========================================
// PENJAGA GLOBAL TOMBOL BACK HP (PWA)
// ==========================================
(function() {
  if (window._penjagaBackGlobalAktif) return;
  window._penjagaBackGlobalAktif = true;

  let waktuBackTerakhir = 0;
  let guardTerpasang = false;

  function pasangPenjagaHistory() {
    if (guardTerpasang) return;
    try {
      window.history.pushState({ rt05BackGuard: true }, '', window.location.href);
      guardTerpasang = true;
    } catch (e) {}
  }

  function tampilkanPeringatanKeluar() {
    if (typeof window.tampilkanToast === 'function') {
      window.tampilkanToast('Tekan Back sekali lagi untuk keluar aplikasi', 'warning');
      return;
    }

    let toast = document.getElementById('rt05-exit-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'rt05-exit-toast';
      toast.style.cssText = 'position:fixed; bottom:84px; left:50%; transform:translateX(-50%); background:rgba(15,23,42,0.92); color:#f8fafc; padding:10px 18px; border-radius:999px; font-size:12.5px; font-weight:600; z-index:2147483647; box-shadow:0 8px 20px rgba(0,0,0,0.35); border:1px solid rgba(255,255,255,0.15); pointer-events:none; transition:opacity 0.2s; white-space:nowrap;';
      document.body.appendChild(toast);
    }
    toast.textContent = 'Tekan Back sekali lagi untuk keluar aplikasi';
    toast.style.opacity = '1';
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => { toast.style.opacity = '0'; }, 2000);
  }

function tutupModalYangSedangTerbuka() {
    // 1. Cek foto/lightbox besar (baik yang punya ID maupun overlay fixed bergambar)
    const fotoModal = document.getElementById('modal-foto-besar') ||
                      document.getElementById('lightbox-foto') ||
                      document.querySelector('[data-lightbox="foto-besar"]') ||
                      Array.from(document.body.children).find(el => {
                        const s = window.getComputedStyle(el);
                        return s.position === 'fixed' && s.display !== 'none' && Number(s.zIndex) >= 2000 && el.querySelector('img') && !el.classList.contains('modal-bg');
                      });

    if (fotoModal && fotoModal.style.display !== 'none') {
      if (typeof window.tutupFotoBesar === 'function') window.tutupFotoBesar();
      else fotoModal.style.display = 'none';
      return true;
    }

    // 2. Cek modal chat overlay di index.html
    const chatModal = document.getElementById('chat-overlay-modal');
    if (chatModal && chatModal.dataset.open === 'true' && typeof window.toggleChatModal === 'function') {
      window.toggleChatModal();
      return true;
    }

    // 3. Cek modal-bg lain yang sedang tampil (Keuangan, Inventaris, Jimpitan, Setting, dll)
    const modalTerbuka = Array.from(document.querySelectorAll('.modal-bg, #modal-catatan-ronda, #rt05-custom-alert'))
      .reverse()
      .find(el => window.getComputedStyle(el).display !== 'none');

    if (modalTerbuka) {
      modalTerbuka.style.display = 'none';
      if (modalTerbuka.id === 'modal-qr-scanner' && typeof window.stopScanQR === 'function') {
        window.stopScanQR();
      }
      return true;
    }

    return false;
  }

  // Aktifkan state setelah sentuhan/klik pertama agar diizinkan kebijakan Chrome Android
  ['pointerdown', 'keydown'].forEach(evt => {
    window.addEventListener(evt, pasangPenjagaHistory, { once: true, passive: true });
  });

  window.addEventListener('popstate', () => {
    guardTerpasang = false;

    // Jika dijalankan di dalam iframe (misal chat.html di dalam index.html), serahkan ke parent
    if (window.parent && window.parent !== window) return;

    // Prioritas 1: Tutup foto besar atau modal yang sedang terbuka
    if (tutupModalYangSedangTerbuka()) {
      pasangPenjagaHistory();
      return;
    }

    const path = window.location.pathname.toLowerCase();
    const adalahHalamanAnak = path.includes('pengumuman') || path.includes('chat') || path.includes('admin');

    // Prioritas 2: Jika berada di halaman anak (bukan index), kembali ke index.html
    if (adalahHalamanAnak) {
      window.location.href = 'index.html';
      return;
    }

    // Prioritas 3: Di index.html, terapkan konfirmasi tekan Back 2x dalam 2 detik
    const sekarang = Date.now();
    if (sekarang - waktuBackTerakhir < 2000) {
      window.history.back(); // Keluar aplikasi
    } else {
      waktuBackTerakhir = sekarang;
      tampilkanPeringatanKeluar();
      pasangPenjagaHistory();
    }
  });
})();

// DAFTARKAN SEMUA FUNGSI KE WINDOW GLOBAL
window.RT05_CONFIG = RT05_CONFIG;
window.perbaikiKoordinat = perbaikiKoordinat;
window.escapeHTML = escapeHTML;
window.cariLokasi = cariLokasi;
window.getIkonKategori = getIkonKategori;
window.formatTanggalIndo = formatTanggalIndo;
window.tampilkanToast = tampilkanToast;
window.bukaModalInventaris = bukaModalInventaris;
window.tutupModalInventaris = tutupModalInventaris;
window.bukaFotoBesar = bukaFotoBesar;
window.tutupFotoBesar = tutupFotoBesar;

window.dispatchEvent(new Event('utilsSiap'));
