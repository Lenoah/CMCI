<template>
  <!-- Indicateur de chargement affiché pendant les requêtes API -->
  <div class="spinner-wrapper">
    <div class="spinner"></div>
    <p v-if="message" class="spinner-msg">{{ message }}</p>
  </div>
</template>

<script setup>
defineProps({
  message: { type: String, default: 'Chargement...' },
});
</script>

<style scoped>
.spinner-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-2xl);
  gap: var(--space-sm);
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--border);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: tourner 0.7s linear infinite;
}

@keyframes tourner {
  to { transform: rotate(360deg); }
}

.spinner-msg {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  margin: 0;
}
</style>
