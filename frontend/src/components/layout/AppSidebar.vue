<template>
  <!-- Barre de navigation latérale fixe, adaptée au rôle de l'utilisateur -->
  <nav class="sidebar">
    <!-- Logo CMCI -->
    <div class="sidebar-brand">
      <span class="brand-name">CMCI</span>
    </div>

    <!-- Liens de navigation -->
    <ul class="nav-list">
      <li v-for="lien in liens" :key="lien.nom">
        <router-link :to="lien.vers" class="sidebar-link" active-class="sidebar-link-active">
          {{ lien.nom }}
        </router-link>
      </li>
    </ul>

    <!-- Infos utilisateur + déconnexion en bas -->
    <div class="sidebar-footer">
      <div class="user-info">
        <span class="user-nom">{{ utilisateur?.prenom }} {{ utilisateur?.nom }}</span>
        <span class="user-role">{{ utilisateur?.role }}</span>
      </div>
      <button class="btn-logout" @click="deconnexion">Déconnexion</button>
    </div>
  </nav>
</template>

<script setup>
// Sidebar fixe qui affiche les liens selon le rôle de l'utilisateur connecté
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { storeToRefs } from 'pinia';

const router = useRouter();
const auth = useAuthStore();
const { utilisateur } = storeToRefs(auth);
const role = computed(() => utilisateur.value?.role || '');

// Construction des liens de navigation selon le rôle
// Un seul lien par destination — pas de doublon "Mon Avancement / Évaluer Avancements"
const liens = computed(() => {
  const r = role.value;

  if (r === 'Disciple') {
    return [
      { nom: 'Tableau de bord', vers: '/app/dashboard' },
      { nom: 'Mes Routines',    vers: '/app/routines' },
      { nom: 'Réunions',        vers: '/app/reunions' },
      { nom: 'Contenus',        vers: '/app/contenus' },
      { nom: 'Mon Avancement',  vers: '/app/validations' },
    ];
  }

  if (r === 'Dirigeant') {
    return [
      { nom: 'Tableau de bord', vers: '/app/dashboard' },
      { nom: 'Mes Routines',    vers: '/app/routines' },
      { nom: 'Mon Église',      vers: '/app/eglises' },
      { nom: 'Mes Disciples',   vers: '/app/disciples' },
      { nom: 'Réunions',        vers: '/app/reunions' },
      { nom: 'Contenus',        vers: '/app/contenus' },
      { nom: 'Avancements',     vers: '/app/validations' },
    ];
  }

  if (['LeaderNat', 'LeaderReg', 'LeaderMon'].includes(r)) {
    return [
      { nom: 'Tableau de bord',    vers: '/app/dashboard' },
      { nom: 'Tous les Disciples', vers: '/app/disciples' },
      { nom: 'Toutes les Églises', vers: '/app/eglises' },
      { nom: 'Réunions',           vers: '/app/reunions' },
      { nom: 'Contenus',           vers: '/app/contenus' },
      { nom: 'Avancements',        vers: '/app/validations' },
    ];
  }

  if (r === 'RespContenus') {
    return [
      { nom: 'Tableau de bord', vers: '/app/dashboard' },
      { nom: 'Gérer Contenus',  vers: '/app/contenus' },
    ];
  }

  // Par défaut (rôle inconnu) — minimum
  return [{ nom: 'Tableau de bord', vers: '/app/dashboard' }];
});

function deconnexion() {
  auth.logout();
  router.push({ name: 'Login' });
}
</script>

<style scoped>
/* Sidebar fixe sur toute la hauteur de la fenêtre */
.sidebar {
  width: 260px;
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  background: var(--bg-sidebar);
  display: flex;
  flex-direction: column;
  z-index: 100;
}

/* Logo en haut */
.sidebar-brand {
  padding: var(--space-lg) var(--space-lg);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
.brand-name {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--text-white);
  letter-spacing: 0.08em;
}

/* Liste de liens */
.nav-list {
  list-style: none;
  padding: var(--space-sm) 0;
  flex: 1;
  overflow-y: auto;
}

/* Lien de navigation */
.sidebar-link {
  display: block;
  padding: 10px var(--space-lg);
  color: rgba(255, 255, 255, 0.7);
  font-size: var(--font-size-sm);
  transition: var(--transition);
}
.sidebar-link:hover {
  color: var(--text-white);
  background: rgba(255, 255, 255, 0.08);
  text-decoration: none;
}
.sidebar-link-active {
  color: var(--text-white);
  background: rgba(255, 255, 255, 0.12);
  font-weight: 500;
}

/* Pied de sidebar : infos utilisateur */
.sidebar-footer {
  padding: var(--space-md) var(--space-lg);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}
.user-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.user-nom {
  font-size: var(--font-size-sm);
  color: var(--text-white);
  font-weight: 500;
}
.user-role {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
}
.btn-logout {
  width: 100%;
  background: transparent;
  color: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: var(--font-size-sm);
  transition: var(--transition);
  text-align: center;
}
.btn-logout:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-white);
}

/* Sur mobile, on masque la sidebar */
@media (max-width: 768px) {
  .sidebar {
    transform: translateX(-100%);
    transition: transform 0.25s ease;
  }
}
</style>
