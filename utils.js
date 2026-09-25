// utils.js - Kumpulan Variabel dan Fungsi Global RT 05 (Optimized & Complete)

const RT05_CONFIG = {
    // Ganti URL ini jika script GAS Anda diperbarui
    GAS_WEB_APP_URL: "https://script.google.com/macros/s/AKfycbwfw0-V4hiZNnqwmDCLQMhOhZgWKpuGhDh1Rasb7PlswuJtNOqyHJJwSWFdpvIo7ET7aw/exec",
    SHEET_ID: "1zk_ZhczenW5-sZ7B_jvLpzAXEKeyJcxHCTd_qiqbW3Y",
    
    // Konfigurasi Firebase (Dipakai di admin.html & chat.html)
    FIREBASE: {
        apiKey: "AIzaSyCYbBVdgNRUw0BBiqMAoNgO0SPFhIhG2m8",
        authDomain: "papan05-21a56.firebaseapp.com",
        databaseURL: "https://papan05-21a56-default-rtdb.asia-southeast1.firebasedatabase.app",
        projectId: "papan05-21a56",
        storageBucket: "papan05-21a56.firebasestorage.app",
        messagingSenderId: "1068108426437",
        appId: "1:1068108426437:web:429a9b35b92d8622ab94ac"
    },
    
    // Batas Wilayah Peta (Dipakai di index.html & admin.html)
    BATAS_WILAYAH: [
        [-7.7441031, 110.3835], [-7.7447197, 110.3852273], [-7.743848, 110.3854633],
        [-7.7440818, 110.3861822], [-7.742955, 110.3864933], [-7.7428593, 110.3858925],
        [-7.7407331, 110.3866972], [-7.7404886, 110.3861929], [-7.740563, 110.3848089],
        [-7.7399995, 110.3831674], [-7.740159, 110.382234], [-7.7414879, 110.3818906],
        [-7.7421789, 110.3819979], [-7.7428699, 110.3838755], [-7.7441031, 110.3835]
    ]
};

// ==========================================
// PENGAMBILAN DATA GOOGLE SHEETS SUPER CEPAT & OFFLINE-READY (JSON / TEXT)
// ==========================================
async function ambilDataSheets(urlCacheKey, targetUrl, callbackRender) {
    const cachedString = localStorage.getItem(urlCacheKey);
    
    // 1. Tampilkan data dari cache lokal secara instan (0 detik) jika ada
    if (cachedString) {
        try {
            const parsedData = cachedString.trim().startsWith('{') || cachedString.trim().startsWith('[') 
                ? JSON.parse(cachedString) 
                : parseCSV(cachedString);
            
            callbackRender(parsedData, true); // true = data bersumber dari cache lokal
        } catch (e) {
            console.error("Gagal membaca cache lokal:", e);
        }
    }

    // 2. Jika perangkat offline, hentikan proses jaringan
    if (!navigator.onLine) {
        return;
    }

    // 3. Ambil data terbaru di latar belakang (Background Sync)
    try {
        const response = await fetch(targetUrl);
        const contentType = response.headers.get("content-type");
        
        let finalData;
        let rawCacheContent;

        // Cek apakah respons dari server berformat JSON
        if (contentType && contentType.includes("application/json")) {
            finalData = await response.json();
            rawCacheContent = JSON.stringify(finalData);
        } else {
            const textData = await response.text();
            rawCacheContent = textData;
            finalData = parseCSV(textData);
        }
        
        // Simpan data terbaru ke localStorage untuk mode offline berikutnya
        localStorage.setItem(urlCacheKey, rawCacheContent);
        
        // Update tampilan dengan data segar dari server
        callbackRender(finalData, false); // false = data baru dari web/server
    } catch (err) {
        console.warn("Jaringan bermasalah, tetap menggunakan data cadangan lokal:", err);
    }
}

// Fungsi Parsing CSV yang Dioptimalkan (Cepat & Minim Alokasi Memori)
function parseCSV(text) {
    if (!text) return [];
    var lines = text.replace(/\r/g, '').split('\n');
    var result = [];
    
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim();
        if (!line) continue;
        var row = []; var inQuotes = false; var cur = '';
        var len = line.length;
        
        for (var c = 0; c < len; c++) {
            var char = line[c];
            if (char === '"') inQuotes = !inQuotes;
            else if (char === ',' && !inQuotes) { 
                row.push(cur.trim().replace(/^"|"$/g, '')); 
                cur = ''; 
            } else {
                cur += char;
            }
        }
        row.push(cur.trim().replace(/^"|"$/g, ''));
        result.push(row);
    }
    return result;
}

// Fungsi Normalisasi Koordinat (Ringan & Cepat)
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

// Fungsi Pengaman Text (Mencegah XSS/Error rendering html)
function escapeHTML(str) {
    return str ? String(str).replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)) : '';
}

// Fungsi Penentuan Gaya & Ikon Pin Peta (Menggunakan percabangan ringkas)
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
    else if (kategoriManual.includes('kost') || kategoriManual.includes('kos') || namaUpper.includes('KOST') || namaUpper.includes('KOS') || namaUpper.includes('KONTRAKAN') || namaUpper.includes('WISMA')) {
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


let mediaStreamSenter = null;
let isSenterAktif = false;

window.toggleSenterRonda = async function() {
  const btn = document.getElementById('btn-senter-ronda');
  const icon = document.getElementById('icon-senter-ronda');
  const status = document.getElementById('status-senter-ronda');

  try {
    if (!isSenterAktif) {
      // Nyalakan Senter
      mediaStreamSenter = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', advanced: [{ torch: true }] }
      });
      isSenterAktif = true;

      if (btn) {
        btn.style.background = '#fbbf24'; // Background Kuning
        btn.style.color = '#0f172a';      // Teks Hitam
        btn.style.borderColor = '#f59e0b';
      }
      if (icon) {
        icon.style.color = '#0f172a';      // Ikon Bohlam Hitam di atas background Kuning
      }
      if (status) status.innerText = 'ON';

    } else {
      // Matikan Senter
      if (mediaStreamSenter) {
        mediaStreamSenter.getTracks().forEach(track => track.stop());
        mediaStreamSenter = null;
      }
      isSenterAktif = false;

      if (btn) {
        btn.style.background = '#1e293b'; // Background Gelap
        btn.style.color = '#fbbf24';      // Teks Kuning
        btn.style.borderColor = '#334155';
      }
      if (icon) {
        icon.className = 'fa-solid fa-lightbulb'; // Tetap pertahankan class ikon bohlam
        icon.style.color = '#fbbf24';              // Ikon Bohlam Kuning Emas
      }
      if (status) status.innerText = 'OFF';
    }
  } catch (err) {
    alert("❌ Fitur senter tidak didukung di browser HP ini atau izin kamera belum diberikan.");
    isSenterAktif = false;
    if (status) status.innerText = 'OFF';
  }
};
