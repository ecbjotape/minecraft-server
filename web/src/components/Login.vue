<template>
  <div class="login-overlay">
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <div class="login-icon">🔐</div>
          <h1>Servidor Minecraft</h1>
          <p class="login-subtitle">Autenticação Necessária</p>
        </div>

        <form @submit.prevent="handleLogin" class="login-form">
          <div class="form-group">
            <label for="username">Usuário</label>
            <input
              id="username"
              v-model="username"
              type="text"
              placeholder="Digite seu usuário"
              autocomplete="username"
              required
              :disabled="loading"
            />
          </div>

          <div class="form-group">
            <label for="password">Senha</label>
            <input
              id="password"
              v-model="password"
              type="password"
              placeholder="Digite sua senha"
              autocomplete="current-password"
              required
              :disabled="loading"
            />
          </div>

          <div v-if="error" class="error-message">
            {{ error }}
          </div>

          <button type="submit" class="login-button" :disabled="loading">
            <span v-if="!loading">Entrar</span>
            <span v-else class="spinner-small"></span>
          </button>
        </form>

        <div class="login-footer">
          <p>🔒 Suas credenciais são criptografadas</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import axios from "axios";

const emit = defineEmits<{
  authenticated: [];
}>();

const username = ref("");
const password = ref("");
const loading = ref(false);
const error = ref("");

const handleLogin = async () => {
  if (!username.value || !password.value) {
    error.value = "Preencha todos os campos";
    return;
  }

  loading.value = true;
  error.value = "";

  try {
    const response = await axios.post("/api/auth", {
      action: "login",
      username: username.value,
      password: password.value,
    });

    if (response.data.success) {
      // Store token
      localStorage.setItem("auth_token", response.data.token);
      localStorage.setItem("username", response.data.username);

      // Emit event to parent
      emit("authenticated");
    }
  } catch (err: any) {
    const errorMessage =
      err.response?.data?.error || "Erro ao fazer login. Tente novamente.";
    error.value = errorMessage;
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-overlay {
  position: fixed;
  inset: 0;
  background: var(--bg-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.login-container {
  width: 100%;
  max-width: 400px;
  padding: 1rem;
}

.login-card {
  background: var(--bg-card);
  border-radius: 20px;
  padding: 3rem 2rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border-color);
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.login-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.login-header h1 {
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: var(--text-primary);
}

.login-subtitle {
  color: var(--text-secondary);
  font-size: 0.95rem;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.95rem;
}

.form-group input {
  padding: 0.875rem 1rem;
  border: 2px solid var(--border-color);
  border-radius: 12px;
  font-size: 1rem;
  background: var(--bg-secondary);
  color: var(--text-primary);
  transition: all 0.3s ease;
}

.form-group input:focus {
  outline: none;
  border-color: var(--accent-blue);
  box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.1);
}

.form-group input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  background: rgba(239, 68, 68, 0.1);
  color: var(--accent-red);
  padding: 0.875rem 1rem;
  border-radius: 12px;
  font-size: 0.9rem;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.login-button {
  padding: 1rem;
  background: linear-gradient(135deg, var(--accent-blue), var(--accent-purple));
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1.05rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 0.5rem;
}

.login-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(96, 165, 250, 0.3);
}

.login-button:active:not(:disabled) {
  transform: translateY(0);
}

.login-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinner-small {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.login-footer {
  margin-top: 2rem;
  text-align: center;
}

.login-footer p {
  color: var(--text-secondary);
  font-size: 0.85rem;
}
</style>
