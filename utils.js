// utils.js - Kumpulan Variabel dan Fungsi Global RT 05 (Optimized & Complete)


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
            
            callbackRender(parsedData, true); // true = bersumber dari cache
        } catch (e) {
            console.error("Gagal membaca cache lokal:", e);
        }
    }

    // 2. Jika perangkat offline, hentikan proses jaringan
    if (!navigator.onLine) {
        return;
    }

    // PERBAIKAN: Dialihkan secara aman ke Web App Backend (GAS)
    let fetchUrl = targetUrl;
    const tokenAdmin = localStorage.getItem('adminToken') || '';
    
    if (targetUrl && targetUrl.includes("docs.google.com/spreadsheets") && targetUrl.includes("/export?format=csv")) {
        let matchGid = targetUrl.match(/gid=([0-9]+)/);
        let gid = matchGid ? matchGid[1] : null;
        
        if (gid) {
            fetchUrl = `${RT05_CONFIG.GAS_WEB_APP_URL}?action=getSheetByGid&gid=${gid}&token=${encodeURIComponent(tokenAdmin)}`;
        } else {
            fetchUrl = `${RT05_CONFIG.GAS_WEB_APP_URL}?action=getPeta&token=${encodeURIComponent(tokenAdmin)}`;
        }
    }

    // 3. Ambil data terbaru di latar belakang (Background Sync)
    try {
        const response = await fetch(fetchUrl);
        
        if (!response.ok) {
            throw new Error(`HTTP Error Status: ${response.status}`);
        }

        const contentType = response.headers.get("content-type");
        let finalData;
        let rawCacheContent;

        if (contentType && contentType.includes("application/json")) {
            finalData = await response.json();
            rawCacheContent = JSON.stringify(finalData);
        } else {
            const textData = await response.text();
            rawCacheContent = textData;
            finalData = parseCSV(textData);
        }
        
        localStorage.setItem(urlCacheKey, rawCacheContent);
        callbackRender(finalData, false); // false = data segar dari server
    } catch (err) {
        console.warn("Jaringan bermasalah, tetap menggunakan data cadangan lokal:", err);
    }
}

// Fungsi Parsing CSV yang Dioptimalkan
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

// Fungsi Normalisasi Koordinat
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

// Fungsi Pengaman Text (Universal & Safe)
function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str).replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
}

// Fungsi Penentuan Gaya & Ikon Pin Peta
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

