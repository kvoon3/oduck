class OduckHeader extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: "open" });

    const style = document.createElement("style");
    style.textContent = `
      :host {
        display: block;
        position: fixed;
        top: 1rem;
        right: 1rem;
        z-index: 50;
      }
      nav {
        display: flex;
        gap: 0.75rem;
        font-size: 0.875rem;
        line-height: 1.25rem;
        color: #888;
      }
      @media (prefers-color-scheme: dark) {
        nav {
          color: #888;
        }
      }
      a {
        border: 0;
        color: #888;
        text-decoration: none;
        opacity: 0.75;
        transition: opacity 150ms;
      }
      a:hover {
        opacity: 1;
      }
    `;

    const nav = document.createElement("nav");
    nav.innerHTML = `
      <a href="/">Home</a>
      <span>&bull;</span>
      <a href="/search.html">Search</a>
      <span>&bull;</span>
      <a href="/custom.html">Custom</a>
    `;

    shadow.append(style, nav);
  }
}

customElements.define("oduck-header", OduckHeader);
