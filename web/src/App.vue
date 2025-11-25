<template>
  <!-- Login Screen -->
  <Login
    v-if="authEnabled && !isAuthenticated"
    @authenticated="onAuthenticated"
  />

  <div v-else class="app-container">
    <header class="header">
      <div class="header-content">
        <div class="logo">
          <div class="minecraft-icon">⛏️</div>
          <h1>Servidor Minecraft</h1>
        </div>
        <div class="header-actions">
          <button
            @click="toggleTheme"
            class="theme-toggle"
            :title="isDarkTheme ? 'Tema Claro' : 'Tema Escuro'"
          >
            <span class="theme-icon">{{ isDarkTheme ? "☀️" : "🌙" }}</span>
          </button>
          <div class="ip-container">
            <span class="ip-badge">{{ serverIP }}</span>
            <button
              @click="copyIP"
              class="copy-button"
              :title="'Copiar IP'"
              :disabled="serverIP === 'Carregando...'"
            >
              <span class="copy-icon">{{ copied ? "✓" : "📋" }}</span>
            </button>
          </div>
          <button
            v-if="authEnabled && isAuthenticated"
            @click="logout"
            class="logout-button"
            :title="'Logout'"
          >
            <span class="logout-icon">🚪</span>
          </button>
        </div>
      </div>
    </header>

    <main class="main-content">
      <!-- Status Card -->
      <div class="status-card">
        <div class="status-header">
          <h2>Status do Servidor</h2>
          <div v-if="initialLoading" class="skeleton skeleton-badge"></div>
          <div v-else :class="['status-indicator', serverStatus]">
            <span class="status-dot"></span>
            {{ statusText }}
          </div>
        </div>

        <div v-if="initialLoading" class="status-details">
          <div class="detail-item">
            <span class="detail-label">Instância EC2</span>
            <div class="skeleton skeleton-text"></div>
          </div>
          <div class="detail-item">
            <span class="detail-label">Servidor Minecraft</span>
            <div class="skeleton skeleton-text"></div>
          </div>
          <div class="detail-item">
            <span class="detail-label">Jogadores Online</span>
            <div class="skeleton skeleton-text"></div>
          </div>
        </div>

        <div v-else class="status-details">
          <div class="detail-item">
            <span class="detail-label">Instância EC2</span>
            <span :class="['detail-value', ec2Status]">{{
              ec2StatusText
            }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Servidor Minecraft</span>
            <span :class="['detail-value', minecraftStatus]">{{
              minecraftStatusText
            }}</span>
          </div>
          <div class="detail-item clickable" @click="showPlayersModal">
            <span class="detail-label">Jogadores Online</span>
            <span class="detail-value">{{ playersOnline }}</span>
            <span class="detail-hint">Clique para ver detalhes</span>
          </div>
        </div>
      </div>

      <!-- Control Panel -->
      <div class="control-panel">
        <h2>Painel de Controle</h2>

        <div class="button-grid">
          <!-- Start EC2 Button -->
          <button
            @click="startEC2"
            :disabled="loading || ec2Status === 'running'"
            class="control-button start-ec2"
          >
            <span class="button-icon">🚀</span>
            <span class="button-text">
              <span class="button-title">Iniciar EC2</span>
              <span class="button-subtitle">Liga a instância AWS</span>
            </span>
            <span
              v-if="loading && currentAction === 'start-ec2'"
              class="spinner"
            ></span>
          </button>

          <!-- Start Server Button -->
          <button
            @click="startServer"
            :disabled="
              loading || ec2Status !== 'running' || minecraftStatus === 'online'
            "
            class="control-button start-server"
          >
            <span class="button-icon">🎮</span>
            <span class="button-text">
              <span class="button-title">Iniciar Servidor</span>
              <span class="button-subtitle">Inicia o Minecraft</span>
            </span>
            <span
              v-if="loading && currentAction === 'start-server'"
              class="spinner"
            ></span>
          </button>

          <!-- Quick Start Button -->
          <button
            @click="quickStart"
            :disabled="
              loading ||
              (ec2Status === 'running' && minecraftStatus === 'online')
            "
            class="control-button quick-start"
          >
            <span class="button-icon">⚡</span>
            <span class="button-text">
              <span class="button-title">Início Rápido</span>
              <span class="button-subtitle">EC2 + Servidor</span>
            </span>
            <span
              v-if="loading && currentAction === 'quick-start'"
              class="spinner"
            ></span>
          </button>

          <!-- Stop EC2 Button -->
          <button
            @click="stopEC2"
            :disabled="loading || ec2Status === 'stopped'"
            class="control-button stop-ec2"
          >
            <span class="button-icon">🛑</span>
            <span class="button-text">
              <span class="button-title">Parar EC2</span>
              <span class="button-subtitle">Desliga para economizar</span>
            </span>
            <span
              v-if="loading && currentAction === 'stop-ec2'"
              class="spinner"
            ></span>
          </button>
        </div>
      </div>

      <!-- Logs Section -->
      <div class="logs-section">
        <div class="logs-header">
          <h2>Logs</h2>
          <button @click="clearLogs" class="clear-logs-btn">Limpar</button>
        </div>
        <div class="logs-container">
          <div v-if="logs.length === 0" class="no-logs">
            Nenhum log ainda...
          </div>
          <div v-else class="log-list">
            <div
              v-for="(log, index) in logs"
              :key="index"
              :class="['log-item', log.type]"
            >
              <span class="log-time">{{ log.time }}</span>
              <span class="log-message">{{ log.message }}</span>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Notification -->
    <transition name="fade">
      <div v-if="notification" :class="['notification', notification.type]">
        {{ notification.message }}
      </div>
    </transition>

    <!-- Players Modal -->
    <transition name="modal">
      <div v-if="showModal" class="modal-overlay" @click="closeModal">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h2>🎮 Informações dos Jogadores</h2>
            <button @click="closeModal" class="close-button">✕</button>
          </div>
          <div class="modal-body">
            <div class="modal-info-grid">
              <div class="modal-info-item">
                <span class="modal-info-label">Status do Servidor</span>
                <span :class="['modal-info-value', minecraftStatus]">
                  {{
                    minecraftStatus === "online" ? "🟢 Online" : "🔴 Offline"
                  }}
                </span>
              </div>
              <div class="modal-info-item">
                <span class="modal-info-label">Versão do Minecraft</span>
                <span class="modal-info-value">{{ serverVersion }}</span>
              </div>
              <div class="modal-info-item">
                <span class="modal-info-label">Jogadores Conectados</span>
                <span class="modal-info-value">{{ playersOnline }}</span>
              </div>
              <div class="modal-info-item ip-item">
                <span class="modal-info-label">IP do Servidor</span>
                <div class="modal-ip-container">
                  <span class="modal-info-value mono">{{ serverIP }}</span>
                  <button
                    @click="copyIP"
                    class="modal-copy-button"
                    :title="'Copiar IP'"
                    :disabled="serverIP === 'Carregando...'"
                  >
                    {{ copied ? "✓" : "📋" }}
                  </button>
                </div>
              </div>
            </div>

            <div v-if="playerNames.length > 0" class="players-list">
              <h3>👥 Jogadores Online:</h3>
              <div class="player-cards">
                <div
                  v-for="(player, index) in playerNames"
                  :key="index"
                  class="player-card"
                >
                  <div class="player-avatar">
                    {{ player.charAt(0).toUpperCase() }}
                  </div>
                  <div class="player-info">
                    <div class="player-name">{{ player }}</div>
                    <div class="player-status">🟢 Online</div>
                  </div>
                </div>
              </div>
            </div>

            <div v-else-if="minecraftStatus === 'online'" class="no-players">
              <p>🎯 Nenhum jogador conectado no momento</p>
              <p class="no-players-subtitle">Seja o primeiro a entrar!</p>
            </div>

            <div v-else class="server-offline-message">
              <p>⚠️ Servidor offline</p>
              <p class="offline-subtitle">
                Inicie o servidor para ver os jogadores
              </p>
            </div>
          </div>
          <div class="modal-footer">
            <button @click="closeModal" class="modal-button">Fechar</button>
            <button @click="refreshStatus" class="modal-button primary">
              🔄 Atualizar
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import axios from "axios";
import Login from "./components/Login.vue";

interface Log {
  time: string;
  message: string;
  type: "info" | "success" | "error" | "warning";
}

interface Notification {
  message: string;
  type: "success" | "error" | "info";
}

// State
const initialLoading = ref(true);
const loading = ref(false);
const currentAction = ref("");
const ec2Status = ref<"stopped" | "running" | "pending">("stopped");
const minecraftStatus = ref<"offline" | "online" | "starting">("offline");
const playersOnline = ref("0/20");
const serverIP = ref("Carregando...");
const logs = ref<Log[]>([]);
const notification = ref<Notification | null>(null);
const isDarkTheme = ref(true);
const showModal = ref(false);
const playerNames = ref<string[]>([]);
const serverVersion = ref("Unknown");
const copied = ref(false);
const isAuthenticated = ref(false);
const authEnabled = ref(false);
const username = ref("");

// Computed
const serverStatus = computed(() => {
  if (ec2Status.value === "running" && minecraftStatus.value === "online")
    return "online";
  if (ec2Status.value === "running" && minecraftStatus.value === "starting")
    return "starting";
  return "offline";
});

const statusText = computed(() => {
  const statuses = {
    online: "🟢 Online",
    starting: "🟡 Iniciando...",
    offline: "🔴 Offline",
  };
  return statuses[serverStatus.value];
});

const ec2StatusText = computed(() => {
  const statuses = {
    stopped: "Parada",
    running: "Rodando",
    pending: "Iniciando...",
  };
  return statuses[ec2Status.value];
});

const minecraftStatusText = computed(() => {
  const statuses = {
    offline: "Offline",
    online: "Online",
    starting: "Iniciando...",
  };
  return statuses[minecraftStatus.value];
});

// Methods
const addLog = (message: string, type: Log["type"] = "info") => {
  const time = new Date().toLocaleTimeString("pt-BR");
  logs.value.unshift({ time, message, type });
  if (logs.value.length > 50) logs.value.pop();
};

const showNotification = (message: string, type: Notification["type"]) => {
  notification.value = { message, type };
  setTimeout(() => {
    notification.value = null;
  }, 5000);
};

const clearLogs = () => {
  logs.value = [];
  addLog("Logs limpos", "info");
};

const toggleTheme = () => {
  isDarkTheme.value = !isDarkTheme.value;
  const theme = isDarkTheme.value ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
  addLog(
    `Tema alterado para ${isDarkTheme.value ? "escuro" : "claro"}`,
    "info"
  );
};

const copyIP = async () => {
  if (serverIP.value === "Carregando...") return;

  try {
    await navigator.clipboard.writeText(serverIP.value);
    copied.value = true;
    showNotification("IP copiado para a área de transferência!", "success");
    addLog(`IP ${serverIP.value} copiado`, "info");

    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch (error) {
    showNotification("Erro ao copiar IP", "error");
    addLog("Erro ao copiar IP para área de transferência", "error");
  }
};

const startEC2 = async () => {
  loading.value = true;
  currentAction.value = "start-ec2";
  addLog("Iniciando instância EC2...", "info");

  try {
    const response = await axios.post("/api/start-ec2");
    ec2Status.value = "pending";

    setTimeout(() => {
      ec2Status.value = "running";
      addLog("Instância EC2 iniciada com sucesso!", "success");
      showNotification("EC2 iniciada com sucesso!", "success");
    }, 3000);
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.error || error.message || "Erro desconhecido";
    addLog("Erro ao iniciar EC2: " + errorMessage, "error");
    showNotification(errorMessage, "error");
  } finally {
    loading.value = false;
    currentAction.value = "";
  }
};

const startServer = async () => {
  loading.value = true;
  currentAction.value = "start-server";
  addLog("Conectando via SSH...", "info");

  try {
    minecraftStatus.value = "starting";
    const response = await axios.post("/api/start-server");

    setTimeout(() => {
      minecraftStatus.value = "online";
      addLog("Servidor Minecraft iniciado!", "success");
      showNotification("Servidor online! Bom jogo! 🎮", "success");
    }, 5000);
  } catch (error: any) {
    minecraftStatus.value = "offline";
    const errorMessage =
      error.response?.data?.error || error.message || "Erro desconhecido";
    addLog("Erro ao iniciar servidor: " + errorMessage, "error");
    showNotification(errorMessage, "error");
  } finally {
    loading.value = false;
    currentAction.value = "";
  }
};

const quickStart = async () => {
  loading.value = true;
  currentAction.value = "quick-start";
  addLog("Início rápido: iniciando EC2 e servidor...", "info");

  try {
    // Start EC2
    ec2Status.value = "pending";
    await axios.post("/api/start-ec2");

    // Wait longer for EC2 to be fully ready (increased from 3s to 10s)
    addLog("Aguardando EC2 ficar pronta (10 segundos)...", "info");
    setTimeout(async () => {
      ec2Status.value = "running";
      addLog("EC2 rodando, aguardando SSM Agent...", "success");

      // Wait additional time for SSM Agent to be ready
      setTimeout(async () => {
        try {
          addLog("Iniciando Minecraft...", "info");
          minecraftStatus.value = "starting";
          await axios.post("/api/start-server");

          setTimeout(() => {
            minecraftStatus.value = "online";
            addLog("Tudo pronto! Servidor online! 🎉", "success");
            showNotification("Servidor totalmente online!", "success");
            loading.value = false;
            currentAction.value = "";
          }, 5000);
        } catch (serverError: any) {
          const errorMessage =
            serverError.response?.data?.error ||
            serverError.message ||
            "Erro desconhecido";
          addLog("Erro ao iniciar servidor: " + errorMessage, "error");
          showNotification(errorMessage, "error");
          loading.value = false;
          currentAction.value = "";
        }
      }, 5000); // Additional 5 seconds for SSM Agent
    }, 10000); // Increased from 3 to 10 seconds
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.error || error.message || "Erro desconhecido";
    addLog("Erro no início rápido: " + errorMessage, "error");
    showNotification(errorMessage, "error");
    loading.value = false;
    currentAction.value = "";
  }
};

const stopEC2 = async () => {
  if (!confirm("Tem certeza que deseja parar o servidor?")) return;

  loading.value = true;
  currentAction.value = "stop-ec2";
  addLog("Parando instância EC2...", "warning");

  try {
    await axios.post("/api/stop-ec2");

    setTimeout(() => {
      ec2Status.value = "stopped";
      minecraftStatus.value = "offline";
      addLog("EC2 parada com sucesso. Economia ativada! 💰", "success");
      showNotification("Servidor desligado", "info");
    }, 2000);
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.error || error.message || "Erro desconhecido";
    addLog("Erro ao parar EC2: " + errorMessage, "error");
    showNotification(errorMessage, "error");
  } finally {
    loading.value = false;
    currentAction.value = "";
  }
};

const loadStatus = async () => {
  try {
    const response = await axios.get("/api/status");
    const data = response.data;

    // Atualizar status do EC2
    if (data.isPending) {
      ec2Status.value = "pending";
    } else if (data.isRunning) {
      ec2Status.value = "running";
    } else if (data.isStopped) {
      ec2Status.value = "stopped";
    }

    // Atualizar status do Minecraft
    if (data.minecraftStatus === "online") {
      minecraftStatus.value = "online";
    } else if (data.minecraftStatus === "starting") {
      minecraftStatus.value = "starting";
    } else {
      minecraftStatus.value = "offline";
    }

    // Atualizar contagem de jogadores
    if (data.playerCount) {
      playersOnline.value = data.playerCount;
    }

    // Atualizar nomes dos jogadores
    if (data.playerNames) {
      playerNames.value = data.playerNames;
    }

    // Atualizar versão do servidor
    if (data.serverVersion) {
      serverVersion.value = data.serverVersion;
    }

    addLog(
      `Status - EC2: ${data.ec2State}, Minecraft: ${data.minecraftStatus}`,
      "info"
    );

    if (data.isRunning && data.minecraftStatus === "online") {
      addLog(
        `Servidor online com ${data.playersOnline} jogador(es)`,
        "success"
      );
    }
  } catch (error) {
    addLog("Erro ao carregar status: " + (error as Error).message, "error");
  } finally {
    initialLoading.value = false;
  }
};

const showPlayersModal = () => {
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
};

const refreshStatus = async () => {
  addLog("Atualizando status...", "info");
  await loadStatus();
  showNotification("Status atualizado!", "info");
};

// Lifecycle
// Authentication methods
const checkAuth = async () => {
  try {
    const token = localStorage.getItem("auth_token");
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }

    const response = await axios.get("/api/auth-check");
    authEnabled.value = response.data.authEnabled;
    isAuthenticated.value = response.data.authenticated;

    if (response.data.authEnabled && !response.data.authenticated) {
      // Clear invalid token
      localStorage.removeItem("auth_token");
      delete axios.defaults.headers.common["Authorization"];
    }

    const storedUsername = localStorage.getItem("username");
    if (storedUsername) {
      username.value = storedUsername;
    }
  } catch (error) {
    console.error("Auth check failed:", error);
    // Force authentication even if check fails
    authEnabled.value = true;
    isAuthenticated.value = false;
  }
};

const onAuthenticated = async () => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  }

  const storedUsername = localStorage.getItem("username");
  if (storedUsername) {
    username.value = storedUsername;
  }

  isAuthenticated.value = true;
  addLog(`Login realizado: ${username.value}`, "success");
  await loadStatus();
};

