// utils.js - Kumpulan Variabel dan Fungsi Global RT 05 (Full Firebase)

export const RT05_CONFIG = {
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
// INISIALISASI FIREBASE SDK
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, get, child, push, set, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const app = initializeApp(RT05_CONFIG.FIREBASE);
export const db = getDatabase(app);

// EXPORT Firebase methods yang dibutuhkan file lain
export { ref, get, child, push, set, onValue };

// ==========================================
// FUNGSI UTILITY PENDUKUNG
// ==========================================

export function perbaikiKoordinat(val) {
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

export function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str).replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
}

export function getIkonKategori(namaAsli, kategoriManual) {
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

// Fitur Senter Ronda
let mediaStreamSenter = null;
let isSenterAktif = false;

// TETAP gunakan window untuk fungsi yang dipanggil langsung dari tombol HTML (onclick="toggleSenterRonda()")
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

      if (btn) {
        btn.style.background = '#fbbf24';
        btn.style.color = '#0f172a';
        btn.style.borderColor = '#f59e0b';
      }
      if (icon) {
        icon.style.color = '#0f172a';
      }
      if (status) status.innerText = 'ON';

    } else {
      if (mediaStreamSenter) {
        mediaStreamSenter.getTracks().forEach(track => track.stop());
        mediaStreamSenter = null;
      }
      isSenterAktif = false;

      if (btn) {
        btn.style.background = '#1e293b';
        btn.style.color = '#fbbf24';
        btn.style.borderColor = '#334155';
      }
      if (icon) {
        icon.className = 'fa-solid fa-lightbulb';
        icon.style.color = '#fbbf24';
      }
      if (status) status.innerText = 'OFF';
    }
  } catch (err) {
    alert("❌ Fitur senter tidak didukung di browser HP ini atau izin kamera belum diberikan.");
    isSenterAktif = false;
    if (status) status.innerText = 'OFF';
  }
};
