import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
import "./assets/main.css";
import { useAuthStore } from "@/stores/auth";

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.mount("#app");

// Session restaurée depuis localStorage : on rafraîchit le profil en arrière-plan.
// Si le token est expiré, l'intercepteur Axios nettoie la session et redirige.
const auth = useAuthStore();
if (auth.isAuthenticated) {
  auth.fetchMe().catch(() => {});
}
