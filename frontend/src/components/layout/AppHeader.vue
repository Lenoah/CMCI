<template>
  <!-- En-tête fixé en haut du contenu : affiche le rôle de l'utilisateur -->
  <header class="app-header">
    <div class="header-left">
      <h1 class="page-title">{{ route.name || 'CMCI' }}</h1>
    </div>
    <div class="header-right">
      <span class="role-badge">{{ utilisateur?.role }}</span>
      <router-link to="/app/profil" class="user-bloc">
        <span class="user-name">{{ utilisateur?.prenom }} {{ utilisateur?.nom }}</span>
        <img v-if="utilisateur?.photoUrl" :src="utilisateur.photoUrl" alt="Photo" class="avatar" />
        <span v-else class="avatar avatar-initiales">{{ initiales }}</span>
      </router-link>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';

const auth = useAuthStore();
const { utilisateur } = storeToRefs(auth);
const route = useRoute();

// Initiales affichées dans l'avatar à défaut de photo
const initiales = computed(() => {
  const u = utilisateur.value;
  if (!u) return '?';
  return `${u.prenom?.[0] || ''}${u.nom?.[0] || ''}`.toUpperCase();
});
</script>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-md) var(--space-xl);
  background: var(--bg-card);
  border-bottom: 1px solid var(--border);
  box-shadow: var(--shadow-sm);
  position: sticky;
  top: 0;
  z-index: 50;
}

.page-title {
  font-size: var(--font-size-xl);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.user-bloc {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.user-name {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  font-weight: 500;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
}
.avatar-initiales {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--primary);
  color: var(--text-white);
  font-size: var(--font-size-sm);
  font-weight: 600;
}

.role-badge {
  background: var(--primary);
  color: var(--text-white);
  font-size: 0.72rem;
  padding: 4px 10px;
  border-radius: 20px;
  font-weight: 500;
}
</style>
