import { createApp } from "vue";
import CustomBangApp from "./custom.vue";

import 'virtual:uno.css'
import "./components/oduck-header";
import "./components/oduck-footer";

createApp(CustomBangApp).mount("#app");
