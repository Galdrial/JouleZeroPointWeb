<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted } from 'vue';
import axios from 'axios';

interface FriendConnection {
  id: string;
  user1: string;
  user2: string;
  status: 'pending' | 'accepted';
}

interface Message {
  id: string;
  from: string;
  to: string;
  content: string;
  timestamp: string;
}

const currentUser = ref(localStorage.getItem('username') || '');
const searchQuery = ref('');
const searchResults = ref<string[]>([]);
const friends = ref<FriendConnection[]>([]);
const incomingRequests = ref<FriendConnection[]>([]);
const outgoingRequests = ref<FriendConnection[]>([]);
const selectedFriend = ref<string | null>(null);
const messages = ref<Message[]>([]);
const newMessage = ref('');
const chatContainer = ref<HTMLElement | null>(null);
const unreadSenders = ref<string[]>([]);

// Stato Alert Custom
const showDeleteConfirm = ref(false);
const connectionToDelete = ref<string | null>(null);
const deleteConfirmMessage = ref('');



const fetchSocialData = async () => {
  if (!currentUser.value) return;
  try {
    const [friendsRes, requestsRes] = await Promise.all([
      axios.get(`http://localhost:3000/api/social/friends?username=${currentUser.value}`),
      axios.get(`http://localhost:3000/api/social/requests?username=${currentUser.value}`)
    ]);
    friends.value = friendsRes.data;
    incomingRequests.value = requestsRes.data.incoming;
    outgoingRequests.value = requestsRes.data.outgoing;
    fetchUnreadNotifications();
  } catch (error) {
    console.error('Errore caricamento dati social:', error);
  }
};

const fetchUnreadNotifications = async () => {
  if (!currentUser.value) return;
  try {
    const res = await axios.get(`http://localhost:3000/api/social/notifications?username=${currentUser.value}`);
    unreadSenders.value = res.data.unreadSenders || [];
  } catch (e) {
    console.error("Errore fetch notifiche:", e);
  }
};


const searchUsers = async () => {
  if (searchQuery.value.length < 2) {
    searchResults.value = [];
    return;
  }
  try {
    const res = await axios.get(`http://localhost:3000/api/auth/search?q=${searchQuery.value}&current=${currentUser.value}`);
    searchResults.value = res.data.map((u: any) => u.username);
  } catch (error) {
    console.error('Errore ricerca:', error);
  }
};

const sendRequest = async (targetUser: string) => {
  try {
    await axios.post('http://localhost:3000/api/social/request', {
      from: currentUser.value,
      to: targetUser
    });
    fetchSocialData();
    searchQuery.value = '';
    searchResults.value = [];
  } catch (error: any) {
    alert(error.response?.data?.error || 'Errore invio richiesta');
  }
};

const acceptRequest = async (requestId: string) => {
  try {
    await axios.post('http://localhost:3000/api/social/accept', { id: requestId });
    fetchSocialData();
  } catch (error) {
    console.error('Errore accettazione:', error);
  }
};

const removeConnection = (id: string) => {
  connectionToDelete.value = id;
  // Cerchiamo se è un amico accettato o una richiesta per il messaggio
  const conn = friends.value.find(f => f.id === id) || 
               incomingRequests.value.find(f => f.id === id) || 
               outgoingRequests.value.find(f => f.id === id);
  
  if (conn) {
    const partner = conn.user1 === currentUser.value ? conn.user2 : conn.user1;
    deleteConfirmMessage.value = `SEI SICURO DI VOLER INTERROMPERE IL COLLEGAMENTO CON ${partner.toUpperCase()}? TUTTI I MESSAGGI VERRANNO CANCELLATI DEFINITIVAMENTE.`;
  } else {
    deleteConfirmMessage.value = "SEI SICURO DI VOLER CANCELLARE QUESTA RICHIESTA?";
  }
  showDeleteConfirm.value = true;
};

