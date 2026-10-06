// chat.js - Logika Terpusat Firebase Chat & Browser Notification
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, push, set, onValue, onDisconnect, serverTimestamp, query, limitToLast, get } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyCYbBVdgNRUw0BBiqMAoNgO0SPFhIhG2m8",
  authDomain: "papan05-21a56.firebaseapp.com",
  databaseURL: "https://papan05-21a56-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "papan05-21a56",
  storageBucket: "papan05-21a56.firebasestorage.app",
  messagingSenderId: "1068108426437",
  appId: "1:1068108426437:web:429a9b35b92d8622ab94ac"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let currentUser = JSON.parse(localStorage.getItem('rt05_chat_user')) || null;
let allUsersCache = {};
let activeTab = 'aktif';
let activeChatType = 'public';
let activePrivateUID = null;
let currentChatUnsubscribe = null;
let openPrivateRooms = JSON.parse(localStorage.getItem('rt05_open_private_rooms')) || {};
let unreadCounts = {};
let isChatVisible = true;

function getGasUrl() {
  return (typeof RT05_CONFIG !== 'undefined' && RT05_CONFIG.GAS_WEB_APP_URL) ? RT05_CONFIG.GAS_WEB_APP_URL : '';
}

// Minta izin Browser Notification
function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

// Tampilkan Notifikasi Sistem Browser saat Pesan Masuk & Layar/Tab Tertutup
function triggerBrowserNotification(sender, text) {
  if ('Notification' in window && Notification.permission === 'granted' && (document.hidden || !isChatVisible)) {
    try {
      const notif = new Notification(`Pesan Baru dari ${sender}`, {
        body: text,
        icon: 'kentongan-slit-drum.png',
        tag: 'rt05-chat-notif'
      });
      notif.onclick = function() {
        window.focus();
        notif.close();
      };
    } catch (e) {
      console.log("Notifikasi browser error:", e);
    }
  }
}

window.logoutUser = () => {
  if (confirm("Apakah kamu yakin ingin keluar dari akun ini?")) {
    if (currentUser && currentUser.uid) {
      set(ref(db, `users/${currentUser.uid}/state`), 'offline');
    }
    localStorage.removeItem('rt05_chat_user');
    currentUser = null;
    location.reload();
  }
};

window.addEventListener('DOMContentLoaded', () => {
  checkUserStatus();
  loadLoginUserOptions();
  requestNotificationPermission();

  const observer = new IntersectionObserver((entries) => {
    isChatVisible = entries[0].isIntersecting && !document.hidden;
    if (isChatVisible && activeChatType === 'private' && activePrivateUID) {
      unreadCounts[activePrivateUID] = 0;
      markRoomAsRead(activePrivateUID);
      renderPrivateTabsUI();
    }
  });
  observer.observe(document.body);
});

document.addEventListener('visibilitychange', () => {
  isChatVisible = !document.hidden;
  if (isChatVisible) {
    if (typeof firebase !== 'undefined' && firebase.database) {
      firebase.database().goOnline();
    }
    if (activeChatType === 'private' && activePrivateUID) {
      unreadCounts[activePrivateUID] = 0;
      markRoomAsRead(activePrivateUID);
      renderPrivateTabsUI();
    }
  }
});

window.openPrivateTab = (targetUID, targetName) => {
  if (targetUID === currentUser?.uid) return;
  openPrivateRooms[targetUID] = targetName;
  localStorage.setItem('rt05_open_private_rooms', JSON.stringify(openPrivateRooms));
  renderPrivateTabsUI();
  listenAllPrivateChats();
  switchChatRoom('private', targetUID);
};

