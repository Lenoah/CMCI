<template>
  <div class="not-found">
    <h1>404</h1>
    <p>Page introuvable.</p>
    <router-link to="/">Retour à l'accueil</router-link>
  </div>
</template>

<style scoped>
.not-found {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  color: var(--primary);
}

.not-found h1 {
  font-size: 5rem;
  margin: 0;
}

.not-found p {
  font-size: 1.1rem;
  color: var(--text-secondary);
  margin: 0;
}

.not-found a {
  color: var(--primary);
  font-weight: 600;
}
</style>
