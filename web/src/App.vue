<template>
  <div class="app-container">
    <header class="header">
      <div class="header-content">
        <div class="logo">
          <div class="minecraft-icon">⛏️</div>
          <h1>Minecraft Dashboard</h1>
        </div>
        <div class="server-info">
          <span class="ip-badge">{{ serverIP }}</span>
        </div>
      </div>
    </header>

    <main class="main-content">
      <!-- Status Card -->
      <div class="status-card">
        <div class="status-header">
          <h2>Status do Servidor</h2>
          <div :class="['status-indicator', serverStatus]">
            <span class="status-dot"></span>
            {{ statusText }}
          </div>
        </div>

        <div class="status-details">
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
          <div class="detail-item">
            <span class="detail-label">Jogadores Online</span>
            <span class="detail-value">{{ playersOnline }}</span>
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import axios from "axios";

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
const loading = ref(false);
const currentAction = ref("");
const ec2Status = ref<"stopped" | "running" | "pending">("stopped");
const minecraftStatus = ref<"offline" | "online" | "starting">("offline");
const playersOnline = ref("0/20");
const serverIP = ref("Carregando...");
const logs = ref<Log[]>([]);
const notification = ref<Notification | null>(null);

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
  } catch (error) {
    addLog("Erro ao iniciar EC2: " + (error as Error).message, "error");
    showNotification("Erro ao iniciar EC2", "error");
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
  } catch (error) {
    minecraftStatus.value = "offline";
    addLog("Erro ao iniciar servidor: " + (error as Error).message, "error");
    showNotification("Erro ao iniciar servidor", "error");
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

    setTimeout(async () => {
      ec2Status.value = "running";
      addLog("EC2 rodando, iniciando Minecraft...", "success");

      // Start Minecraft
      minecraftStatus.value = "starting";
      await axios.post("/api/start-server");

      setTimeout(() => {
        minecraftStatus.value = "online";
        addLog("Tudo pronto! Servidor online! 🎉", "success");
        showNotification("Servidor totalmente online!", "success");
        loading.value = false;
        currentAction.value = "";
      }, 5000);
    }, 3000);
  } catch (error) {
    addLog("Erro no início rápido: " + (error as Error).message, "error");
    showNotification("Erro no início rápido", "error");
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
  } catch (error) {
    addLog("Erro ao parar EC2: " + (error as Error).message, "error");
    showNotification("Erro ao parar EC2", "error");
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
  }
};

// Lifecycle
onMounted(async () => {
  addLog("Dashboard carregado", "success");

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

.ip-badge {
  background: rgba(96, 165, 250, 0.2);
  color: var(--accent-blue);
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-family: "Courier New", monospace;
  font-weight: 600;
  border: 1px solid rgba(96, 165, 250, 0.3);
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
}
</style>
