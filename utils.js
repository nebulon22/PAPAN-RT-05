// utils.js - Kumpulan Variabel dan Fungsi Global RT 05 (Optimized & Complete)

const RT05_CONFIG = {
    // ⚠️ PASTI KAN URL INI ADALAH URL DEPLOYMENT APPS SCRIPT UTAMA TERBARU ANDA (/exec)
    GAS_WEB_APP_URL: "https://script.google.com/macros/s/AKfycbz5RqSEYxjwq_wr3ItVkLRexeGWjKLUtxmhVdqbm7kIFdngulFWdBCLU0xqBOichmMQuw/exec",
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

// ==========================================
// TAMBAHAN: MODUL OFFLINE QUEUE & SYNC (UNTUK JIMPITAN & PERKAKAS)
// ==========================================

// Fungsi universal untuk mengirim data, aman untuk mode online/offline
window.kirimDataAman = function(actionName, payloadData, callbackSelesai) {
    // Pastikan action terpasang di payload
    payloadData.action = actionName;

    // Jika perangkat offline, masukkan ke antrean localStorage
    if (!navigator.onLine) {
        let queue = JSON.parse(localStorage.getItem('rt05_offline_queue') || '[]');
        queue.push({
            timestamp: Date.now(),
            data: payloadData
        });
        localStorage.setItem('rt05_offline_queue', JSON.stringify(queue));
        
        console.warn(`[Offline Mode] Aksi '${actionName}' disimpan ke antrean lokal.`);
        alert("⚠️ Perangkat Anda sedang offline. Data berhasil disimpan secara lokal dan akan otomatis terkirim ke server begitu internet tersambung kembali.");
        
        if (callbackSelesai) callbackSelesai(true, "OFFLINE_QUEUED");
        return;
    }

    // Jika online, kirim langsung ke Google Apps Script
    const tokenAdmin = localStorage.getItem('adminToken') || '';
    payloadData.token = tokenAdmin;

    fetch(RT05_CONFIG.GAS_WEB_APP_URL, {
        method: 'POST',
        body: JSON.stringify(payloadData)
    })
    .then(response => response.text())
    .then(result => {
        console.log(`[Online Mode] Aksi '${actionName}' berhasil dikirim:`, result);
        if (callbackSelesai) callbackSelesai(false, result);
    })
    .catch(error => {
        console.error("Gagal mengirim data, mencadangkan ke antrean offline:", error);
        // Fallback jika fetch terputus di tengah jalan
        let queue = JSON.parse(localStorage.getItem('rt05_offline_queue') || '[]');
        queue.push({ timestamp: Date.now(), data: payloadData });
        localStorage.setItem('rt05_offline_queue', JSON.stringify(queue));
        
        if (callbackSelesai) callbackSelesai(true, error);
    });
};

// Listener otomatis untuk mengirim ulang data tertunda saat internet kembali pulih
window.addEventListener('online', () => {
    let queue = JSON.parse(localStorage.getItem('rt05_offline_queue') || '[]');
    if (queue.length === 0) return;

    console.log(`🔄 Internet tersambung kembali. Memproses ${queue.length} antrean data offline...`);
    processQueue(queue);
});

function processQueue(queue) {
    if (queue.length === 0) return;
    let item = queue.shift(); // Ambil data terlama di antrean

    fetch(RT05_CONFIG.GAS_WEB_APP_URL, {
        method: 'POST',
        body: JSON.stringify(item.data)
    })
    .then(res => res.text())
    .then(() => {
        // Perbarui antrean yang tersisa di localStorage
        localStorage.setItem('rt05_offline_queue', JSON.stringify(queue));
        // Lanjutkan sisa antrean berikutnya secara rekursif
        processQueue(queue);
    })
    .catch(err => {
        console.error("Gagal menyinkronkan antrean, mencoba lagi nanti:", err);
        // Kembalikan item ke barisan terdepan jika gagal
        queue.unshift(item);
        localStorage.setItem('rt05_offline_queue', JSON.stringify(queue));
    });
}
