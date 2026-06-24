import { createApp } from "vue";
import "@grundtone/vue/css";
import { GT_ICON_REGISTRY_KEY } from "@grundtone/vue";
import { iconRegistry } from "@grundtone/icons";
import App from "./App.vue";
import "./styles/app.scss";
import { installI18n } from "./i18n";

const app = createApp(App);
app.provide(GT_ICON_REGISTRY_KEY, iconRegistry);
installI18n(app);
app.mount("#app");