function renderPrivateTabsUI() {
  const container = document.getElementById('dynamic-private-tabs');
  if (!container) return;
  container.innerHTML = '';

  Object.keys(openPrivateRooms).forEach(uid => {
    const name = openPrivateRooms[uid];
    const isActive = (activeChatType === 'private' && activePrivateUID === uid);
    const count = unreadCounts[uid] || 0;

    const badgeHTML = (count > 0 && !isActive) 
      ? `<span style="background: #ef4444; color: #ffffff; font-size: 10px; font-weight: 800; padding: 1px 6px; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; min-width: 16px; height: 16px; line-height: 1;">${count}</span>` 
      : '';

    const btn = document.createElement('div');
    btn.style.cssText = `
      display: flex; align-items: center; gap: 6px; padding: 5px 9px; border-radius: 6px;
      font-size: 11px; font-weight: 600; cursor: pointer; white-space: nowrap; transition: all 0.2s;
      background: ${isActive ? '#10b981' : '#1e293b'}; color: ${isActive ? '#fff' : '#94a3b8'};
      border: 1px solid ${isActive ? '#0388d1' : '#334155'}; flex-shrink: 0;
    `;

    btn.innerHTML = `
      <span onclick="event.stopPropagation(); switchChatRoom('private', '${uid}')" style="display: flex; align-items: center; gap: 5px;">
        <i class="fa-solid fa-user"></i> ${escapeHTML(name)} ${badgeHTML}
      </span>
      <i class="fa-solid fa-xmark" onclick="closePrivateTab(event, '${uid}')" style="font-size: 11px; color: #f87171; padding: 2px; margin-left: 2px;" title="Tutup Tab"></i>
    `;
    container.appendChild(btn);
  });
}

function markRoomAsRead(targetUID) {
  const roomID = [currentUser.uid, targetUID].sort().join('_');
  const roomRef = query(ref(db, `private_chats/${roomID}`), limitToLast(1));
  get(roomRef).then((snapshot) => {
    if (snapshot.exists()) {
      let lastKey = null;
      snapshot.forEach(child => { lastKey = child.key; });
      if (lastKey) {
        const lastReadKeyMap = JSON.parse(localStorage.getItem('rt05_chat_last_read_key')) || {};
        lastReadKeyMap[targetUID] = lastKey;
        localStorage.setItem('rt05_chat_last_read_key', JSON.stringify(lastReadKeyMap));
      }
    }
  });
}

window.switchChatRoom = (type, targetUID = null) => {
  activeChatType = type;
  activePrivateUID = targetUID;
  isChatVisible = true;

  const chatContainer = document.getElementById('chat-container');
  if (chatContainer) {
    chatContainer.style.background = (type === 'public') ? 'rgba(2, 6, 23, 0.3)' : 'rgba(0, 0, 0, 0.1)';
  }

  if (type === 'public') {
    updatePublicTabBadge(0);
    markPublicGroupAsRead();
  } else if (type === 'private' && targetUID) {
    unreadCounts[targetUID] = 0;
    markRoomAsRead(targetUID);
  }

  if (currentChatUnsubscribe) {
    currentChatUnsubscribe();
    currentChatUnsubscribe = null;
  }

  const btnPublic = document.getElementById('tab-room-public');
  if (btnPublic) {
    btnPublic.style.background = (type === 'public') ? '#0288d1' : '#1e293b';
    btnPublic.style.color = (type === 'public') ? '#fff' : '#94a3b8';
  }

  renderPrivateTabsUI();

  const chatStream = document.getElementById('chat-stream');
  if (chatStream) {
    chatStream.innerHTML = '<div style="text-align: center; padding: 16px; font-size: 11px; color: #64748b; font-style: italic;"><i class="fa-solid fa-circle-notch fa-spin"></i> Memuat percakapan...</div>';
  }

  if (type === 'public') {
    loadChatStream();
  } else if (type === 'private' && targetUID) {
    loadPrivateChatStream(targetUID);
  }
};

window.closePrivateTab = (e, targetUID) => {
  if (e) e.stopPropagation();
  markRoomAsRead(targetUID);
  unreadCounts[targetUID] = 0;
  delete openPrivateRooms[targetUID];
  localStorage.setItem('rt05_open_private_rooms', JSON.stringify(openPrivateRooms));
  if (activeChatType === 'private' && activePrivateUID === targetUID) {
    switchChatRoom('public');
  } else {
    renderPrivateTabsUI();
  }
};

let isInitialPrivateChatLoaded = {};

