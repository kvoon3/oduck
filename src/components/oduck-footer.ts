import { createApp } from "vue";
import OduckFooter from "./oduck-footer.vue";

class OduckFooterElement extends HTMLElement {
  connectedCallback() {
    createApp(OduckFooter).mount(this);
  }
}

customElements.define("oduck-footer", OduckFooterElement);
