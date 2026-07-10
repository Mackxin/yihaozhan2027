<script setup>
import { ref, nextTick } from 'vue'

const emit = defineEmits(['login', 'close'])

const username = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)
const pwdRef = ref(null)

const handleLogin = async () => {
  if (!username.value.trim() || !password.value) {
    error.value = '请输入账号和密码'
    return
  }
  loading.value = true
  error.value = ''

  // Hash credentials and compare
  try {
    const hash = await sha256(username.value.trim() + ':' + password.value)
    // Default: admin / yihao2027
    const expectedHash = '84a9dc004326fe812ac668738d5ec8601133d53f5371e85b703f1dafea6954bd'

    // On first use or if hash doesn't match default, check against stored hash
    const storedHash = localStorage.getItem('yihao_admin_hash')

    if (hash === expectedHash || (storedHash && hash === storedHash)) {
      emit('login')
    } else {
      error.value = '账号或密码错误'
      password.value = ''
      nextTick(() => pwdRef.value?.focus())
    }
  } catch {
    error.value = '登录失败，请重试'
  } finally {
    loading.value = false
  }
}

async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message)
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

const handleClose = () => {
  emit('close')
}
</script>

<template>
  <div class="login-overlay" @click.self="handleClose">
    <div class="login-modal">
      <div class="login-header">
        <h2>管理后台</h2>
        <p>请输入账号密码登录</p>
      </div>
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="login-field">
          <label>账号</label>
          <input v-model="username" type="text" placeholder="请输入账号" autocomplete="username" autofocus />
        </div>
        <div class="login-field">
          <label>密码</label>
          <input ref="pwdRef" v-model="password" type="password" placeholder="请输入密码" autocomplete="current-password" />
        </div>
        <p v-if="error" class="login-error">{{ error }}</p>
        <button type="submit" class="login-submit" :disabled="loading">
          {{ loading ? '登录中...' : '登 录' }}
        </button>
      </form>
    </div>
  </div>
</template>

<style>
.login-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  /* 必须高于底部 tab 栏(z-index:9999)，否则 tab 栏会盖在登录层之上、且可点击穿透 */
  z-index: 10001;
}
.login-modal {
  background: #fff;
  border-radius: 20px;
  padding: 2.5rem 2rem;
  width: 360px;
  max-width: 90vw;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}
.login-header {
  text-align: center;
  margin-bottom: 1.5rem;
}
.login-header h2 {
  font-size: 1.4rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.3rem;
}
.login-header p {
  font-size: 0.85rem;
  color: #94a3b8;
  margin: 0;
}
.login-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.login-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.login-field label {
  font-size: 0.82rem;
  font-weight: 600;
  color: #475569;
}
.login-field input {
  padding: 10px 14px;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  font-size: 0.95rem;
  color: #1e293b;
  outline: none;
  transition: border-color 0.15s;
}
.login-field input:focus {
  border-color: #ff1d55;
}
.login-error {
  color: #ef4444;
  font-size: 0.82rem;
  margin: -4px 0;
  text-align: center;
}
.login-submit {
  padding: 12px;
  border: none;
  border-radius: 12px;
  background: #ff1d55;
  color: #fff;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
  margin-top: 0.5rem;
}
.login-submit:hover { background: #e0184d; }
.login-submit:disabled { opacity: 0.6; cursor: not-allowed; }

/* Dark Mode */
[data-theme="dark"] .login-modal { background: #1e293b; }
[data-theme="dark"] .login-header h2 { color: #f1f5f9; }
[data-theme="dark"] .login-field label { color: #94a3b8; }
[data-theme="dark"] .login-field input {
  background: #0f172a;
  border-color: #334155;
  color: #f1f5f9;
}
[data-theme="dark"] .login-field input:focus { border-color: #ff1d55; }
</style>