const logout = async () => {
  try {
    await axios.post("/api/logout");
    localStorage.removeItem("auth_token");
    localStorage.removeItem("username");
    delete axios.defaults.headers.common["Authorization"];
    isAuthenticated.value = false;
    addLog("Logout realizado", "info");
  } catch (error) {
    console.error("Logout error:", error);
  }
};

// Intercept 401 responses
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && authEnabled.value) {
      isAuthenticated.value = false;
      localStorage.removeItem("auth_token");
      localStorage.removeItem("username");
      delete axios.defaults.headers.common["Authorization"];
      showNotification("Sessão expirada. Faça login novamente.", "error");
    }
    return Promise.reject(error);
  }
);

onMounted(async () => {
  // Check authentication first
  await checkAuth();

  // Carregar tema salvo
  const savedTheme = localStorage.getItem("theme") || "dark";
  isDarkTheme.value = savedTheme === "dark";
  document.documentElement.setAttribute("data-theme", savedTheme);

  addLog("Dashboard carregado", "success");

  // Only load data if authenticated (or auth disabled)
  if (isAuthenticated.value) {
    // Busca configurações do servidor
    try {
      const response = await axios.get("/api/config");
      serverIP.value = response.data.serverIP || "N/A";
    } catch (error) {
      serverIP.value = "N/A";
      addLog("Não foi possível carregar IP do servidor", "warning");
    }

    // Carrega status atual
    await loadStatus();

    // Atualiza status a cada 30 segundos
    setInterval(loadStatus, 30000);
  }
});
</script>

