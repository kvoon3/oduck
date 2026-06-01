import { createApp } from "vue";
import OduckHeader from "./oduck-header.vue";

class OduckHeaderElement extends HTMLElement {
  connectedCallback() {
    createApp(OduckHeader).mount(this);
  }
}

customElements.define("oduck-header", OduckHeaderElement);