function loadPrivateChatStream(targetUID) {
  const roomID = [currentUser.uid, targetUID].sort().join('_');
  const privateRef = query(ref(db, `private_chats/${roomID}`), limitToLast(80));
  const chatStream = document.getElementById('chat-stream');

  currentChatUnsubscribe = onValue(privateRef, (snapshot) => {
    if (!chatStream) return;
    if (activeChatType !== 'private' || activePrivateUID !== targetUID) return;
    chatStream.innerHTML = '';

    if (!snapshot.exists()) {
      chatStream.innerHTML = `<div style="text-align: center; color: #64748b; font-size: 11px; padding: 12px;">Belum ada pesan pribadi dengan ${escapeHTML(openPrivateRooms[targetUID] || 'Warga')}.</div>`;
      isInitialPrivateChatLoaded[targetUID] = true;
      return;
    }

    const lastReadKeyMap = JSON.parse(localStorage.getItem('rt05_chat_last_read_key')) || {};
    const lastReadKey = lastReadKeyMap[targetUID];
    let isUnreadSection = !lastReadKey;

    snapshot.forEach((childSnap) => {
      const msgKey = childSnap.key;
      const msgData = childSnap.val();
      let isUnreadMsg = (isUnreadSection && msgData.uid !== currentUser?.uid && isInitialPrivateChatLoaded[targetUID]);
      if (msgKey === lastReadKey) isUnreadSection = true;
      renderSingleMessage(msgData, isUnreadMsg, msgKey);
    });

    isInitialPrivateChatLoaded[targetUID] = true;
    requestAnimationFrame(() => { chatStream.scrollTop = chatStream.scrollHeight; });
    if (isChatVisible) markRoomAsRead(targetUID);
  });
}

let globalPrivateListener = null;

function listenAllPrivateChats() {
  if (!currentUser?.uid) return;
  if (globalPrivateListener) {
    globalPrivateListener();
    globalPrivateListener = null;
  }

  const allPrivateRef = ref(db, 'private_chats');
  let isFirstLoad = true;

  globalPrivateListener = onValue(allPrivateRef, (snapshot) => {
    if (!snapshot.exists()) {
      isFirstLoad = false;
      sendTotalUnreadToParent();
      return;
    }

    const lastReadKeyMap = JSON.parse(localStorage.getItem('rt05_chat_last_read_key')) || {};

    snapshot.forEach((roomSnap) => {
      const roomID = roomSnap.key;
      if (roomID.includes(currentUser.uid)) {
        const parts = roomID.split('_');
        const targetUID = parts[0] === currentUser.uid ? parts[1] : parts[0];

        let unreadTotalCount = 0;
        let lastMsg = null;
        const lastReadKey = lastReadKeyMap[targetUID];
        let countAfterKey = !lastReadKey;

        roomSnap.forEach((msgSnap) => {
          const msgKey = msgSnap.key;
          const msgData = msgSnap.val();
          lastMsg = msgData;

          if (msgKey === lastReadKey) {
            countAfterKey = true;
            unreadTotalCount = 0;
          } else if (countAfterKey && msgData.uid !== currentUser.uid) {
            unreadTotalCount++;
          }
        });

        if (lastMsg && lastMsg.uid === currentUser.uid) unreadTotalCount = 0;

        if (unreadTotalCount > 0) {
          const senderName = (allUsersCache[targetUID]?.username || allUsersCache[targetUID]?.nama) || lastMsg?.sender || "Warga";
          if (!openPrivateRooms[targetUID]) {
            const keys = Object.keys(openPrivateRooms);
            if (keys.length >= 5) delete openPrivateRooms[keys[0]];
            openPrivateRooms[targetUID] = senderName;
            localStorage.setItem('rt05_open_private_rooms', JSON.stringify(openPrivateRooms));
          }

          if (activeChatType !== 'private' || activePrivateUID !== targetUID || !isChatVisible) {
            unreadCounts[targetUID] = unreadTotalCount;
            if (!isFirstLoad && lastMsg && lastMsg.uid !== currentUser.uid) {
              playKlingSound();
              triggerBrowserNotification(senderName, lastMsg.text);
            }
          }
        } else {
          unreadCounts[targetUID] = 0;
        }
      }
    });

    renderPrivateTabsUI();
    sendTotalUnreadToParent();
    isFirstLoad = false;
  });
}

