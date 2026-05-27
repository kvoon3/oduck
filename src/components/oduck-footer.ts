class OduckFooter extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: "open" });

    const style = document.createElement("style");
    style.textContent = `
      :host {
        display: block;
        height: min-content;
        text-align: center;
      }
      div {
        display: inline-flex;
        align-items: center;
        gap: 0.75rem;
        font-size: 0.875rem;
        line-height: 2rem;
        color: #888;
      }
      a {
        border: 0;
        display: inline-flex;
        align-items: center;
        gap: 0.3125rem;
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
      <a href="https://x.com/kvoon_" target="_blank" rel="noreferrer">kvoon3</a>
      <span>&bull;</span>
      <a href="https://github.com/kvoon3/oduck" target="_blank" rel="noreferrer">github</a>
    `;

    shadow.append(style, container);
  }
}

customElements.define("oduck-footer", OduckFooter);