<style scoped>
.app-container {
  animation: fadeIn 0.6s ease;
}

.header {
  background: var(--bg-card);
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: var(--shadow);
  border: 1px solid var(--border-color);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.logo {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.minecraft-icon {
  font-size: 3rem;
  animation: pulse 2s ease-in-out infinite;
}

.logo h1 {
  font-size: 2rem;
  font-weight: 700;
  background: linear-gradient(135deg, var(--accent-green), var(--accent-blue));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.theme-toggle {
  background: var(--bg-secondary);
  border: 2px solid var(--border-color);
  border-radius: 50%;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 1.5rem;
}

.theme-toggle:hover {
  transform: scale(1.1) rotate(15deg);
  border-color: var(--accent-blue);
  box-shadow: 0 0 15px rgba(96, 165, 250, 0.4);
}

.theme-icon {
  animation: none;
  display: block;
  transition: transform 0.3s ease;
}

.theme-toggle:active .theme-icon {
  transform: rotate(360deg);
}

.ip-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.ip-badge {
  background: rgba(96, 165, 250, 0.2);
  color: var(--accent-blue);
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-family: "Courier New", monospace;
  font-weight: 600;
  border: 1px solid rgba(96, 165, 250, 0.3);
}

.copy-button {
  background: rgba(96, 165, 250, 0.2);
  color: var(--accent-blue);
  padding: 0.5rem;
  border-radius: 8px;
  border: 1px solid rgba(96, 165, 250, 0.3);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  height: 40px;
}

.copy-button:hover:not(:disabled) {
  background: rgba(96, 165, 250, 0.3);
  transform: scale(1.05);
}

.copy-button:active:not(:disabled) {
  transform: scale(0.95);
}

.copy-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.copy-icon {
  font-size: 1.2rem;
}

.logout-button {
  background: rgba(239, 68, 68, 0.2);
  color: var(--accent-red);
  padding: 0.5rem;
  border-radius: 8px;
  border: 1px solid rgba(239, 68, 68, 0.3);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  height: 40px;
}

.logout-button:hover {
  background: rgba(239, 68, 68, 0.3);
  transform: scale(1.05);
}

.logout-button:active {
  transform: scale(0.95);
}

.logout-icon {
  font-size: 1.2rem;
}

.main-content {
  display: grid;
  gap: 2rem;
}

.status-card,
.control-panel,
.logs-section {
  background: var(--bg-card);
  border-radius: 16px;
  padding: 2rem;
  box-shadow: var(--shadow);
  border: 1px solid var(--border-color);
}

.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.status-header h2 {
  font-size: 1.5rem;
  font-weight: 600;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
}

.status-indicator.online {
  background: rgba(74, 222, 128, 0.2);
  color: var(--accent-green);
}

.status-indicator.starting {
  background: rgba(251, 191, 36, 0.2);
  color: var(--accent-yellow);
}

.status-indicator.offline {
  background: rgba(248, 113, 113, 0.2);
  color: var(--accent-red);
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: currentColor;
  animation: pulse 2s ease-in-out infinite;
}

.status-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.detail-item {
  background: var(--bg-secondary);
  padding: 1rem;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.detail-label {
  color: var(--text-secondary);
  font-size: 0.875rem;
  font-weight: 500;
}

.detail-value {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
}

.detail-value.running {
  color: var(--accent-green);
}

.detail-value.online {
  color: var(--accent-green);
}

.detail-value.starting {
  color: var(--accent-yellow);
}

.control-panel h2 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
}

.button-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.control-button {
  background: var(--bg-secondary);
  border: 2px solid var(--border-color);
  border-radius: 12px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 1rem;
  position: relative;
  overflow: hidden;
}

.control-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
}

.control-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.control-button.start-ec2:hover:not(:disabled) {
  border-color: var(--accent-blue);
  background: rgba(96, 165, 250, 0.1);
}

.control-button.start-server:hover:not(:disabled) {
  border-color: var(--accent-green);
  background: rgba(74, 222, 128, 0.1);
}

.control-button.quick-start:hover:not(:disabled) {
  border-color: var(--accent-yellow);
  background: rgba(251, 191, 36, 0.1);
}

.control-button.stop-ec2:hover:not(:disabled) {
  border-color: var(--accent-red);
  background: rgba(248, 113, 113, 0.1);
}

.button-icon {
  font-size: 2rem;
}

.button-text {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
  text-align: left;
}

.button-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.button-subtitle {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.spinner {
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: var(--accent-blue);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.logs-section {
  max-height: 400px;
  display: flex;
  flex-direction: column;
}

.logs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.logs-header h2 {
  font-size: 1.5rem;
  font-weight: 600;
}

.clear-logs-btn {
  background: rgba(248, 113, 113, 0.2);
  color: var(--accent-red);
  border: 1px solid rgba(248, 113, 113, 0.3);
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
}

.clear-logs-btn:hover {
  background: rgba(248, 113, 113, 0.3);
}

.logs-container {
  flex: 1;
  overflow-y: auto;
  background: var(--bg-secondary);
  border-radius: 8px;
  padding: 1rem;
}

.no-logs {
  text-align: center;
  color: var(--text-secondary);
  padding: 2rem;
}

.log-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.log-item {
  display: flex;
  gap: 1rem;
  padding: 0.75rem;
  border-radius: 6px;
  font-size: 0.875rem;
  animation: fadeIn 0.3s ease;
}

.log-item.info {
  background: rgba(96, 165, 250, 0.1);
  border-left: 3px solid var(--accent-blue);
}

.log-item.success {
  background: rgba(74, 222, 128, 0.1);
  border-left: 3px solid var(--accent-green);
}

.log-item.error {
  background: rgba(248, 113, 113, 0.1);
  border-left: 3px solid var(--accent-red);
}

.log-item.warning {
  background: rgba(251, 191, 36, 0.1);
  border-left: 3px solid var(--accent-yellow);
}

.log-time {
  color: var(--text-secondary);
  font-family: "Courier New", monospace;
  min-width: 80px;
}

.log-message {
  color: var(--text-primary);
}

.notification {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  padding: 1rem 1.5rem;
  border-radius: 12px;
  font-weight: 600;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

.notification.success {
  background: var(--accent-green);
  color: var(--bg-primary);
}

.notification.error {
  background: var(--accent-red);
  color: white;
}

.notification.info {
  background: var(--accent-blue);
  color: white;
}

.clickable {
  cursor: pointer;
  transition: all 0.3s ease;
}

.clickable:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(96, 165, 250, 0.3);
  border: 1px solid var(--accent-blue);
}

.detail-hint {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-top: 0.25rem;
  display: block;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: var(--bg-card);
  border-radius: 16px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  border: 1px solid var(--border-color);
}

.modal-header {
  padding: 1.5rem 2rem;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
}

.close-button {
  background: transparent;
  border: none;
  font-size: 1.5rem;
  color: var(--text-secondary);
  cursor: pointer;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.close-button:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.modal-body {
  padding: 2rem;
}

.modal-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.modal-info-item {
  background: var(--bg-secondary);
  padding: 1rem;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.modal-info-item.ip-item {
  position: relative;
}

.modal-ip-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.modal-copy-button {
  background: rgba(96, 165, 250, 0.2);
  color: var(--accent-blue);
  padding: 0.35rem 0.6rem;
  border-radius: 6px;
  border: 1px solid rgba(96, 165, 250, 0.3);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
}

.modal-copy-button:hover:not(:disabled) {
  background: rgba(96, 165, 250, 0.3);
  transform: scale(1.05);
}

.modal-copy-button:active:not(:disabled) {
  transform: scale(0.95);
}

.modal-copy-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.modal-info-label {
  color: var(--text-secondary);
  font-size: 0.875rem;
  font-weight: 500;
}

.modal-info-value {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
}

.modal-info-value.mono {
  font-family: "Courier New", monospace;
  color: var(--accent-blue);
}

.modal-info-value.online {
  color: var(--accent-green);
}

.players-list {
  margin-top: 1.5rem;
}

.players-list h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: var(--text-primary);
}

.player-cards {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.player-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.3s ease;
}

.player-card:hover {
  transform: translateX(4px);
  border-color: var(--accent-green);
  box-shadow: 0 4px 12px rgba(74, 222, 128, 0.2);
}

.player-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent-green), var(--accent-blue));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
}

.player-info {
  flex: 1;
}

.player-name {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.player-status {
  font-size: 0.875rem;
  color: var(--accent-green);
}

.no-players,
.server-offline-message {
  text-align: center;
  padding: 2rem;
  color: var(--text-secondary);
}

.no-players p:first-child,
.server-offline-message p:first-child {
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
}

.no-players-subtitle,
.offline-subtitle {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.modal-footer {
  padding: 1.5rem 2rem;
  border-top: 1px solid var(--border-color);
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.modal-button {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  border: 2px solid var(--border-color);
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.modal-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.modal-button.primary {
  background: var(--accent-blue);
  border-color: var(--accent-blue);
  color: white;
}

.modal-button.primary:hover {
  background: #5b9ee6;
  box-shadow: 0 4px 12px rgba(96, 165, 250, 0.4);
}

/* Skeleton Loading */
.skeleton {
  background: linear-gradient(
    90deg,
    var(--bg-secondary) 25%,
    var(--border-color) 50%,
    var(--bg-secondary) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 8px;
}

.skeleton-text {
  height: 1.5rem;
  width: 100%;
  max-width: 120px;
}

.skeleton-badge {
  height: 2.5rem;
  width: 140px;
  border-radius: 8px;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* Modal Animations */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-content,
.modal-leave-active .modal-content {
  transition: transform 0.3s ease;
}

.modal-enter-from .modal-content,
.modal-leave-to .modal-content {
  transform: scale(0.9);
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    text-align: center;
  }

  .logo {
    flex-direction: column;
  }

  .button-grid {
    grid-template-columns: 1fr;
  }

  .notification {
    left: 1rem;
    right: 1rem;
  }

  .modal-content {
    max-height: 95vh;
  }

  .modal-info-grid {
    grid-template-columns: 1fr;
  }

  .modal-footer {
    flex-direction: column;
  }

  .modal-button {
    width: 100%;
  }
}
</style>
