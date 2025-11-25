<template>
  <div class="config-panel">
    <h2>⚙️ Configurações do Servidor</h2>

    <div class="config-sections">
      <!-- Server Properties Section -->
      <div class="config-section">
        <h3>🎮 Configurações Gerais</h3>
        <div class="config-grid">
          <div class="config-item">
            <label for="motd">MOTD (Mensagem do Servidor)</label>
            <input
              id="motd"
              v-model="config.motd"
              type="text"
              placeholder="Um Servidor Minecraft"
              :disabled="loading"
            />
            <span class="config-hint"
              >Mensagem exibida na lista de servidores</span
            >
          </div>

          <div class="config-item">
            <label for="max-players">Máximo de Jogadores</label>
            <input
              id="max-players"
              v-model.number="config.maxPlayers"
              type="number"
              min="1"
              max="100"
              :disabled="loading"
            />
            <span class="config-hint">Limite de jogadores simultâneos</span>
          </div>

          <div class="config-item">
            <label for="difficulty">Dificuldade</label>
            <select
              id="difficulty"
              v-model="config.difficulty"
              :disabled="loading"
            >
              <option value="peaceful">Pacífico</option>
              <option value="easy">Fácil</option>
              <option value="normal">Normal</option>
              <option value="hard">Difícil</option>
            </select>
            <span class="config-hint">Dificuldade do jogo</span>
          </div>

          <div class="config-item">
            <label for="gamemode">Modo de Jogo Padrão</label>
            <select id="gamemode" v-model="config.gamemode" :disabled="loading">
              <option value="survival">Sobrevivência</option>
              <option value="creative">Criativo</option>
              <option value="adventure">Aventura</option>
              <option value="spectator">Espectador</option>
            </select>
            <span class="config-hint">Modo padrão para novos jogadores</span>
          </div>

          <div class="config-item">
            <label for="view-distance">Distância de Renderização</label>
            <input
              id="view-distance"
              v-model.number="config.viewDistance"
              type="number"
              min="3"
              max="32"
              :disabled="loading"
            />
            <span class="config-hint">Chunks (3-32, padrão: 10)</span>
          </div>

          <div class="config-item">
            <label for="simulation-distance">Distância de Simulação</label>
            <input
              id="simulation-distance"
              v-model.number="config.simulationDistance"
              type="number"
              min="3"
              max="32"
              :disabled="loading"
            />
            <span class="config-hint">Chunks simulados (3-32, padrão: 10)</span>
          </div>
        </div>
      </div>

      <!-- World Settings Section -->
      <div class="config-section">
        <h3>🌍 Configurações do Mundo</h3>
        <div class="config-grid">
          <div class="config-item">
            <label for="level-name">Nome do Mundo</label>
            <input
              id="level-name"
              v-model="config.levelName"
              type="text"
              placeholder="world"
              :disabled="loading"
            />
            <span class="config-hint">Nome da pasta do mundo</span>
          </div>

          <div class="config-item">
            <label for="level-seed">Seed do Mundo</label>
            <input
              id="level-seed"
              v-model="config.levelSeed"
              type="text"
              placeholder="(aleatória)"
              :disabled="loading"
            />
            <span class="config-hint">Seed para geração do mundo</span>
          </div>

          <div class="config-item">
            <label for="level-type">Tipo de Mundo</label>
            <select
              id="level-type"
              v-model="config.levelType"
              :disabled="loading"
            >
              <option value="minecraft:normal">Normal</option>
              <option value="minecraft:flat">Plano</option>
              <option value="minecraft:large_biomes">Biomas Grandes</option>
              <option value="minecraft:amplified">Amplificado</option>
            </select>
            <span class="config-hint">Tipo de geração do terreno</span>
          </div>

          <div class="config-item checkbox-item">
            <label>
              <input
                v-model="config.generateStructures"
                type="checkbox"
                :disabled="loading"
              />
              <span>Gerar Estruturas</span>
            </label>
            <span class="config-hint">Vilas, templos, fortalezas, etc.</span>
          </div>

          <div class="config-item checkbox-item">
            <label>
              <input
                v-model="config.spawnAnimals"
                type="checkbox"
                :disabled="loading"
              />
              <span>Spawn de Animais</span>
            </label>
            <span class="config-hint">Permite spawn de animais passivos</span>
          </div>

          <div class="config-item checkbox-item">
            <label>
              <input
                v-model="config.spawnMonsters"
                type="checkbox"
                :disabled="loading"
              />
              <span>Spawn de Monstros</span>
            </label>
            <span class="config-hint">Permite spawn de monstros hostis</span>
          </div>

          <div class="config-item checkbox-item">
            <label>
              <input
                v-model="config.spawnNpcs"
                type="checkbox"
                :disabled="loading"
              />
              <span>Spawn de NPCs</span>
            </label>
            <span class="config-hint">Permite spawn de aldeões</span>
          </div>

          <div class="config-item checkbox-item">
            <label>
              <input
                v-model="config.allowNether"
                type="checkbox"
                :disabled="loading"
              />
              <span>Permitir Nether</span>
            </label>
            <span class="config-hint">Habilita portal para o Nether</span>
          </div>
        </div>
      </div>

      <!-- PvP and Combat Section -->
      <div class="config-section">
        <h3>⚔️ PvP e Combate</h3>
        <div class="config-grid">
          <div class="config-item checkbox-item">
            <label>
              <input v-model="config.pvp" type="checkbox" :disabled="loading" />
              <span>PvP Habilitado</span>
            </label>
            <span class="config-hint">Jogadores podem se atacar</span>
          </div>

          <div class="config-item checkbox-item">
            <label>
              <input
                v-model="config.hardcore"
                type="checkbox"
                :disabled="loading"
              />
              <span>Modo Hardcore</span>
            </label>
            <span class="config-hint">Morte permanente (ban ao morrer)</span>
          </div>
        </div>
      </div>

      <!-- Server Performance Section -->
      <div class="config-section">
        <h3>⚡ Performance</h3>
        <div class="config-grid">
          <div class="config-item">
            <label for="max-tick-time">Tempo Máximo de Tick (ms)</label>
            <input
              id="max-tick-time"
              v-model.number="config.maxTickTime"
              type="number"
              min="-1"
              max="120000"
              :disabled="loading"
            />
            <span class="config-hint">-1 = desativado, 60000 = padrão</span>
          </div>

          <div class="config-item">
            <label for="network-compression">Compressão de Rede</label>
            <input
              id="network-compression"
              v-model.number="config.networkCompression"
              type="number"
              min="-1"
              max="1024"
              :disabled="loading"
            />
            <span class="config-hint">Threshold em bytes (256 = padrão)</span>
          </div>

          <div class="config-item">
            <label for="entity-broadcast-range">Alcance de Entidades (%)</label>
            <input
              id="entity-broadcast-range"
              v-model.number="config.entityBroadcastRange"
              type="number"
              min="10"
              max="1000"
              :disabled="loading"
            />
            <span class="config-hint">100 = padrão</span>
          </div>
        </div>
      </div>

      <!-- Server Security Section -->
      <div class="config-section">
        <h3>🔒 Segurança</h3>
        <div class="config-grid">
          <div class="config-item checkbox-item">
            <label>
              <input
                v-model="config.onlineMode"
                type="checkbox"
                :disabled="loading"
              />
              <span>Modo Online (Autenticação Mojang)</span>
            </label>
            <span class="config-hint">Requer contas Premium da Mojang</span>
          </div>

          <div class="config-item checkbox-item">
            <label>
              <input
                v-model="config.enforceWhitelist"
                type="checkbox"
                :disabled="loading"
              />
              <span>Forçar Whitelist</span>
            </label>
            <span class="config-hint">Kick jogadores não whitelistados</span>
          </div>

          <div class="config-item checkbox-item">
            <label>
              <input
                v-model="config.preventProxyConnections"
                type="checkbox"
                :disabled="loading"
              />
              <span>Prevenir Conexões via Proxy</span>
            </label>
            <span class="config-hint">Bloqueia VPNs e proxies</span>
          </div>

          <div class="config-item">
            <label for="max-players">Taxa de Spawn de Jogadores</label>
            <input
              id="spawn-protection"
              v-model.number="config.spawnProtection"
              type="number"
              min="0"
              max="100"
              :disabled="loading"
            />
            <span class="config-hint">Raio de proteção do spawn (blocos)</span>
          </div>
        </div>
      </div>

      <!-- Advanced Settings Section -->
      <div class="config-section">
        <h3>🔧 Configurações Avançadas</h3>
        <div class="config-grid">
          <div class="config-item checkbox-item">
            <label>
              <input
                v-model="config.enableCommandBlock"
                type="checkbox"
                :disabled="loading"
              />
              <span>Habilitar Command Blocks</span>
            </label>
            <span class="config-hint">Permite uso de command blocks</span>
          </div>

          <div class="config-item checkbox-item">
            <label>
              <input
                v-model="config.enableQuery"
                type="checkbox"
                :disabled="loading"
              />
              <span>Habilitar Query</span>
            </label>
            <span class="config-hint">Protocolo GameSpy4 para status</span>
          </div>

          <div class="config-item checkbox-item">
            <label>
              <input
                v-model="config.enableRcon"
                type="checkbox"
                :disabled="loading"
              />
              <span>Habilitar RCON</span>
            </label>
            <span class="config-hint">Console remoto</span>
          </div>

          <div class="config-item checkbox-item">
            <label>
              <input
                v-model="config.announcePlayerAchievements"
                type="checkbox"
                :disabled="loading"
              />
              <span>Anunciar Conquistas</span>
            </label>
            <span class="config-hint">Mostra conquistas no chat</span>
          </div>

          <div class="config-item checkbox-item">
            <label>
              <input
                v-model="config.enableStatus"
                type="checkbox"
                :disabled="loading"
              />
              <span>Habilitar Status</span>
            </label>
            <span class="config-hint">Permite checagem de status</span>
          </div>

          <div class="config-item">
            <label for="function-permission-level"
              >Nível de Permissão de Funções</label
            >
            <select
              id="function-permission-level"
              v-model.number="config.functionPermissionLevel"
              :disabled="loading"
            >
              <option :value="1">1 - Bypass spawn protection</option>
              <option :value="2">2 - Cheats e command blocks</option>
              <option :value="3">3 - Op player commands</option>
              <option :value="4">4 - All commands</option>
            </select>
            <span class="config-hint">Nível necessário para funções</span>
          </div>

          <div class="config-item">
            <label for="op-permission-level">Nível de Permissão de OP</label>
            <select
              id="op-permission-level"
              v-model.number="config.opPermissionLevel"
              :disabled="loading"
            >
              <option :value="1">1 - Bypass spawn protection</option>
              <option :value="2">2 - Cheats e command blocks</option>
              <option :value="3">3 - Op player commands</option>
              <option :value="4">4 - All commands</option>
            </select>
            <span class="config-hint">Nível padrão para OPs</span>
          </div>

          <div class="config-item">
            <label for="player-idle-timeout"
              >Timeout de Inatividade (min)</label
            >
            <input
              id="player-idle-timeout"
              v-model.number="config.playerIdleTimeout"
              type="number"
              min="0"
              max="1440"
              :disabled="loading"
            />
            <span class="config-hint">0 = desativado</span>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="config-actions">
        <button
          @click="loadConfig"
          :disabled="loading"
          class="btn btn-secondary"
        >
          🔄 Recarregar Configurações
        </button>
        <button @click="saveConfig" :disabled="loading" class="btn btn-primary">
          💾 Salvar Configurações
        </button>
        <button @click="resetConfig" :disabled="loading" class="btn btn-danger">
          ↩️ Restaurar Padrões
        </button>
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

