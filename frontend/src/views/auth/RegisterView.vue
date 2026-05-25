<template>
  <!-- Page d'inscription d'un nouveau disciple -->
  <div class="login-page">
    <div class="login-card">
      <div class="login-header">
        <h1>CMCI</h1>
        <p>Créer un compte disciple</p>
      </div>

      <form @submit.prevent="handleRegister" class="login-form">
        <div class="form-row">
          <div class="form-group">
            <label>Nom</label>
            <input v-model="form.nom" type="text" placeholder="Dupont" required />
          </div>
          <div class="form-group">
            <label>Prénom</label>
            <input v-model="form.prenom" type="text" placeholder="Jean" required />
          </div>
        </div>

        <div class="form-group">
          <label>Téléphone</label>
          <input v-model="form.telephone" type="tel" placeholder="0600000001" required />
        </div>

        <div class="form-group">
          <label>Pays</label>
          <input v-model="form.pays" type="text" placeholder="France" />
        </div>

        <div class="form-group">
          <label>Mot de passe</label>
          <input v-model="form.motDePasse" type="password" placeholder="••••••••" required />
        </div>

        <p v-if="erreur" class="error-message">{{ erreur }}</p>
        <p v-if="succes" class="succes-message">{{ succes }}</p>

        <button type="submit" :disabled="loading" class="btn-primary">
          {{ loading ? 'Inscription...' : 'S\'inscrire' }}
        </button>
      </form>

      <p class="register-link">
        Déjà inscrit ? <router-link to="/login">Se connecter</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/services/api';

const router = useRouter();
const form = reactive({ nom: '', prenom: '', telephone: '', pays: '', motDePasse: '' });
const erreur = ref('');
const succes = ref('');
const loading = ref(false);

async function handleRegister() {
  erreur.value = '';
  succes.value = '';
  loading.value = true;
  try {
    await api.post('/auth/register', form);
    succes.value = 'Inscription réussie ! Redirection vers la connexion...';
    setTimeout(() => router.push('/login'), 2000);
  } catch (err) {
    erreur.value = err.response?.data?.message || 'Erreur lors de l\'inscription.';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--bg-page); }
.login-card { background: var(--bg-card); border-radius: var(--radius-lg); padding: 2.5rem 2rem; width: 100%; max-width: 440px; box-shadow: var(--shadow-lg); }
.login-header { text-align: center; margin-bottom: 1.5rem; }
.login-header h1 { font-size: var(--font-size-2xl); font-weight: 700; color: var(--primary); margin: 0 0 0.25rem; }
.login-header p { font-size: 0.85rem; color: var(--text-secondary); margin: 0; }
.login-form { display: flex; flex-direction: column; gap: 1rem; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
.form-group { display: flex; flex-direction: column; gap: 0.35rem; }
.form-group label { font-size: var(--font-size-sm); font-weight: 500; color: var(--text-primary); }
.form-group input { padding: 0.6rem 0.75rem; border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 0.9rem; outline: none; }
.form-group input:focus { border-color: var(--primary); }
.error-message { color: var(--danger); font-size: 0.85rem; margin: 0; }
.succes-message { color: var(--success); font-size: 0.85rem; margin: 0; }
.btn-primary { padding: 0.7rem; background: var(--primary); color: var(--text-white); border: none; border-radius: var(--radius-sm); font-size: 1rem; font-weight: 600; cursor: pointer; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.register-link { text-align: center; margin-top: 1.25rem; font-size: var(--font-size-sm); color: var(--text-secondary); }
.register-link a { color: var(--primary); font-weight: 600; }
</style>
