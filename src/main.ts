import { bangs } from "./bang";
import {
  type Bang,
  type CustomBang,
  loadCustomBangs,
  parseCustomBangs,
} from "./custom-bang";
import "./global.css";

const LS_CUSTOM_BANGS = "custom-bangs";
const LS_DEFAULT_BANG = localStorage.getItem("default-bang") ?? "g";

let customBangs: CustomBang[] = [];
let allBangs: Bang[] = bangs;

function getSearchEngineUrl() {
  return `${window.location.origin}?q=%s`;
}

function getRaycastQuicklinkUrl() {
  return `${window.location.origin}?q={argument}`;
}

function getSavedCustomBangs(): CustomBang[] | null {
  const savedConfig = localStorage.getItem(LS_CUSTOM_BANGS);
  if (!savedConfig) return null;

  try {
    return parseCustomBangs(JSON.parse(savedConfig));
  } catch (error) {
    console.warn("Ignoring invalid saved custom bang config.", error);
    return null;
  }
}

function getActiveCustomBangs(): Bang[] {
  return customBangs
    .filter((bang) => bang.enabled !== false)
    .map(({ enabled: _enabled, ...bang }) => bang);
}

function syncAllBangs() {
  allBangs = [...getActiveCustomBangs(), ...bangs];
}

function downloadJson(filename: string, value: unknown) {
  const blob = new Blob([JSON.stringify(value, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function noSearchDefaultPageRender() {
  const app = document.querySelector<HTMLDivElement>("#app")!;
  app.innerHTML = `
    <div class="page-shell">
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
        <p style="margin-top: 4rem; margin-bottom: 0.5rem;">Or add as a <a href="https://www.raycast.com/extensions/quicklinks" target="_blank">Raycast Quicklink</a>:</p>
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
        <p style="margin-top: 4rem;">
          <a href="/custom.html">Manage Custom Bangs →</a>
        </p>
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
    downloadJson("oduck.raycast-quicklink.json", quicklink);
  });
}

function getBangredirectUrl() {
  const url = new URL(window.location.href);
  const query = url.searchParams.get("q")?.trim() ?? "";
  if (!query) {
    noSearchDefaultPageRender();
    return null;
  }

  const match = query.match(/!(\S+)/i);

  const bangCandidate = match?.[1]?.toLowerCase();
  const defaultBang = allBangs.find((b) => b.t === LS_DEFAULT_BANG);
  const selectedBang =
    allBangs.find((b) => b.t === bangCandidate) ?? defaultBang;

  const cleanQuery = query.replace(/!\S+\s*/i, "").trim();

  if (cleanQuery === "")
    return selectedBang ? `https://${selectedBang.d}` : null;

  const searchUrl = selectedBang?.u.replace(
    "{{{s}}}",
    encodeURIComponent(cleanQuery).replace(/%2F/g, "/"),
  );
  if (!searchUrl) return null;

  return searchUrl;
}

async function doRedirect() {
  customBangs = getSavedCustomBangs() ?? (await loadCustomBangs());
  syncAllBangs();

  const searchUrl = getBangredirectUrl();
  if (!searchUrl) return;
  window.location.replace(searchUrl);
}

doRedirect();
