class OduckHeader extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: "open" });

    const style = document.createElement("style");
    style.textContent = `
      :host {
        display: block;
        height: min-content;
      }
      nav {
        display: flex;
        gap: 0.75rem;
        align-items: center;
        font-size: 0.875rem;
        line-height: 2rem;
        color: #888;
        margin: 0rem 0.5rem;
        width: min-content;
      }
      @media (prefers-color-scheme: dark) {
        nav {
          color: #888;
        }
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