function executeSendMessage(e) {
  if (e) { e.preventDefault(); e.stopPropagation(); }
  const input = document.getElementById('chat-input');
  if (!input) return;
  const text = input.value.trim();
  if (!text || currentUser?.status !== 'aktif') return;

  input.value = '';
  input.focus();

  if (activeChatType === 'public') {
    const newMsgRef = push(ref(db, 'chats'));
    const newKey = newMsgRef.key;
    const lastReadPublicMap = JSON.parse(localStorage.getItem('rt05_chat_last_read_public_key')) || {};
    lastReadPublicMap[currentUser.uid] = newKey;
    localStorage.setItem('rt05_chat_last_read_public_key', JSON.stringify(lastReadPublicMap));

    set(newMsgRef, {
      uid: currentUser.uid,
      sender: currentUser.username || currentUser.nama,
      role: currentUser.role || 'warga',
      text: text,
      timestamp: serverTimestamp()
    });
  } else if (activeChatType === 'private' && activePrivateUID) {
    const roomID = [currentUser.uid, activePrivateUID].sort().join('_');
    const newMsgRef = push(ref(db, `private_chats/${roomID}`));
    const newKey = newMsgRef.key;

    set(newMsgRef, {
      uid: currentUser.uid,
      sender: currentUser.username || currentUser.nama,
      role: currentUser.role || 'warga',
      text: text,
      timestamp: serverTimestamp()
    }).then(() => {
      const lastReadKeyMap = JSON.parse(localStorage.getItem('rt05_chat_last_read_key')) || {};
      lastReadKeyMap[activePrivateUID] = newKey;
      localStorage.setItem('rt05_chat_last_read_key', JSON.stringify(lastReadKeyMap));
    });
  }
}
window.sendChatMessage = executeSendMessage;

let publicGroupListener = null;
let isFirstPublicLoad = true;

function listenPublicGroupUnread() {
  if (!currentUser?.uid || currentUser.status !== 'aktif') return;
  if (publicGroupListener) {
    publicGroupListener();
    publicGroupListener = null;
  }

  const chatsRef = query(ref(db, 'chats'), limitToLast(80));

  publicGroupListener = onValue(chatsRef, (snapshot) => {
    if (!snapshot.exists()) {
      updatePublicTabBadge(0);
      sendUnreadCountToParent(0);
      isFirstPublicLoad = false;
      return;
    }

    const lastReadPublicMap = JSON.parse(localStorage.getItem('rt05_chat_last_read_public_key')) || {};
    const lastReadPublicMapKey = lastReadPublicMap[currentUser.uid];

    let unreadPublicCount = 0;
    let lastMsg = null;
    let countAfterKey = !lastReadPublicMapKey;

    snapshot.forEach((msgSnap) => {
      const msgKey = msgSnap.key;
      const msgData = msgSnap.val();
      lastMsg = msgData;

      if (msgKey === lastReadPublicMapKey) {
        countAfterKey = true;
        unreadPublicCount = 0;
      } else if (countAfterKey && msgData.uid !== currentUser.uid) {
        unreadPublicCount++;
      }
    });

    if (lastMsg && lastMsg.uid === currentUser.uid) unreadPublicCount = 0;

    if (!isFirstPublicLoad && unreadPublicCount > 0 && lastMsg && lastMsg.uid !== currentUser.uid) {
      if (activeChatType !== 'public' || !isChatVisible) {
        triggerBrowserNotification(`Grup RT 05 (${lastMsg.sender})`, lastMsg.text);
      }
    }

    updatePublicTabBadge(activeChatType === 'private' ? unreadPublicCount : 0);
    sendUnreadCountToParent(unreadPublicCount);
    isFirstPublicLoad = false;
  });
}

function updatePublicTabBadge(count) {
  const tabBadge = document.getElementById('badge-public-tab');
  if (tabBadge) {
    if (count > 0) {
      tabBadge.innerText = count > 99 ? '99+' : count;
      tabBadge.style.display = 'inline-flex';
    } else {
      tabBadge.style.display = 'none';
    }
  }
}

