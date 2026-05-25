import { bangs } from "./bang";
import {
  type Bang,
  type CustomBang,
  loadCustomBangs,
  parseCustomBangs,
} from "./custom-bang";
import "virtual:uno.css";

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
    <div class="flex flex-col items-center min-h-screen pt-[12vh] px-5 pb-22">
      <div class="max-w-[46rem] w-full text-center">
        <h1>Od*ck</h1>
        <p>DuckDuckGo's bang redirects are too slow. Add the following URL as a custom search engine to your browser. Enables <a href="https://duckduckgo.com/bang.html" target="_blank" class="link link-active">all of DuckDuckGo's bangs.</a></p>
        <div class="flex items-center gap-2 mt-4">
          <input
            type="text"
            class="input"
            value="${getSearchEngineUrl()}"
            readonly
          />
          <button class="btn-icon" aria-label="Copy">
            <span class="copy-icon i-ph-clipboard-duotone text-xl" aria-hidden="true"></span>
          </button>
        </div>
        <p class="mt-16 mb-2">Or add as a <a href="https://www.raycast.com/extensions/quicklinks" target="_blank" class="link link-active">Raycast Quicklink</a>:</p>
        <div class="flex items-center gap-2 mt-4">
          <input
            type="text"
            class="input"
            value="${getRaycastQuicklinkUrl()}"
            readonly
          />
          <button class="btn-icon" aria-label="Copy Raycast URL">
            <span class="raycast-copy-icon i-ph-clipboard-duotone text-xl" aria-hidden="true"></span>
          </button>
          <button class="btn-icon" title="Import to Raycast" aria-label="Import to Raycast">
            <span class="i-ph-download-simple-duotone text-xl" aria-hidden="true"></span>
          </button>
        </div>
        <p class="mt-16 mb-2">Try a bang:</p>
        <form class="flex items-center gap-2 mt-4" id="test-form">
          <input
            type="text"
            class="input test-input"
            placeholder="e.g. !gh vuejs/core"
            spellcheck="false"
            autocomplete="off"
          />
          <button class="btn-icon" type="submit" aria-label="Open search">
            <span class="test-icon i-ph-arrow-square-out-duotone text-xl" aria-hidden="true"></span>
          </button>
        </form>
        <p class="mt-16">
          <a href="/custom.html" class="link link-active">Manage Custom Bangs →</a>
        </p>
      </div>
      <footer class="fixed bottom-4 left-0 right-0 text-center text-sm text-[#666] dark:text-[#999]">
        <a href="https://x.com/kvoon_" target="_blank" class="link link-active">kvoon3</a>
        •
        <a href="https://github.com/kvoon3/oduck" target="_blank" class="link link-active">github</a>
      </footer>
    </div>
  `;

  const copyButton = app.querySelector<HTMLButtonElement>('button[aria-label="Copy"]')!;
  const copyIcon = copyButton.querySelector<HTMLSpanElement>(".copy-icon")!;
  const copyUrlInput = copyButton.parentElement!.querySelector<HTMLInputElement>("input")!;

  copyButton.addEventListener("click", async () => {
    await navigator.clipboard.writeText(copyUrlInput.value);
    copyIcon.classList.remove("i-ph-clipboard-duotone");
    copyIcon.classList.add("i-ph-check-fat-duotone");

    setTimeout(() => {
      copyIcon.classList.add("i-ph-clipboard-duotone");
      copyIcon.classList.remove("i-ph-check-fat-duotone");
    }, 2000);
  });

  const raycastCopyButton = app.querySelector<HTMLButtonElement>('button[aria-label="Copy Raycast URL"]')!;
  const raycastCopyIcon = raycastCopyButton.querySelector<HTMLSpanElement>(".raycast-copy-icon")!;
  const raycastUrlInput = raycastCopyButton.parentElement!.querySelector<HTMLInputElement>("input")!;

  raycastCopyButton.addEventListener("click", async () => {
    await navigator.clipboard.writeText(raycastUrlInput.value);
    raycastCopyIcon.classList.remove("i-ph-clipboard-duotone");
    raycastCopyIcon.classList.add("i-ph-check-fat-duotone");

    setTimeout(() => {
      raycastCopyIcon.classList.add("i-ph-clipboard-duotone");
      raycastCopyIcon.classList.remove("i-ph-check-fat-duotone");
    }, 2000);
  });

  const raycastImportButton = app.querySelector<HTMLButtonElement>('button[aria-label="Import to Raycast"]')!;

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

  const testForm = app.querySelector<HTMLFormElement>("#test-form")!;
  const testInput = testForm.querySelector<HTMLInputElement>(".test-input")!;

  testForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const query = testInput.value.trim();
    if (!query) return;
    window.location.href = `${window.location.origin}?q=${encodeURIComponent(query)}`;
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