interface ServerConfig {
  // General
  motd: string;
  maxPlayers: number;
  difficulty: string;
  gamemode: string;
  viewDistance: number;
  simulationDistance: number;

  // World
  levelName: string;
  levelSeed: string;
  levelType: string;
  generateStructures: boolean;
  spawnAnimals: boolean;
  spawnMonsters: boolean;
  spawnNpcs: boolean;
  allowNether: boolean;

  // PvP
  pvp: boolean;
  hardcore: boolean;

  // Performance
  maxTickTime: number;
  networkCompression: number;
  entityBroadcastRange: number;

  // Security
  onlineMode: boolean;
  enforceWhitelist: boolean;
  preventProxyConnections: boolean;
  spawnProtection: number;

  // Advanced
  enableCommandBlock: boolean;
  enableQuery: boolean;
  enableRcon: boolean;
  announcePlayerAchievements: boolean;
  enableStatus: boolean;
  functionPermissionLevel: number;
  opPermissionLevel: number;
  playerIdleTimeout: number;
}

const config = ref<ServerConfig>({
  motd: "Um Servidor Minecraft",
  maxPlayers: 20,
  difficulty: "normal",
  gamemode: "survival",
  viewDistance: 10,
  simulationDistance: 10,
  levelName: "world",
  levelSeed: "",
  levelType: "minecraft:normal",
  generateStructures: true,
  spawnAnimals: true,
  spawnMonsters: true,
  spawnNpcs: true,
  allowNether: true,
  pvp: true,
  hardcore: false,
  maxTickTime: 60000,
  networkCompression: 256,
  entityBroadcastRange: 100,
  onlineMode: true,
  enforceWhitelist: false,
  preventProxyConnections: false,
  spawnProtection: 16,
  enableCommandBlock: false,
  enableQuery: false,
  enableRcon: false,
  announcePlayerAchievements: true,
  enableStatus: true,
  functionPermissionLevel: 2,
  opPermissionLevel: 4,
  playerIdleTimeout: 0,
});

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

