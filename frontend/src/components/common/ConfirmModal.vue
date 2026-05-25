<template>
  <!-- Modale de confirmation avant une action destructive (suppression) -->
  <div v-if="visible" class="modal-overlay" @click.self="annuler">
    <div class="modal-box">
      <h3 class="modal-titre">{{ titre }}</h3>
      <p class="modal-message">{{ message }}</p>
      <div class="modal-actions">
        <button class="btn-annuler" @click="annuler">Annuler</button>
        <button class="btn-confirmer" @click="confirmer">Confirmer</button>
      </div>
    </div>
  </div>
</template>

<script setup>
// Modale utilisée pour confirmer les suppressions
defineProps({
  visible: { type: Boolean, default: false },
  titre: { type: String, default: 'Confirmation' },
  message: { type: String, default: 'Êtes-vous sûr de vouloir effectuer cette action ?' },
});

const emit = defineEmits(['confirmer', 'annuler']);
function confirmer() { emit('confirmer'); }
function annuler() { emit('annuler'); }
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.modal-box {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-xl);
  width: 100%;
  max-width: 400px;
  box-shadow: var(--shadow-lg);
}

.modal-titre {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 var(--space-sm);
}

.modal-message {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  margin: 0 0 var(--space-lg);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-sm);
}

.btn-annuler {
  padding: 10px 20px;
  border: 1px solid var(--border);
  background: var(--bg-card);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  transition: var(--transition);
}
.btn-confirmer {
  padding: 10px 20px;
  background: transparent;
  color: var(--danger);
  border: 1px solid var(--danger);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: var(--font-size-sm);
  font-weight: 500;
  transition: var(--transition);
}
.btn-confirmer:hover { background: var(--danger); color: var(--text-white); }
</style>
