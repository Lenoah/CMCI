<template>
  <!-- Formulaire d'inscription / modification d'un disciple
       Règles :
       - Seul un Dirigeant inscrit un nouveau disciple : le rôle ('Disciple') et
         l'église sont imposés par le serveur ; il ne saisit que nom, prénom,
         téléphone et un mot de passe temporaire.
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
        <div class="form-group">
          <label>Téléphone *</label>
          <input v-model="form.telephone" type="tel" required />
        </div>

        <!-- Création : mot de passe temporaire. L'église et le rôle 'Disciple'
             sont attribués automatiquement par le serveur (pas de choix). -->
        <div v-if="!estModification" class="form-group">
          <label>Mot de passe temporaire *</label>
          <input v-model="form.motDePasse" type="password" required minlength="4" />
          <span class="aide-champ">
            Le disciple sera rattaché à votre église et pourra changer ce mot de passe plus tard.
          </span>
        </div>

        <!-- Champs réservés à la modification d'un disciple existant -->
        <template v-if="estModification">
          <div class="form-row">
            <div class="form-group">
              <label>Pays (selon l'église)</label>
              <input v-model="form.pays" type="text" disabled class="champ-lecture" />
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
          <div class="form-row">
            <!-- Le rôle n'est modifiable que par le Leader Mondial -->
            <div class="form-group">
              <label>Rôle</label>
              <select v-if="auth.estLeaderMon" v-model="form.role">
                <option v-for="r in roles" :key="r" :value="r">{{ r }}</option>
              </select>
              <input v-else type="text" :value="form.role" disabled class="champ-lecture" />
              <span v-if="!auth.estLeaderMon" class="aide-champ">
                Seul le Leader Mondial peut changer le rôle d'un disciple.
              </span>
            </div>
            <div class="form-group">
              <label>Niveau de formation</label>
              <input v-model.number="form.niveauFormation" type="number" min="1" max="10" />
            </div>
          </div>
        </template>

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
      // Seul le Leader Mondial envoie le champ role ; sinon on l'omet
      const { role, ...sansRole } = form;
      const payload = auth.estLeaderMon ? { ...form } : sansRole;
      try {
        await store.update(route.params.id, payload);
      } catch (err) {
        // Le serveur demande confirmation si le poste de leader est déjà occupé
        const data = err.response?.data;
        if (err.response?.status === 409 && data?.besoinConfirmation) {
          if (window.confirm(data.message)) {
            await store.update(route.params.id, { ...payload, remplacer: true });
          } else {
            loading.value = false;
            return;
          }
        } else {
          throw err;
        }
      }
    } else {
      // Création : le serveur force role='Disciple' et rattache le disciple
      // à l'église du dirigeant connecté. On n'envoie que les 4 champs saisis.
      await store.create({
        nom: form.nom,
        prenom: form.prenom,
        telephone: form.telephone,
        motDePasse: form.motDePasse,
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
