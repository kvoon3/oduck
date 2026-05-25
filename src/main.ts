import { bangs } from "./bang";
import { customBangs } from "./custom-bang";
import "./global.css";

const allBangs = [...customBangs, ...bangs];

function getSearchEngineUrl() {
  return `${window.location.origin}?q=%s`;
}

function getRaycastQuicklinkUrl() {
  return `${window.location.origin}?q={argument}`;
}

function noSearchDefaultPageRender() {
  const app = document.querySelector<HTMLDivElement>("#app")!;
  app.innerHTML = `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh;">
      <div class="content-container">
        <h1>Od*ck</h1>
        <p>DuckDuckGo's bang redirects are too slow. Add the following URL as a custom search engine to your browser. Enables <a href="https://duckduckgo.com/bang.html" target="_blank">all of DuckDuckGo's bangs.</a></p>
        <div class="url-container">
          <input
            type="text"
            class="url-input"
            value="${getSearchEngineUrl()}"
            readonly
          />
          <button class="copy-button">
            <img src="/clipboard.svg" alt="Copy" />
          </button>
        </div>
        <p style="margin-top: 1.5rem; margin-bottom: 0.5rem;">Or add as a <a href="https://www.raycast.com/extensions/quicklinks" target="_blank">Raycast Quicklink</a>:</p>
        <div class="url-container">
          <input
            type="text"
            class="url-input raycast-url-input"
            value="${getRaycastQuicklinkUrl()}"
            readonly
          />
          <button class="copy-button raycast-copy-button">
            <img src="/clipboard.svg" alt="Copy" />
          </button>
          <button class="copy-button raycast-import-button" title="Import to Raycast">
            <img src="/download.svg" alt="Import to Raycast" />
          </button>
        </div>
      </div>
      <footer class="footer">
        <a href="https://x.com/kvoon_" target="_blank">kvoon3</a>
        •
        <a href="https://github.com/kvoon3/oduck" target="_blank">github</a>
      </footer>
    </div>
  `;

  const copyButton = app.querySelector<HTMLButtonElement>(".copy-button")!;
  const copyIcon = copyButton.querySelector("img")!;
  const urlInput = app.querySelector<HTMLInputElement>(".url-input")!;

  copyButton.addEventListener("click", async () => {
    await navigator.clipboard.writeText(urlInput.value);
    copyIcon.src = "/clipboard-check.svg";

    setTimeout(() => {
      copyIcon.src = "/clipboard.svg";
    }, 2000);
  });

  const raycastCopyButton = app.querySelector<HTMLButtonElement>(".raycast-copy-button")!;
  const raycastCopyIcon = raycastCopyButton.querySelector("img")!;
  const raycastUrlInput = app.querySelector<HTMLInputElement>(".raycast-url-input")!;

  raycastCopyButton.addEventListener("click", async () => {
    await navigator.clipboard.writeText(raycastUrlInput.value);
    raycastCopyIcon.src = "/clipboard-check.svg";

    setTimeout(() => {
      raycastCopyIcon.src = "/clipboard.svg";
    }, 2000);
  });

  const raycastImportButton = app.querySelector<HTMLButtonElement>(".raycast-import-button")!;

  raycastImportButton.addEventListener("click", () => {
    const quicklink = [
      {
        name: "oduck",
        link: `${window.location.origin}?q={Query}`,
        icon: { name: "search" },
      },
    ];
    const blob = new Blob([JSON.stringify(quicklink, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "oduck.raycast-quicklink.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
}

const LS_DEFAULT_BANG = localStorage.getItem("default-bang") ?? "g";
const defaultBang = allBangs.find((b) => b.t === LS_DEFAULT_BANG);

function getBangredirectUrl() {
  const url = new URL(window.location.href);
  const query = url.searchParams.get("q")?.trim() ?? "";
  if (!query) {
    noSearchDefaultPageRender();
    return null;
  }

  const match = query.match(/!(\S+)/i);

  const bangCandidate = match?.[1]?.toLowerCase();
  const selectedBang =
    allBangs.find((b) => b.t === bangCandidate) ?? defaultBang;

  // Remove the first bang from the query
  const cleanQuery = query.replace(/!\S+\s*/i, "").trim();

  // If the query is just `!gh`, use `github.com` instead of `github.com/search?q=`
  if (cleanQuery === "")
    return selectedBang ? `https://${selectedBang.d}` : null;

  // Format of the url is:
  // https://www.google.com/search?q={{{s}}}
  const searchUrl = selectedBang?.u.replace(
    "{{{s}}}",
    // Replace %2F with / to fix formats like "!ghr+t3dotgg/unduck"
    encodeURIComponent(cleanQuery).replace(/%2F/g, "/"),
  );
  if (!searchUrl) return null;

  return searchUrl;
}

function doRedirect() {
  const searchUrl = getBangredirectUrl();
  if (!searchUrl) return;
  window.location.replace(searchUrl);
}

doRedirect();