const executeDelete = async () => {
  if (!connectionToDelete.value) return;
  try {
    await axios.delete(`http://localhost:3000/api/social/friend/${connectionToDelete.value}`);
    fetchSocialData();
    if (selectedFriend.value) {
      // Se stavamo chattando con lui, chiudiamo la chat
      const conn = friends.value.find(f => f.id === connectionToDelete.value);
      if (conn && getFriendName(conn) === selectedFriend.value) {
        selectedFriend.value = null;
      }
    }
  } catch (error) {
    console.error('Errore rimozione:', error);
  } finally {
    showDeleteConfirm.value = false;
    connectionToDelete.value = null;
  }
};


const startChat = (friendName: string) => {
  selectedFriend.value = friendName;
  fetchMessages();
};

const fetchMessages = async () => {
  if (!selectedFriend.value) return;
  try {
    const res = await axios.get(`http://localhost:3000/api/social/messages/${selectedFriend.value}?user=${currentUser.value}`);
    messages.value = res.data;
    scrollToBottom();
    
    // Mark as read
    await axios.post('http://localhost:3000/api/social/messages/read', {
      user: currentUser.value,
      from: selectedFriend.value
    });
  } catch (error) {
    console.error('Errore caricamento messaggi:', error);
  }
};

const sendMessage = async () => {
  if (!newMessage.value.trim() || !selectedFriend.value) return;
  try {
    await axios.post('http://localhost:3000/api/social/messages', {
      from: currentUser.value,
      to: selectedFriend.value,
      content: newMessage.value
    });
    newMessage.value = '';
    fetchMessages();
  } catch (error) {
    console.error('Errore invio messaggio:', error);
  }
};

const scrollToBottom = () => {
  setTimeout(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
    }
  }, 50);
};

const getFriendName = (conn: FriendConnection) => {
  if (!currentUser.value) return '';
  return conn.user1.toLowerCase() === currentUser.value.toLowerCase() ? conn.user2 : conn.user1;
};


// Polling for messages
let pollMessages: any = null;
watch(selectedFriend, (newVal) => {
  if (pollMessages) clearInterval(pollMessages);
  if (newVal) {
    pollMessages = setInterval(fetchMessages, 3000);
  }
});


let pollNotifications: any = null;
onMounted(() => {
  fetchSocialData();
  pollNotifications = setInterval(fetchUnreadNotifications, 5000);
});

onUnmounted(() => {
  if (pollMessages) clearInterval(pollMessages);
  if (pollNotifications) clearInterval(pollNotifications);
})

</script>

