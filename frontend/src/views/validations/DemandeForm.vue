<template>
  <!-- Formulaire pour le dirigeant : initier une demande d'avancement pour un disciple -->
  <div>
    <div class="page-header">
      <router-link to="/app/validations" class="btn-retour">← Retour</router-link>
      <h2 class="page-titre">Nouvelle demande d'avancement</h2>
    </div>

    <div class="carte">
      <p class="aide">
        En tant que dirigeant, vous pouvez initier une demande d'avancement pour un disciple
        de votre église. La demande sera ensuite validée par un leader.
      </p>

      <AlertMessage :message="erreur" type="erreur" />
      <AlertMessage :message="succes" type="succes" />

      <form @submit.prevent="sauvegarder" class="formulaire">
        <div class="form-group">
          <label>Disciple concerné *</label>
          <select v-model.number="form.idDisciple" required>
            <option value="" disabled>-- Choisir un disciple --</option>
            <option v-for="d in disciples" :key="d.idDisciple" :value="d.idDisciple">
              {{ d.prenom }} {{ d.nom }} — Niveau actuel : {{ d.niveauFormation }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>Niveau demandé *</label>
          <input
            v-model.number="form.niveauDemande"
            type="number"
            min="2"
            max="10"
            required
            placeholder="ex : 2"
          />
          <span class="aide-champ">Le disciple doit progresser au moins d'un niveau.</span>
        </div>

        <div class="form-actions">
          <router-link to="/app/validations" class="btn-annuler">Annuler</router-link>
          <button type="submit" :disabled="loading" class="btn-sauvegarder">
            {{ loading ? 'Envoi...' : 'Envoyer la demande' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useValidationsStore } from '@/stores/validations';
import api from '@/services/api';
import AlertMessage from '@/components/common/AlertMessage.vue';

const router = useRouter();
const store = useValidationsStore();

const disciples = ref([]); // membres de l'église du dirigeant
const erreur = ref('');
const succes = ref('');
const loading = ref(false);

const form = reactive({ idDisciple: '', niveauDemande: 2 });

// Charger les disciples de l'église du dirigeant connecté
onMounted(async () => {
  try {
    // On récupère d'abord l'église du dirigeant
    const { data: dash } = await api.get('/dashboard/dirigeant');
    if (dash.eglise) {
      const { data } = await api.get('/disciples', { params: { eglise_id: dash.eglise.idEglise } });
      // On exclut les rôles avancés — seuls les disciples simples peuvent avancer
      disciples.value = data.filter((d) => d.role === 'Disciple');
    }
  } catch {
    erreur.value = 'Impossible de charger la liste des disciples.';
  }
});

async function sauvegarder() {
  erreur.value = '';
  succes.value = '';
  loading.value = true;
  try {
    await store.create({ idDisciple: form.idDisciple, niveauDemande: form.niveauDemande });
    succes.value = 'Demande d\'avancement envoyée avec succès !';
    setTimeout(() => router.push('/app/validations'), 1500);
  } catch (err) {
    erreur.value = err.response?.data?.message || 'Erreur lors de l\'envoi.';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.page-header { display: flex; align-items: center; gap: 1rem; margin-bottom: var(--space-lg); }
.page-titre { font-size: var(--font-size-xl); font-weight: 700; color: var(--primary); margin: 0; }
.btn-retour { color: var(--primary); font-size: var(--font-size-sm); }
.carte { background: var(--bg-card); border-radius: var(--radius-lg); padding: 1.75rem; box-shadow: var(--shadow-sm); max-width: 550px; }
.aide { font-size: var(--font-size-sm); color: var(--text-secondary); margin-bottom: var(--space-lg); padding: 0.75rem; background: var(--bg-page); border-radius: var(--radius-sm); border-left: 3px solid var(--primary); }
.formulaire { display: flex; flex-direction: column; gap: 1rem; }
.form-group { display: flex; flex-direction: column; gap: 0.35rem; }
.form-group label { font-size: var(--font-size-sm); font-weight: 500; color: var(--text-primary); }
.form-group input, .form-group select { padding: 0.55rem 0.75rem; border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 0.9rem; outline: none; }
.form-group input:focus, .form-group select:focus { border-color: var(--primary); }
.aide-champ { font-size: 0.78rem; color: var(--text-light); }
.form-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 0.5rem; }
.btn-annuler { padding: 0.55rem 1rem; border: 1px solid var(--border); background: var(--bg-card); border-radius: var(--radius-sm); font-size: var(--font-size-sm); text-decoration: none; color: var(--text-primary); }
.btn-sauvegarder { padding: 0.55rem 1.25rem; background: var(--primary); color: var(--text-white); border: none; border-radius: var(--radius-sm); font-size: var(--font-size-sm); font-weight: 600; cursor: pointer; }
.btn-sauvegarder:disabled { opacity: 0.6; cursor: not-allowed; }
</style>