window.markPublicGroupAsRead = () => {
  if (!currentUser?.uid) return;
  const chatsRef = query(ref(db, 'chats'), limitToLast(1));
  get(chatsRef).then((snapshot) => {
    if (snapshot.exists()) {
      let lastKey = null;
      snapshot.forEach(child => { lastKey = child.key; });
      if (lastKey) {
        const lastReadPublicMap = JSON.parse(localStorage.getItem('rt05_chat_last_read_public_key')) || {};
        lastReadPublicMap[currentUser.uid] = lastKey;
        localStorage.setItem('rt05_chat_last_read_public_key', JSON.stringify(lastReadPublicMap));
      }
    }
  });
  updatePublicTabBadge(0);
  sendUnreadCountToParent(0);
};

let lastPublicUnreadCount = 0;

function sendTotalUnreadToParent() {
  window.parent.postMessage({
    type: 'RT05_CHAT_UNREAD_UPDATE',
    unreadPublicCount: lastPublicUnreadCount
  }, '*');
}

function sendUnreadCountToParent(count) {
  lastPublicUnreadCount = count || 0;
  sendTotalUnreadToParent();
}

function setupPresence() {
  if (!currentUser || !currentUser.uid) return;
  const userStateRef = ref(db, `users/${currentUser.uid}/state`);
  const connectedRef = ref(db, '.info/connected');

  onValue(connectedRef, (snap) => {
    if (snap.val() === true) {
      onDisconnect(userStateRef).set('offline').then(() => {
        set(userStateRef, 'online');
      });
    }
  });
}

let audioCtx = null;
function playKlingSound() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.setValueAtTime(659.25, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.35);
  } catch (e) {}
}

function loadUsersList() {
  const usersRef = ref(db, 'users');
  onValue(usersRef, (snapshot) => {
    if (!snapshot.exists()) return;
    allUsersCache = snapshot.val();
    renderWargaSidebar();
  });
}

function checkUserStatus() {
  const chatContainer = document.getElementById('chat-container');
  const chatFooter = document.querySelector('footer');
  const regModal = document.getElementById('reg-modal');
  const pendingModal = document.getElementById('pending-modal');

  if (!currentUser) {
    if (chatContainer) chatContainer.classList.add('hidden');
    if (chatFooter) chatFooter.classList.add('hidden');
    if (regModal) regModal.classList.remove('hidden');
    return;
  }

  const userRef = ref(db, `users/${currentUser.uid}`);
  onValue(userRef, (snapshot) => {
    const val = snapshot.val();
    if (!val) {
      localStorage.removeItem('rt05_chat_user');
      location.reload();
      return;
    }

    currentUser.status = val.status;
    currentUser.role = val.role || 'warga';
    currentUser.username = val.username || val.nama;
    localStorage.setItem('rt05_chat_user', JSON.stringify(currentUser));

    if (val.status === 'pending') {
      if (pendingModal) pendingModal.classList.remove('hidden');
      if (regModal) regModal.classList.add('hidden');
    } else if (val.status === 'aktif') {
      if (pendingModal) pendingModal.classList.add('hidden');
      if (regModal) regModal.classList.add('hidden');
      if (chatContainer) chatContainer.classList.remove('hidden');
      if (chatFooter) chatFooter.classList.remove('hidden');

      const userInfo = document.getElementById('user-info-text');
      if (userInfo) userInfo.innerText = `${currentUser.username} • ${val.hunian}`;
      const labelUserKetik = document.getElementById('chat-current-user-label');
      if (labelUserKetik) labelUserKetik.innerText = `${currentUser.username || val.nama}:`;

      setupPresence();
      loadUsersList();
      renderPrivateTabsUI();
      listenAllPrivateChats();
      listenPublicGroupUnread();
      activeChatType = 'public';
      loadChatStream();
    }
  });
}

window.toggleAuthMode = (mode) => {
  const secReg = document.getElementById('section-register');
  const secLog = document.getElementById('section-login');
  if (mode === 'login') {
    secReg.style.display = 'none';
    secLog.style.display = 'block';
  } else {
    secLog.style.display = 'none';
    secReg.style.display = 'block';
  }
};