async function loadConfig() {
  loading.value = true;
  try {
    const response = await axios.get("/api/config/server-properties");

    if (response.data.success) {
      Object.assign(config.value, response.data.config);
      showStatus("Configurações carregadas com sucesso!", "success");
    }
  } catch (error: any) {
    showStatus(
      error.response?.data?.error || "Erro ao carregar configurações",
      "error"
    );
  } finally {
    loading.value = false;
  }
}

async function saveConfig() {
  loading.value = true;
  try {
    const response = await axios.post("/api/config/server-properties", {
      action: "save",
      config: config.value,
    });

    if (response.data.success) {
      showStatus(
        "Configurações salvas! Reinicie o servidor para aplicar.",
        "success"
      );
    }
  } catch (error: any) {
    showStatus(
      error.response?.data?.error || "Erro ao salvar configurações",
      "error"
    );
  } finally {
    loading.value = false;
  }
}

async function resetConfig() {
  if (!confirm("Tem certeza que deseja restaurar as configurações padrão?")) {
    return;
  }

  loading.value = true;
  try {
    const response = await axios.post("/api/config/server-properties", {
      action: "reset",
    });

    if (response.data.success) {
      await loadConfig();
      showStatus("Configurações restauradas para o padrão!", "success");
    }
  } catch (error: any) {
    showStatus(
      error.response?.data?.error || "Erro ao restaurar configurações",
      "error"
    );
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadConfig();
});
</script>

