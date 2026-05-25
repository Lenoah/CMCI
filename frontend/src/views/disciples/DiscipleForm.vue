<template>
  <!-- Formulaire d'inscription / modification d'un disciple
       Règles :
       - Dirigeant peut inscrire un nouveau disciple (rôle forcé à 'Disciple')
       - Dirigeant peut modifier ses membres MAIS ne peut PAS changer leur rôle
       - Leader peut tout faire (y compris changer un rôle) -->
  <div>
    <div class="page-header">
      <router-link to="/app/disciples" class="btn-retour">← Retour</router-link>
      <h2 class="page-titre">{{ estModification ? 'Modifier le disciple' : 'Nouveau disciple' }}</h2>
    </div>

    <div class="carte">
      <AlertMessage :message="erreur" type="erreur" />
      <AlertMessage :message="succes" type="succes" />

      <form @submit.prevent="sauvegarder" class="formulaire">
        <div class="form-row">
          <div class="form-group">
            <label>Prénom *</label>
            <input v-model="form.prenom" type="text" required />
          </div>
          <div class="form-group">
            <label>Nom *</label>
            <input v-model="form.nom" type="text" required />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Téléphone *</label>
            <input v-model="form.telephone" type="tel" required />
          </div>
          <div class="form-group">
            <label>Pays</label>
            <input v-model="form.pays" type="text" />
          </div>
        </div>

        <!-- En mode création, on demande le mot de passe initial -->
        <div v-if="!estModification" class="form-group">
          <label>Mot de passe initial *</label>
          <input v-model="form.motDePasse" type="password" required minlength="4" />
        </div>

        <div class="form-row">
          <!-- Le champ rôle n'est éditable que pour les Leaders ; les Dirigeants ne peuvent PAS changer un rôle -->
          <div class="form-group">
            <label>Rôle</label>
            <select v-if="auth.estLeader" v-model="form.role">
              <option v-for="r in roles" :key="r" :value="r">{{ r }}</option>
            </select>
            <input v-else type="text" :value="form.role" disabled class="champ-lecture" />
            <span v-if="!auth.estLeader" class="aide-champ">
              Seul un Leader peut changer le rôle d'un disciple.
            </span>
          </div>
          <div class="form-group">
            <label>Statut</label>
            <select v-model="form.statut">
              <option value="Actif">Actif</option>
              <option value="Inactif">Inactif</option>
              <option value="Suspendu">Suspendu</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label>Niveau de formation</label>
          <input v-model.number="form.niveauFormation" type="number" min="1" max="10" />
        </div>

        <div class="form-actions">
          <router-link to="/app/disciples" class="btn-annuler">Annuler</router-link>
          <button type="submit" :disabled="loading" class="btn-sauvegarder">
            {{ loading ? 'Enregistrement...' : 'Enregistrer' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useDisciplesStore } from '@/stores/disciples';
import { useAuthStore } from '@/stores/auth';
import api from '@/services/api';
import AlertMessage from '@/components/common/AlertMessage.vue';

const route = useRoute();
const router = useRouter();
const store = useDisciplesStore();
const auth = useAuthStore();

const estModification = computed(() => !!route.params.id);
const roles = ['Disciple', 'Dirigeant', 'LeaderNat', 'LeaderReg', 'LeaderMon', 'RespContenus'];
const erreur = ref('');
const succes = ref('');
const loading = ref(false);

// Un nouveau compte est TOUJOURS créé avec role='Disciple'
const form = reactive({
  prenom: '', nom: '', telephone: '', pays: '', motDePasse: '',
  role: 'Disciple', statut: 'Actif', niveauFormation: 1,
});

// Si modification, pré-remplir le formulaire
onMounted(async () => {
  if (estModification.value) {
    await store.fetchById(route.params.id);
    const d = store.disciple;
    if (d) Object.assign(form, {
      prenom: d.prenom, nom: d.nom, telephone: d.telephone, pays: d.pays,
      role: d.role, statut: d.statut, niveauFormation: d.niveauFormation,
    });
  }
});

async function sauvegarder() {
  erreur.value = '';
  succes.value = '';
  loading.value = true;
  try {
    if (estModification.value) {
      // Si l'utilisateur n'est pas Leader, on n'envoie PAS le champ role
      const { role, ...sansRole } = form;
      const payload = auth.estLeader ? form : sansRole;
      await store.update(route.params.id, payload);
    } else {
      // Création : on passe par /auth/register qui force role='Disciple'
      await api.post('/auth/register', {
        nom: form.nom,
        prenom: form.prenom,
        telephone: form.telephone,
        motDePasse: form.motDePasse,
        pays: form.pays,
      });
    }
    succes.value = 'Disciple enregistré avec succès.';
    setTimeout(() => router.push('/app/disciples'), 1500);
  } catch (err) {
    erreur.value = err.response?.data?.message || 'Erreur lors de l\'enregistrement.';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.page-header { display: flex; align-items: center; gap: 1rem; margin-bottom: var(--space-lg); }
.page-titre { font-size: var(--font-size-xl); font-weight: 700; color: var(--primary); margin: 0; }
.btn-retour { color: var(--primary); font-size: var(--font-size-sm); }
.carte { background: var(--bg-card); border-radius: var(--radius-lg); padding: 1.75rem; box-shadow: var(--shadow-sm); max-width: 700px; }
.formulaire { display: flex; flex-direction: column; gap: 1rem; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.form-group { display: flex; flex-direction: column; gap: 0.35rem; }
.form-group label { font-size: var(--font-size-sm); font-weight: 500; color: var(--text-primary); }
.form-group input, .form-group select { padding: 0.55rem 0.75rem; border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 0.9rem; outline: none; }
.form-group input:focus, .form-group select:focus { border-color: var(--primary); }
.champ-lecture { background: var(--bg-page); color: var(--text-secondary); }
.aide-champ { font-size: 0.75rem; color: var(--text-light); }
.form-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 0.5rem; }
.btn-annuler { padding: 0.55rem 1rem; border: 1px solid var(--border); background: var(--bg-card); border-radius: var(--radius-sm); font-size: var(--font-size-sm); text-decoration: none; color: var(--text-primary); }
.btn-sauvegarder { padding: 0.55rem 1.25rem; background: var(--primary); color: var(--text-white); border: none; border-radius: var(--radius-sm); font-size: var(--font-size-sm); font-weight: 600; cursor: pointer; }
.btn-sauvegarder:disabled { opacity: 0.6; cursor: not-allowed; }
</style>