function loadLoginUserOptions() {
  const usersRef = ref(db, 'users');
  get(usersRef).then((snapshot) => {
    const select = document.getElementById('login-user-select');
    if (!select) return;
    select.innerHTML = '<option value="">-- Pilih Akun Kamu --</option>';
    if (snapshot.exists()) {
      snapshot.forEach((childSnap) => {
        const u = childSnap.val();
        if (u.status === 'aktif') {
          const opt = document.createElement('option');
          opt.value = u.uid;
          opt.innerText = `${u.nama} (${u.hunian})`;
          select.appendChild(opt);
        }
      });
    }
  });
}

window.handleLogin = (e) => {
  e.preventDefault();
  const uid = document.getElementById('login-user-select').value;
  const inputPin = document.getElementById('login-pin').value.trim();
  if (!uid || !inputPin) return;

  const userRef = ref(db, `users/${uid}`);
  get(userRef).then((snap) => {
    if (snap.exists()) {
      const val = snap.val();
      if (String(val.pin) !== String(inputPin)) {
        alert("❌ PIN Rahasia Salah!");
        return;
      }
      currentUser = { uid: val.uid, nama: val.nama, username: val.username || val.nama, hunian: val.hunian, role: val.role || 'warga', status: val.status };
      localStorage.setItem('rt05_chat_user', JSON.stringify(currentUser));
      checkUserStatus();
    }
  });
};

window.handleRegistration = (e) => {
  e.preventDefault();
  const nama = document.getElementById('reg-nama').value.trim();
  const hunian = document.getElementById('reg-hunian').value.trim();
  const pin = document.getElementById('reg-pin').value.trim();
  if (!nama || !hunian || !pin) return;

  const uid = 'USR-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4);
  const userData = { uid, nama, username: nama, hunian, pin, role: 'warga', status: 'pending', state: 'offline', registeredAt: serverTimestamp() };

  set(ref(db, `users/${uid}`), userData).then(() => {
    localStorage.setItem('rt05_chat_user', JSON.stringify(userData));
    currentUser = userData;
    checkUserStatus();
  });
};

let isInitialPublicChatLoaded = false;
function loadChatStream() {
  const chatRef = query(ref(db, 'chats'), limitToLast(80));
  const chatStream = document.getElementById('chat-stream');

  currentChatUnsubscribe = onValue(chatRef, (snapshot) => {
    if (activeChatType !== 'public' || !chatStream) return;
    chatStream.innerHTML = '';

    if (!snapshot.exists()) {
      chatStream.innerHTML = '<div style="text-align: center; color: #64748b; font-size: 11px; padding: 10px;">Belum ada obrolan.</div>';
      isInitialPublicChatLoaded = true;
      return;
    }

    const lastReadPublicMap = JSON.parse(localStorage.getItem('rt05_chat_last_read_public_key')) || {};
    const lastReadPublicMapKey = lastReadPublicMap[currentUser?.uid];
    let isUnreadSection = !lastReadPublicMapKey;

    snapshot.forEach((childSnap) => {
      const msgKey = childSnap.key;
      const msgData = childSnap.val();
      let isUnreadMsg = (isUnreadSection && msgData.uid !== currentUser?.uid && isInitialPublicChatLoaded);
      if (msgKey === lastReadPublicMapKey) isUnreadSection = true;
      renderSingleMessage(msgData, isUnreadMsg, msgKey);
    });

    isInitialPublicChatLoaded = true;
    chatStream.scrollTop = chatStream.scrollHeight;
  });
}

