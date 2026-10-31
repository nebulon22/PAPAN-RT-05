// utils.js - Kumpulan Konfigurasi, Firebase Global, & Fungsi Pendukung RT 05 (Versi Klasik / Tanpa Module)

const RT05_CONFIG = {
    GAS_WEB_APP_URL: "https://script.google.com/macros/s/AKfycbz5RqSEYxjwq_wr3ItVkLRexeGWjKLUtxmhVdqbm7kIFdngulFWdBCLU0xqBOichmMQuw/exec",
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
// INISIALISASI FIREBASE KLASIK (GLOBAL)
// ==========================================
let dbRT05 = null;
if (typeof firebase !== 'undefined') {
    if (!firebase.apps.length) {
        firebase.initializeApp(RT05_CONFIG.FIREBASE);
    }
    dbRT05 = firebase.database();
}

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

// Fungsi Pencarian Universal (bisa untuk warga, inventaris, dll)
function cariLokasi(keyword, daftarData, callbackHasil) {
    if (!keyword || !daftarData) {
        if (callbackHasil) callbackHasil([]);
        return [];
    }
    const query = keyword.toLowerCase().trim();
    const hasil = daftarData.filter(item => {
        const nama = (item.nama || item.namaWarga || item.namaBarang || '').toLowerCase();
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

// Format Tanggal Indonesia
function formatTanggalIndo(tanggalInput) {
    if (!tanggalInput) return "-";
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    const date = new Date(tanggalInput);
    if (isNaN(date.getTime())) return tanggalInput;
    return date.toLocaleDateString('id-ID', options);
}

// Toast Notification Melayang
function tampilkanToast(pesan, tipe = 'sukses') {
    let container = document.getElementById('toast-container-rt05');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container-rt05';
        container.style.cssText = 'position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); z-index: 9999; display: flex; flex-direction: column; gap: 8px; align-items: center; pointer-events: none;';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    const bg = tipe === 'error' ? '#ef4444' : (tipe === 'warning' ? '#f59e0b' : '#10b981');
    toast.style.cssText = `background: ${bg}; color: white; padding: 10px 20px; border-radius: 30px; font-size: 13px; font-weight: bold; box-shadow: 0 4px 12px rgba(0,0,0,0.15); opacity: 0; transition: opacity 0.3s ease, transform 0.3s ease; transform: translateY(10px); pointer-events: auto;`;
    toast.innerText = pesan;

    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '1'; toast.style.transform = 'translateY(0)'; }, 10);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
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

// ==========================================
// PENGELOLA MODAL INVENTARIS GLOBAL
// ==========================================
function bukaModalInventaris() {
    const modal = document.getElementById('modal-inventaris');
    if (modal) modal.style.display = 'flex';
}

function tutupModalInventaris() {
    const modal = document.getElementById('modal-inventaris');
    if (modal) modal.style.display = 'none';
}




// ==========================================
// DAFTARKAN KE GLOBAL WINDOW
// ==========================================
window.RT05_CONFIG = RT05_CONFIG;
window.dbRT05 = dbRT05;
window.perbaikiKoordinat = perbaikiKoordinat;
window.escapeHTML = escapeHTML;
window.cariLokasi = cariLokasi;
window.getIkonKategori = getIkonKategori;
window.formatTanggalIndo = formatTanggalIndo;
window.tampilkanToast = tampilkanToast;
window.bukaModalInventaris = bukaModalInventaris;
window.tutupModalInventaris = tutupModalInventaris;

window.dispatchEvent(new Event('utilsSiap'));
