<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-header">
        <img :src="logo" alt="Logo CMCI" class="login-logo" />
        <p>Communauté Missionnaire Chrétienne Internationale</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="telephone">Téléphone</label>
          <input
            id="telephone"
            v-model="form.telephone"
            type="tel"
            placeholder="ex : 0600000001"
            autocomplete="username"
            required
          />
        </div>

        <div class="form-group">
          <label for="motDePasse">Mot de passe</label>
          <input
            id="motDePasse"
            v-model="form.motDePasse"
            type="password"
            placeholder="••••••••"
            autocomplete="current-password"
            required
          />
        </div>

        <p v-if="erreur" class="error-message">{{ erreur }}</p>

        <button type="submit" :disabled="loading" class="btn-primary">
          {{ loading ? 'Connexion...' : 'Se connecter' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import logo from '@/assets/logo.png';

const router = useRouter();
const auth = useAuthStore();

const form = reactive({ telephone: '', motDePasse: '' });
const erreur = ref('');
const loading = ref(false);

async function handleLogin() {
  erreur.value = '';
  loading.value = true;
  try {
    await auth.login(form.telephone, form.motDePasse);
    router.push('/app/dashboard');
  } catch (err) {
    erreur.value = err.response?.data?.message || 'Erreur de connexion. Réessayez.';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--bg-page); }
.login-card { background: var(--bg-card); border-radius: var(--radius-lg); padding: 2.5rem 2rem; width: 100%; max-width: 400px; box-shadow: var(--shadow-lg); }
.login-header { text-align: center; margin-bottom: 2rem; }
.login-logo {
  width: 104px;
  height: 104px;
  object-fit: cover;
  border-radius: 50%;
  display: block;
  margin: 0 auto 1rem;
  background: #fff;
  border: 3px solid var(--bg-page);
  box-shadow: var(--shadow-md);
}
.login-header h1 { font-size: var(--font-size-2xl); font-weight: 700; color: var(--primary); margin: 0 0 0.25rem; }
.login-header p { font-size: 0.85rem; color: var(--text-secondary); margin: 0; }
.login-form { display: flex; flex-direction: column; gap: 1.25rem; }
.form-group { display: flex; flex-direction: column; gap: 0.4rem; }
.form-group label { font-size: var(--font-size-sm); font-weight: 500; color: var(--text-primary); }
.form-group input { padding: 0.6rem 0.75rem; border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 0.95rem; outline: none; transition: var(--transition); }
.form-group input:focus { border-color: var(--primary); }
.error-message { color: var(--danger); font-size: 0.85rem; margin: 0; }
.btn-primary { padding: 0.7rem; background: var(--primary); color: var(--text-white); border: none; border-radius: var(--radius-sm); font-size: 1rem; font-weight: 600; cursor: pointer; transition: var(--transition); }
.btn-primary:hover:not(:disabled) { background: var(--primary-dark); }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
</style>