function renderSingleMessage(msg, isUnread = false, msgKey = '') {
  const chatStream = document.getElementById('chat-stream');
  if (!chatStream) return;

  const div = document.createElement('div');
  div.className = "msg-row";
  if (msgKey) div.setAttribute('data-msg-id', msgKey);

  if (isUnread) {
    div.style.backgroundColor = "rgba(255, 255, 255, 0.15)";
    div.style.borderLeft = "3px solid #38bdf8";
    div.style.paddingLeft = "8px";
  }

  let nameClass = "role-user";
  let textClass = "msg-text";

  if (msg.role === 'admin') {
    nameClass = "role-admin";
    textClass = "msg-text msg-text-admin";
  } else if (activeChatType === 'private') {
    if (msg.uid === currentUser?.uid) {
      nameClass = "role-self";
      textClass = "msg-text msg-text-self";
    } else {
      nameClass = "role-user";
      textClass = "msg-text msg-text-other";
    }
  } else if (msg.uid === currentUser?.uid) {
    nameClass = "role-self";
  }

  const clickHandler = (msg.uid !== currentUser?.uid) 
    ? `onclick="openPrivateTab('${msg.uid}', '${escapeHTML(msg.sender)}')" style="cursor:pointer;" title="Kirim Pesan Pribadi"` 
    : '';

  div.innerHTML = `<span class="${nameClass}" ${clickHandler}>${escapeHTML(msg.sender)}:</span> <span class="${textClass}">${escapeHTML(msg.text)}</span>`;
  chatStream.appendChild(div);
}

window.renderWargaSidebar = () => {
  const listContainer = document.getElementById('warga-list');
  if (!listContainer) return;
  listContainer.innerHTML = '';

  let activeCount = 0;
  let totalCount = 0;

  Object.values(allUsersCache).forEach(u => {
    if (u.status !== 'aktif') return;
    totalCount++;
    const isOnline = u.state === 'online';
    if (isOnline || u.state === 'idle') activeCount++;

    if (activeTab === 'aktif' && !(isOnline || u.state === 'idle')) return;

    let dotClass = isOnline ? "dot-online" : (u.state === 'idle' ? "dot-idle" : "dot-offline");
    let roleBadge = (u.role === 'admin') ? '<span class="badge-admin">ADMIN</span>' : '';

    const item = document.createElement('div');
    item.className = "warga-item";
    item.innerHTML = `
      <div style="display: flex; align-items: center; gap: 6px; overflow: hidden;">
        <span class="status-dot ${dotClass}"></span>
        <div style="overflow: hidden;">
          <div style="color: #e2e8f0; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHTML(u.username || u.nama)} ${roleBadge}</div>
          <div style="font-size: 9px; color: #64748b;">${escapeHTML(u.hunian)}</div>
        </div>
      </div>
    `;
    item.onclick = () => { if (u.uid !== currentUser?.uid) openPrivateTab(u.uid, u.username || u.nama); };
    item.style.cursor = u.uid !== currentUser?.uid ? 'pointer' : 'default';
    listContainer.appendChild(item);
  });

  const countAktif = document.getElementById('count-aktif');
  const countSemua = document.getElementById('count-semua');
  const countBadge = document.getElementById('online-count-badge');
  if (countAktif) countAktif.innerText = activeCount;
  if (countSemua) countSemua.innerText = totalCount;
  if (countBadge) countBadge.innerText = activeCount;
};

window.switchTab = (tab) => {
  activeTab = tab;
  renderWargaSidebar();
};

window.openChangeNameModal = () => {
  const input = document.getElementById('new-username-input');
  const modal = document.getElementById('changename-modal');
  if (input) input.value = currentUser?.username || currentUser?.nama || '';
  if (modal) modal.classList.remove('hidden');
};

window.closeChangeNameModal = () => {
  const modal = document.getElementById('changename-modal');
  if (modal) modal.classList.add('hidden');
};

window.saveNewUsername = () => {
  const input = document.getElementById('new-username-input');
  if (!input) return;
  const newName = input.value.trim();
  if (!newName) return;
  set(ref(db, `users/${currentUser.uid}/username`), newName).then(() => {
    currentUser.username = newName;
    localStorage.setItem('rt05_chat_user', JSON.stringify(currentUser));
    closeChangeNameModal();
  });
};

window.toggleSidebar = () => {
  const sidebar = document.getElementById('sidebar-warga');
  if (sidebar) sidebar.classList.toggle('hidden');
};

function escapeHTML(str) {
  return str ? str.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)) : '';
}