<style scoped>
.config-panel {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.config-panel h2 {
  color: #2c3e50;
  margin-bottom: 30px;
  font-size: 28px;
}

.config-sections {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.config-section {
  background: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.config-section h3 {
  color: #34495e;
  margin-bottom: 20px;
  font-size: 22px;
  border-bottom: 2px solid #3498db;
  padding-bottom: 10px;
}

.config-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.config-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.config-item label {
  font-weight: 600;
  color: #2c3e50;
  font-size: 14px;
}

.config-item input[type="text"],
.config-item input[type="number"],
.config-item select {
  padding: 10px 12px;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  background: #f8f9fa;
  transition: all 0.3s;
}

.config-item input:focus,
.config-item select:focus {
  outline: none;
  border-color: #3498db;
  background: white;
}

.config-item input:disabled,
.config-item select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.checkbox-item label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.checkbox-item input[type="checkbox"] {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.config-hint {
  font-size: 12px;
  color: #7f8c8d;
  font-style: italic;
}

.config-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
  margin-top: 30px;
  flex-wrap: wrap;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
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
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
}

.btn-secondary {
  background: #95a5a6;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #7f8c8d;
}

.btn-danger {
  background: #e74c3c;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #c0392b;
}

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

@media (max-width: 768px) {
  .config-panel {
    padding: 15px;
  }

  .config-section {
    padding: 20px;
  }

  .config-grid {
    grid-template-columns: 1fr;
  }

  .config-actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
    justify-content: center;
  }

  .status-message {
    left: 15px;
    right: 15px;
    bottom: 15px;
  }
}
</style>
