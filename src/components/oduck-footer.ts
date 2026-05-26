class OduckFooter extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: "open" });

    const style = document.createElement("style");
    style.textContent = `
      :host {
        display: block;
        position: fixed;
        bottom: 1rem;
        left: 0;
        right: 0;
        text-align: center;
        z-index: 50;
      }
      div {
        font-size: 0.875rem;
        line-height: 1.25rem;
        color: #888;
      }
      a {
        border: 0;
        border-bottom: 1px solid currentColor;
        padding-bottom: 0.125rem;
        color: #888;
        text-decoration: none;
        opacity: 0.75;
        transition: opacity 150ms;
      }
      a:hover {
        opacity: 1;
      }
    `;

    const container = document.createElement("div");
    container.innerHTML = `
      <a href="https://x.com/kvoon_" target="_blank">kvoon3</a>
      <span>&bull;</span>
      <a href="https://github.com/kvoon3/oduck" target="_blank">github</a>
    `;

    shadow.append(style, container);
  }
}

customElements.define("oduck-footer", OduckFooter);