<template>
  <div class="social-page">
    <div class="social-container">
      
      <!-- Left Sidebar: Friends & Requests -->
      <aside class="social-sidebar glass-panel">
        <div class="sidebar-header">
          <h2 class="cyber-subtitle">SOCIAL LINK</h2>
          <div class="search-box">
            <div class="cyber-input-wrapper">
              <input 
                v-model="searchQuery" 
                @input="searchUsers" 
                placeholder="RICERCA COSTRUTTORI..." 
                class="cyber-input"
              >
              <div class="input-glow"></div>
            </div>

            <div v-if="searchResults.length > 0" class="search-results glass-panel">
              <div 
                v-for="user in searchResults" 
                :key="user" 
                class="search-item"
              >
                <span>{{ user }}</span>
                <button @click="sendRequest(user)" class="cyber-btn btn-primary mini">Aggiungi</button>
              </div>
            </div>
          </div>
        </div>

        <div class="sidebar-content">
          <!-- Pending Requests -->
          <div v-if="incomingRequests.length > 0" class="section">
            <h3 class="section-title">RICHIESTE IN ENTRATA</h3>
            <div 
              v-for="req in incomingRequests" 
              :key="req.id" 
              class="request-item glass-panel"
            >
              <span>{{ req.user1 }} <span class="unread-dot">●</span></span>

              <div class="actions">
                <button @click="acceptRequest(req.id)" class="cyber-btn btn-primary mini">Accetta</button>
                <button @click="removeConnection(req.id)" class="cyber-btn btn-danger mini">X</button>
              </div>
            </div>
          </div>

          <!-- Friends List -->
          <div class="section">
            <h3 class="section-title">COLLEGAMENTI ATTIVI</h3>
            <div v-if="friends.length === 0" class="empty-text">
              Nessun collegamento trovato.
            </div>
            <div 
              v-for="friend in friends" 
              :key="friend.id" 
              class="friend-item glass-panel"
              :class="{ 
                'active': selectedFriend && selectedFriend.toLowerCase() === getFriendName(friend).toLowerCase(),
                'has-unread': unreadSenders.some(s => s.toLowerCase() === getFriendName(friend).toLowerCase())
              }"
              @click="startChat(getFriendName(friend))"

            >
              <div class="friend-info">
                <div class="avatar-mini">{{ getFriendName(friend).charAt(0).toUpperCase() }}</div>
                <span :class="{ 'unread-name': unreadSenders.includes(getFriendName(friend).toLowerCase()) }">
                  {{ getFriendName(friend) }}
                </span>
                <span v-if="unreadSenders.includes(getFriendName(friend).toLowerCase())" class="unread-dot">●</span>
              </div>




              <button @click.stop="removeConnection(friend.id)" class="remove-btn" title="Rimuovi amico">×</button>
            </div>
          </div>

          <!-- Outgoing Pending -->
          <div v-if="outgoingRequests.length > 0" class="section">
            <h3 class="section-title">IN ATTESA DI CONFERMA</h3>
            <div 
              v-for="req in outgoingRequests" 
              :key="req.id" 
              class="request-item glass-panel pending"
            >
              <span>{{ req.user2 }}</span>
              <button @click="removeConnection(req.id)" class="cyber-btn mini">Annulla</button>
            </div>
          </div>
        </div>
      </aside>

      <!-- Main Content: Chat -->
      <main class="chat-main glass-panel">
        <div v-if="selectedFriend" class="chat-wrapper">
          <div class="chat-header">
            <div class="friend-status">
              <div class="avatar-mini">{{ selectedFriend.charAt(0).toUpperCase() }}</div>
              <h3>{{ selectedFriend }} <span v-if="unreadSenders.includes(selectedFriend.toLowerCase())" class="unread-dot">●</span></h3>
            </div>

            <div class="chat-actions">
              <RouterLink :to="'/profile?user=' + selectedFriend" class="cyber-btn btn-secondary mini">Vedi Mazzi</RouterLink>
            </div>
          </div>

          <div class="chat-messages" ref="chatContainer">
            <div 
              v-for="msg in messages" 
              :key="msg.id" 
              class="message-line"
              :class="{ 'mine': msg.from.toLowerCase() === currentUser.toLowerCase() }"
            >
              <div class="line-header">
                <span class="line-sender">{{ msg.from.toUpperCase() }}</span>
                <span class="line-time">{{ new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}</span>
              </div>
              <div class="line-content">{{ msg.content }}</div>
            </div>

            <div v-if="messages.length === 0" class="no-messages">
              Inizia una conversazione con {{ selectedFriend }}
            </div>
          </div>

          <div class="chat-input-area">
            <div class="cyber-input-wrapper chat-input-wrap">
              <input 
                v-model="newMessage" 
                @keyup.enter="sendMessage"
                placeholder="INSERISCI MESSAGGIO..." 
                class="cyber-input"
              >
              <div class="input-glow"></div>
            </div>
            <button @click="sendMessage" class="cyber-btn btn-primary send-btn">INVIA</button>
          </div>

        </div>

        <div v-else class="chat-placeholder">
          <div class="placeholder-content">
            <svg class="placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <h2>SISTEMA DI MESSAGGISTICA</h2>
            <p>Seleziona un collegamento per iniziare la comunicazione.</p>
          </div>
        </div>
      </main>

    </div>

    <!-- Alert Modal Custom (Teleport) -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showDeleteConfirm" class="alert-overlay">
          <div class="alert-box glass-panel">
            <div class="alert-header">
              <span class="warning-icon">⚠️</span>
              AVVISO DI SISTEMA
            </div>
            <div class="alert-content">
              {{ deleteConfirmMessage }}
            </div>
            <div class="alert-actions split-actions">
              <button @click="executeDelete" class="cyber-btn btn-primary danger">CONFERMA ELIMINAZIONE</button>
              <button @click="showDeleteConfirm = false" class="cyber-btn btn-secondary">ANNULLA</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>

</template>

<style scoped>
.social-page {
  padding: 4rem 2rem 2rem;
  min-height: 100vh;
  background: var(--bg-dark);
}

.social-container {
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  height: calc(100vh - 10rem);
}

/* Sidebar Styles */
.social-sidebar {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.sidebar-header {
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.search-box {
  margin-top: 1rem;
  position: relative;
}

.search-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 100;
  margin-top: 0.5rem;
  max-height: 300px;
  overflow-y: auto;
  background: rgba(10, 15, 20, 0.95);
  border: 1px solid var(--accent-cyan);
}

.search-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.8rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.sidebar-content {
  flex-grow: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.section {
  margin-bottom: 2rem;
}

.section-title {
  font-size: 0.7rem;
  color: var(--text-muted);
  letter-spacing: 2px;
  margin-bottom: 1rem;
  font-weight: 800;
}

.request-item, .friend-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  margin-bottom: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;
}

.friend-item {
  cursor: pointer;
}

.friend-item:hover {
  background: rgba(0, 240, 255, 0.05);
  border-color: var(--accent-cyan);
}

.friend-item.active {
  background: rgba(0, 240, 255, 0.1);
  border-color: var(--accent-cyan);
  box-shadow: 0 0 15px rgba(0, 240, 255, 0.1);
}

.friend-info {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.avatar-mini {
  width: 2rem;
  height: 2rem;
  background: var(--accent-cyan);
  color: #000 !important; /* Fixed visibility: black on cyan */
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  font-size: 0.9rem;
  clip-path: polygon(10% 0, 100% 0, 90% 100%, 0 100%);
}


.remove-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 1.5rem;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.3s;
}

.friend-item:hover .remove-btn {
  opacity: 0.6;
}

.remove-btn:hover {
  color: var(--accent-magenta);
  opacity: 1 !important;
}

.friend-item.has-unread {
  border-color: #ffd700;
  background: rgba(255, 215, 0, 0.05);
}

.unread-dot {
  color: #ffd700;
  font-size: 1.1rem;
  margin-left: 0.5rem;
  text-shadow: 0 0 15px rgba(255, 215, 0, 0.8);
  animation: pulse-dot 1.5s infinite;
  display: inline-block;
  line-height: 1;
  vertical-align: middle;
}

.unread-name {
  color: #ffd700 !important;
  font-weight: 800;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
}

@keyframes pulse-dot {
  0% { transform: scale(1); opacity: 0.7; }
  50% { transform: scale(1.4); opacity: 1; text-shadow: 0 0 20px #ffd700; }
  100% { transform: scale(1); opacity: 0.7; }
}



@keyframes pulse-yellow {
  0% { 
    box-shadow: 0 0 5px rgba(255, 215, 0, 0.2);
    border-color: #ffd700;
    transform: scale(1);
  }
  50% { 
    box-shadow: 0 0 25px rgba(255, 215, 0, 0.6);
    border-color: #fff;
    transform: scale(1.02);
  }
  100% { 
    box-shadow: 0 0 5px rgba(255, 215, 0, 0.2);
    border-color: #ffd700;
    transform: scale(1);
  }
}



/* Chat Styles */
.chat-main {
  height: 100%;
}

.chat-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chat-header {
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.friend-status {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.friend-status h3 {
  margin: 0;
  font-family: var(--font-display);
  letter-spacing: 1px;
}

.chat-messages {
  flex-grow: 1;
  overflow-y: auto;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: rgba(0, 0, 0, 0.2);
}

.message-line {
  padding: 0.8rem 1.2rem;
  position: relative;
  background: rgba(255, 255, 255, 0.02);
  border-left: 3px solid var(--accent-cyan);
  margin-bottom: 0.5rem;
  transition: background 0.2;
  width: auto;
  align-self: flex-start;
  max-width: 85%;
}

.message-line:hover {
  background: rgba(255, 255, 255, 0.04);
}

.message-line.mine {
  border-left: none;
  border-right: 3px solid var(--accent-magenta);
  background: rgba(255, 0, 60, 0.02);
  align-self: flex-end;
  text-align: right;
}

.line-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.3rem;
}

.mine .line-header {
  flex-direction: row-reverse;
}

.line-sender {
  font-family: var(--font-display);
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 1.5px;
  color: var(--accent-cyan);
  opacity: 0.9;
}

.mine .line-sender {
  color: var(--accent-magenta);
}

.line-time {
  font-size: 0.6rem;
  color: var(--text-muted);
  opacity: 0.4;
  font-family: monospace;
}

.line-content {
  font-size: 0.95rem;
  line-height: 1.5;
  color: #e2e8f0;
  white-space: pre-wrap;
  word-break: break-word;
}



.chat-input-area {
  padding: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  gap: 1rem;
}

.chat-input-area .cyber-input {
  flex-grow: 1;
}

.chat-placeholder {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: var(--text-muted);
}

.placeholder-icon {
  width: 5rem;
  height: 5rem;
  margin-bottom: 2rem;
  opacity: 0.2;
}

.placeholder-content h2 {
  letter-spacing: 5px;
  margin-bottom: 1rem;
}

/* Inputs Refinement */
.cyber-input-wrapper {
  position: relative;
  width: 100%;
}

.cyber-input {
  width: 100%;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(0, 240, 255, 0.2);
  border-left: 3px solid var(--accent-cyan);
  color: #fff;
  padding: 0.8rem 1rem;
  font-family: var(--font-body);
  font-size: 0.85rem;
  letter-spacing: 1px;
  transition: all 0.3s ease;
}

.cyber-input::placeholder {
  color: rgba(255, 255, 255, 0.3);
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 0.75rem;
  letter-spacing: 2px;
}

.cyber-input:focus {
  outline: none;
  border-color: var(--accent-cyan);
  background: rgba(0, 240, 255, 0.05);
  box-shadow: inset 0 0 15px rgba(0, 240, 255, 0.1);
}

.input-glow {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  border: 1px solid transparent;
  transition: all 0.3s;
}

.cyber-input:focus + .input-glow {
  border-color: var(--accent-cyan);
  box-shadow: 0 0 15px rgba(0, 240, 255, 0.2);
}

.chat-input-wrap {
  flex-grow: 1;
}

.send-btn {
  padding: 0.8rem 1.5rem !important;
  font-size: 0.75rem !important;
}

.empty-text {
  font-size: 0.8rem;
  color: var(--text-muted);
  font-style: italic;
  text-align: center;
  padding: 2rem 0;
}


/* Alert Modal Styles */
.alert-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(10px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
}

.alert-box {
  width: 90%;
  max-width: 500px;
  padding: 2.5rem;
  border: 1px solid var(--accent-magenta) !important;
  box-shadow: 0 0 40px rgba(255, 0, 60, 0.2);
  text-align: center;
}

.alert-header {
  font-family: var(--font-display);
  color: var(--accent-magenta);
  font-size: 1.2rem;
  font-weight: 800;
  letter-spacing: 2px;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.8rem;
}

.alert-content {
  color: #fff;
  font-size: 0.9rem;
  line-height: 1.6;
  margin-bottom: 2rem;
  font-family: var(--font-body);
  letter-spacing: 0.5px;
}

.alert-actions.split-actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.btn-primary.danger {
  border-color: var(--accent-magenta) !important;
  background: rgba(255, 0, 60, 0.1) !important;
  color: var(--accent-magenta) !important;
}

.btn-primary.danger:hover {
  background: var(--accent-magenta) !important;
  color: #fff !important;
  box-shadow: 0 0 25px var(--accent-magenta);
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

</style>
