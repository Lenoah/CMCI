<template>
  <!-- Mise en page principale : sidebar fixe à gauche, contenu décalé à droite -->
  <div class="layout">
    <AppSidebar />
    <!-- Le contenu est décalé de 260px pour laisser place à la sidebar fixe -->
    <div class="layout-content">
      <AppHeader />
      <main class="layout-main">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import AppSidebar from './AppSidebar.vue';
import AppHeader from './AppHeader.vue';
</script>

<style scoped>
/* La sidebar est fixed — le contenu commence après elle */
.layout-content {
  margin-left: 260px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.layout-main {
  flex: 1;
  padding: var(--space-xl);
  background: var(--bg-page);
}

/* Sur mobile, la sidebar est cachée → pas de décalage */
@media (max-width: 768px) {
  .layout-content {
    margin-left: 0;
  }
  .layout-main {
    padding: var(--space-md);
  }
}
</style>
