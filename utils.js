// utils.js - Kumpulan Konfigurasi, Firebase Global, & Fungsi Pendukung RT 05

const RT05_CONFIG = {
    PETA_PROXY_URL: "https://peta.papan05.my.id", 
    UPLOADER_URL: "https://rt05-uploader.deny220291.workers.dev/",
    ADMIN_API_URL: "https://rt05-admin-worker.deny220291.workers.dev",
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
// INISIALISASI FIREBASE V10 + ANONYMOUS AUTH TERPUSAT
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, onValue, update, remove, push, set, get, limitToLast, query } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { 
  getAuth, 
  initializeAuth, 
  browserLocalPersistence, 
  browserSessionPersistence, 
  inMemoryPersistence, 
  signInAnonymously, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const app = initializeApp(RT05_CONFIG.FIREBASE);
const db = getDatabase(app, RT05_CONFIG.FIREBASE.databaseURL);

// Inisialisasi Auth Langsung Menggunakan Persistence (Tanpa Memicu GAPI Iframe)
let auth;
try {
  auth = initializeAuth(app, {
    persistence: [browserLocalPersistence, browserSessionPersistence, inMemoryPersistence]
  });
} catch (e) {
  auth = getAuth(app);
}

// Autentikasi Anonim Otomatis di Latar Belakang
onAuthStateChanged(auth, (user) => {
  if (!user) {
    signInAnonymously(auth).then(() => {
      console.log("🟢 Autentikasi Anonim Berhasil Diberikan.");
    }).catch((err) => {
      console.error("🔴 Gagal Login Anonim:", err);
    });
  } else {
    console.log("🟢 Sesi Firebase Auth Aktif. UID:", user.uid);
  }
});

// EKSPOS UTILITIES DARI MODULE KE GLOBAL WINDOW
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
    const query = keyword.toLowerCase().trim();
    const hasil = daftarData.filter(item => {
        const nama = (item.nama || item.namaRaw || item.namaWarga || item.nameAsli || item.namaBarang || '').toLowerCase();
        const keterangan = (item.keterangan || item.kategori || '').toLowerCase();
        return nama.includes(query) || keterangan.includes(query);
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

// Fitur Senter Ronda
let mediaStreamSenter = null;
let isSenterAktif = false;

window.toggleSenterRonda = async function() {
  const btn = document.getElementById('btn-senter-ronda');
  const icon = document.getElementById('icon-senter-ronda');
  const status = document.getElementById('status-senter-ronda');

  try {
    if (!isSenterAktif) {
      mediaStreamSenter = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', advanced: [{ torch: true }] }
      });
      isSenterAktif = true;
      if (btn) { btn.style.background = '#fbbf24'; btn.style.color = '#0f172a'; btn.style.borderColor = '#f59e0b'; }
      if (icon) { icon.style.color = '#0f172a'; }
      if (status) status.innerText = 'ON';
    } else {
      if (mediaStreamSenter) {
        mediaStreamSenter.getTracks().forEach(track => track.stop());
        mediaStreamSenter = null;
      }
      isSenterAktif = false;
      if (btn) { btn.style.background = '#1e293b'; btn.style.color = '#fbbf24'; btn.style.borderColor = '#334155'; }
      if (icon) { icon.className = 'fa-solid fa-lightbulb'; icon.style.color = '#fbbf24'; }
      if (status) status.innerText = 'OFF';
    }
  } catch (err) {
    alert("❌ Fitur senter tidak didukung di browser HP ini atau izin kamera belum diberikan.");
    isSenterAktif = false;
    if (status) status.innerText = 'OFF';
  }
};

function bukaModalInventaris() {
    const modal = document.getElementById('modal-inventaris');
    if (modal) modal.style.display = 'flex';
}

function tutupModalInventaris() {
    const modal = document.getElementById('modal-inventaris');
    if (modal) modal.style.display = 'none';
}

// Event Delegation & Listener DOM
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

window.bukaFotoBesar = function(urlFoto, event) {
  if (event && typeof event.stopPropagation === 'function') {
    event.stopPropagation();
  }
  
  let modalFoto = document.getElementById('modal-foto-besar');
  if (!modalFoto) {
    modalFoto = document.createElement('div');
    modalFoto.id = 'modal-foto-besar';
    modalFoto.style.cssText = 'display:none; position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.85); z-index:999999; justify-content:center; align-items:center; padding:20px; box-sizing:border-box;';
    modalFoto.innerHTML = `
      <div style="position:relative; max-width:90%; max-height:90%;">
        <button type="button" data-click="tutupFotoBesar" style="position:absolute; top:-40px; right:0; background:#ef4444; color:#fff; border:none; border-radius:50%; width:32px; height:32px; font-size:16px; cursor:pointer; font-weight:bold; z-index:1000000;">✕</button>
        <img id="img-tampil-besar" src="" style="max-width:100%; max-height:85vh; border-radius:8px; object-fit:contain; display:block; margin:0 auto;" />
      </div>
    `;
    modalFoto.onclick = function(e) {
      if (e.target.id === 'modal-foto-besar') {
        window.tutupFotoBesar();
      }
    };
    document.body.appendChild(modalFoto);
  }

  const imgElem = document.getElementById('img-tampil-besar');
  if (imgElem) {
    imgElem.src = urlFoto;
  }
  modalFoto.style.display = 'flex';
};

window.tutupFotoBesar = function() {
  const modalFoto = document.getElementById('modal-foto-besar');
  if (modalFoto) {
    modalFoto.style.display = 'none';
  }
};

// Helper Global untuk Tombol Persetujuan Chat Warga
window.approveUser = (uid) => {
  window.firebaseUpdate(window.firebaseRef(window.db, `users/${uid}`), { status: 'aktif' });
};

window.rejectUser = (uid, statusWarga = 'pending') => {
  const pesan = statusWarga === 'aktif' 
    ? "PERINGATAN: Yakin ingin menghapus akun warga aktif ini secara permanen?" 
    : "Hapus / Tolak pendaftaran warga ini?";
    
  if (confirm(pesan)) {
    window.firebaseRemove(window.firebaseRef(window.db, `users/${uid}`));
  }
};

window.toggleRole = (uid, currentRole) => {
  const newRole = currentRole === 'admin' ? 'warga' : 'admin';
  window.firebaseUpdate(window.firebaseRef(window.db, `users/${uid}`), { role: newRole });
};

// Real-time Listener untuk Manajemen User/Chat Warga
export function inisialisasiListenerUsersAdmin() {
  const pendingTable = document.getElementById('pending-users-list');
  const allUsersTable = document.getElementById('all-users-list');
  
  if (!pendingTable || !allUsersTable) return;

  const usersRef = window.firebaseRef(window.db, 'users');
  window.firebaseOnValue(usersRef, (snapshot) => {
    pendingTable.innerHTML = '';
    allUsersTable.innerHTML = '';

    if (!snapshot.exists()) {
      pendingTable.innerHTML = '<tr><td colspan="2" style="padding: 8px; text-align: center; color: #64748b;">Belum ada pendaftar.</td></tr>';
      
      const pBadge = document.getElementById('pending-badge');
      const tWarga = document.getElementById('total-warga-count');
      if (pBadge) pBadge.innerText = `0 Pending`;
      if (tWarga) tWarga.innerText = 0;
      return;
    }

    let pendingCount = 0;
    let totalCount = 0;

    snapshot.forEach((childSnap) => {
      const u = childSnap.val();
      const uid = childSnap.key;

      if (u.status === 'pending') {
        pendingCount++;
        const tr = document.createElement('tr');
        tr.style.borderBottom = "1px solid #1e293b";
        tr.innerHTML = `
          <td style="padding: 6px;">
            <strong style="color: #fff; display: block;">${escapeHTML(u.nama)}</strong>
            <span style="color: #94a3b8; font-size: 10px;">${escapeHTML(u.hunian)}</span>
          </td>
          <td style="padding: 6px; text-align: center; white-space: nowrap;">
            <button onclick="approveUser('${uid}')" style="background-color: #10b981; color: #022c22; font-weight: bold; border: none; padding: 4px 8px; border-radius: 4px; font-size: 10px; cursor: pointer; margin-right: 2px;">
              ACC
            </button>
            <button onclick="rejectUser('${uid}')" style="background-color: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.4); padding: 4px 6px; border-radius: 4px; font-size: 10px; cursor: pointer;">
              Tolak
            </button>
          </td>
        `;
        pendingTable.appendChild(tr);
      } else if (u.status === 'aktif') {
        totalCount++;
        const tr = document.createElement('tr');
        tr.style.borderBottom = "1px solid #1e293b";
        
        const isAdmin = u.role === 'admin';
        const roleBadge = isAdmin ? 
          '<span style="background: rgba(56, 189, 248, 0.2); color: #38bdf8; padding: 1px 4px; border-radius: 3px; font-size: 9px; font-weight: bold;">ADMIN</span>' : 
          '<span style="background: #334155; color: #94a3b8; padding: 1px 4px; border-radius: 3px; font-size: 9px;">WARGA</span>';

        tr.innerHTML = `
          <td style="padding: 6px;">
            <strong style="color: #e2e8f0; display: block;">${escapeHTML(u.username || u.nama)} ${roleBadge}</strong>
            <span style="color: #64748b; font-size: 10px;">${escapeHTML(u.hunian)}</span>
          </td>
          <td style="padding: 6px; text-align: center; white-space: nowrap;">
            <button onclick="toggleRole('${uid}', '${u.role}')" style="background: #334155; color: #cbd5e1; border: none; padding: 3px 6px; border-radius: 4px; font-size: 10px; cursor: pointer; margin-right: 2px;">
              ${isAdmin ? 'Warga' : 'Jadi Admin'}
            </button>
            <button onclick="rejectUser('${uid}', 'aktif')" style="background: transparent; color: #f87171; border: none; padding: 3px 4px; font-size: 10px; cursor: pointer;">
              ❌Hapus Akun
            </button>
          </td>
        `;
        allUsersTable.appendChild(tr);
      }
    });

    if (pendingCount === 0) {
      pendingTable.innerHTML = '<tr><td colspan="2" style="padding: 8px; text-align: center; color: #64748b;">Belum ada pendaftar pending.</td></tr>';
    }

    const pBadge = document.getElementById('pending-badge');
    const tWarga = document.getElementById('total-warga-count');
    const detailsElem = document.getElementById('details-chat-admin');

    if (pBadge) pBadge.innerText = `${pendingCount} Pending`;
    if (tWarga) tWarga.innerText = totalCount;

    if (detailsElem) {
      if (pendingCount > 0) {
        detailsElem.open = true;
        if (pBadge) {
          pBadge.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
          pBadge.style.color = '#f87171';
          pBadge.style.borderColor = 'rgba(239, 68, 68, 0.4)';
        }
      } else {
        detailsElem.open = false;
        if (pBadge) {
          pBadge.style.backgroundColor = 'rgba(245, 158, 11, 0.2)';
          pBadge.style.color = '#fbbf24';
          pBadge.style.borderColor = 'rgba(245, 158, 11, 0.4)';
        }
      }
    }
  });
}

// Panggil otomatis saat dokumen selesai dimuat
document.addEventListener('DOMContentLoaded', () => {
  inisialisasiListenerUsersAdmin();
});

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
