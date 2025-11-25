<template>
  <div class="security-panel">
    <h2>🔒 Segurança do Servidor</h2>

    <div class="security-sections">
      <!-- Whitelist Section -->
      <div class="security-section">
        <h3>Whitelist</h3>
        <div class="whitelist-controls">
          <div class="whitelist-toggle">
            <button
              @click="toggleWhitelist"
              :disabled="loading"
              :class="['btn', whitelistEnabled ? 'btn-danger' : 'btn-success']"
            >
              {{
                whitelistEnabled
                  ? "🔓 Desativar Whitelist"
                  : "🔒 Ativar Whitelist"
              }}
            </button>
            <span v-if="whitelistEnabled" class="status-badge enabled"
              >Ativo</span
            >
            <span v-else class="status-badge disabled">Inativo</span>
          </div>

          <div class="whitelist-add">
            <input
              v-model="newPlayer"
              type="text"
              placeholder="Nome do jogador"
              @keyup.enter="addPlayer"
              :disabled="loading"
            />
            <button
              @click="addPlayer"
              :disabled="loading || !newPlayer"
              class="btn btn-primary"
            >
              ➕ Adicionar
            </button>
          </div>

          <div class="whitelist-list">
            <button
              @click="loadWhitelist"
              :disabled="loading"
              class="btn btn-secondary"
            >
              🔄 Atualizar Lista
            </button>
            <div v-if="players.length > 0" class="players">
              <div v-for="player in players" :key="player" class="player-item">
                <span>{{ player }}</span>
                <button
                  @click="removePlayer(player)"
                  :disabled="loading"
                  class="btn-remove"
                >
                  ❌
                </button>
              </div>
            </div>
            <p v-else-if="!loading" class="no-players">
              Nenhum jogador na whitelist
            </p>
          </div>
        </div>
      </div>

      <!-- Backup Section -->
      <div class="security-section">
        <h3>Backups</h3>
        <div class="backup-controls">
          <button
            @click="createBackup"
            :disabled="loading"
            class="btn btn-primary"
          >
            💾 Criar Backup Manual
          </button>
          <p class="backup-info">
            Backups automáticos são mantidos. Os últimos 7 backups são
            preservados.
          </p>
        </div>
      </div>

      <!-- Logs Section -->
      <div class="security-section">
        <h3>Logs do Servidor</h3>
        <div class="logs-controls">
          <div class="logs-header">
            <select v-model="logLines" @change="loadLogs">
              <option value="50">Últimas 50 linhas</option>
              <option value="100">Últimas 100 linhas</option>
              <option value="200">Últimas 200 linhas</option>
              <option value="500">Últimas 500 linhas</option>
            </select>
            <button
              @click="loadLogs"
              :disabled="loading"
              class="btn btn-secondary"
            >
              🔄 Atualizar
            </button>
          </div>
          <div v-if="logs.length > 0" class="logs-container">
            <pre class="logs">{{ logs.join("\n") }}</pre>
          </div>
          <p v-else-if="!loading" class="no-logs">Nenhum log disponível</p>
        </div>
      </div>
    </div>

    <!-- Status Messages -->
    <div v-if="statusMessage" :class="['status-message', statusType]">
      {{ statusMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import axios from "axios";

const loading = ref(false);
const statusMessage = ref("");
const statusType = ref<"success" | "error" | "info">("info");

// Whitelist state
const whitelistEnabled = ref(false);
const newPlayer = ref("");
const players = ref<string[]>([]);

// Logs state
const logLines = ref("50");
const logs = ref<string[]>([]);

function showStatus(
  message: string,
  type: "success" | "error" | "info" = "info"
) {
  statusMessage.value = message;
  statusType.value = type;
  setTimeout(() => {
    statusMessage.value = "";
  }, 5000);
}

async function toggleWhitelist() {
  loading.value = true;
  try {
    const action = whitelistEnabled.value ? "whitelist-disable" : "whitelist-enable";
    const response = await axios.post("/api/security", { action });

    if (response.data.success) {
      whitelistEnabled.value = !whitelistEnabled.value;
      showStatus(
        `Whitelist ${
          whitelistEnabled.value ? "ativada" : "desativada"
        } com sucesso!`,
        "success"
      );
    }
  } catch (error: any) {
    showStatus(
      error.response?.data?.error || "Erro ao alterar whitelist",
      "error"
    );
  } finally {
    loading.value = false;
  }
}

async function addPlayer() {
  if (!newPlayer.value.trim()) return;

  loading.value = true;
  try {
    const response = await axios.post("/api/security", {
      action: "whitelist-add",
      player: newPlayer.value.trim(),
    });

    if (response.data.success) {
      showStatus(
        `Jogador ${newPlayer.value} adicionado à whitelist!`,
        "success"
      );
      newPlayer.value = "";
      await loadWhitelist();
    }
  } catch (error: any) {
    showStatus(
      error.response?.data?.error || "Erro ao adicionar jogador",
      "error"
    );
  } finally {
    loading.value = false;
  }
}

async function removePlayer(player: string) {
  loading.value = true;
  try {
    const response = await axios.post("/api/security", {
      action: "whitelist-remove",
      player,
    });

    if (response.data.success) {
      showStatus(`Jogador ${player} removido da whitelist!`, "success");
      await loadWhitelist();
    }
  } catch (error: any) {
    showStatus(
      error.response?.data?.error || "Erro ao remover jogador",
      "error"
    );
  } finally {
    loading.value = false;
  }
}

async function loadWhitelist() {
  loading.value = true;
  try {
    const response = await axios.post("/api/security", { action: "whitelist-list" });

    if (response.data.success) {
      // Parse the whitelist output
      const output = response.data.output || "";
      if (
        output.includes("enabled") ||
        output.includes("Whitelist is turned on")
      ) {
        whitelistEnabled.value = true;
      } else if (
        output.includes("disabled") ||
        output.includes("Whitelist is turned off")
      ) {
        whitelistEnabled.value = false;
      }

      // Extract player names from output
      const lines = output.split("\n");
      const playerList = lines
        .filter((line: string) => line.match(/^\s*-\s+\w+/))
        .map((line: string) => line.replace(/^\s*-\s+/, "").trim())
        .filter((name: string) => name.length > 0);

      players.value = playerList;
    }
  } catch (error: any) {
    showStatus(
      error.response?.data?.error || "Erro ao carregar whitelist",
      "error"
    );
  } finally {
    loading.value = false;
  }
}

async function createBackup() {
  loading.value = true;
  try {
    const response = await axios.post("/api/security", { action: "backup" });

    if (response.data.success) {
      showStatus("Backup criado com sucesso!", "success");
    }
  } catch (error: any) {
    showStatus(error.response?.data?.error || "Erro ao criar backup", "error");
  } finally {
    loading.value = false;
  }
}

async function loadLogs() {
  loading.value = true;
  try {
    const response = await axios.get(`/api/security?action=logs&lines=${logLines.value}`);

    if (response.data.success) {
      logs.value = response.data.logs.filter(
        (line: string) => line.trim().length > 0
      );
    }
  } catch (error: any) {
    showStatus(error.response?.data?.error || "Erro ao carregar logs", "error");
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadWhitelist();
  loadLogs();
});
</script>

<style scoped>
.security-panel {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.security-panel h2 {
  color: #2c3e50;
  margin-bottom: 30px;
  font-size: 28px;
}

.security-sections {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.security-section {
  background: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.security-section h3 {
  color: #34495e;
  margin-bottom: 20px;
  font-size: 22px;
  border-bottom: 2px solid #3498db;
  padding-bottom: 10px;
}

/* Whitelist Styles */
.whitelist-controls {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.whitelist-toggle {
  display: flex;
  align-items: center;
  gap: 15px;
}

.status-badge {
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
}

.status-badge.enabled {
  background: #d4edda;
  color: #155724;
}

.status-badge.disabled {
  background: #f8d7da;
  color: #721c24;
}

.whitelist-add {
  display: flex;
  gap: 10px;
}

.whitelist-add input {
  flex: 1;
  padding: 10px 15px;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
}

.whitelist-add input:focus {
  outline: none;
  border-color: #3498db;
}

.whitelist-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.players {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 10px;
}

.player-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #3498db;
}

.player-item span {
  font-weight: 500;
  color: #2c3e50;
}

.btn-remove {
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 16px;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.btn-remove:hover {
  opacity: 1;
}

/* Backup Styles */
.backup-controls {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.backup-info {
  color: #7f8c8d;
  font-size: 14px;
  margin: 0;
}

/* Logs Styles */
.logs-controls {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.logs-header {
  display: flex;
  gap: 10px;
  align-items: center;
}

.logs-header select {
  padding: 8px 12px;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  background: white;
  cursor: pointer;
}

.logs-header select:focus {
  outline: none;
  border-color: #3498db;
}

.logs-container {
  max-height: 400px;
  overflow-y: auto;
  background: #1e1e1e;
  border-radius: 8px;
  padding: 15px;
}

.logs {
  margin: 0;
  font-family: "Courier New", monospace;
  font-size: 12px;
  color: #d4d4d4;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.no-players,
.no-logs {
  color: #7f8c8d;
  font-style: italic;
  text-align: center;
  padding: 20px;
}

/* Button Styles */
.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2980b9;
  transform: translateY(-2px);
}

.btn-secondary {
  background: #95a5a6;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #7f8c8d;
}

.btn-success {
  background: #27ae60;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #229954;
}

.btn-danger {
  background: #e74c3c;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #c0392b;
}

/* Status Message */
.status-message {
  position: fixed;
  bottom: 30px;
  right: 30px;
  padding: 15px 25px;
  border-radius: 8px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: slideIn 0.3s ease-out;
  z-index: 1000;
}

.status-message.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.status-message.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.status-message.info {
  background: #d1ecf1;
  color: #0c5460;
  border: 1px solid #bee5eb;
}

@keyframes slideIn {
  from {
    transform: translateX(400px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Responsive */
@media (max-width: 768px) {
  .security-panel {
    padding: 15px;
  }

  .security-section {
    padding: 20px;
  }

  .whitelist-add {
    flex-direction: column;
  }

  .logs-header {
    flex-direction: column;
    align-items: stretch;
  }

  .status-message {
    left: 15px;
    right: 15px;
    bottom: 15px;
  }
}
</style>
