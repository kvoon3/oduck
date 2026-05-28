import "./components/oduck-header";
import "./components/oduck-footer";
import { bangs } from "./bang";
import { parseQuery } from "./bang-query";
import {
  type Bang,
  type CustomBang,
  parseCustomBangs,
  mergeBangs,
} from "./custom-bang";

import 'virtual:uno.css'

const LS_CUSTOM_BANGS = "custom-bangs";

const searchEngines: Record<string, string> = {
  google: "https://www.google.com/search?q={{{s}}}",
  ddg: "https://duckduckgo.com/?q={{{s}}}",
  bing: "https://www.bing.com/search?q={{{s}}}",
};
const fallbackEngine = localStorage.getItem("fallback-engine") ?? "google";
const fallbackEngineUrl =
  fallbackEngine === "other"
    ? localStorage.getItem("fallback-engine-url") ?? ""
    : searchEngines[fallbackEngine] ?? searchEngines.google;

let customBangs: CustomBang[] = [];
let allBangs: Bang[] = bangs;

function getSearchEngineUrl() {
  return `${window.location.origin}?q=%s`;
}

function getRaycastQuicklinkUrl() {
  return `${window.location.origin}?q=!{argument}`;
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

function syncAllBangs() {
  allBangs = mergeBangs(customBangs, bangs);
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
    <div class="grid grid-rows-[min-content_1fr_min-content] h-dvh">
      <oduck-header></oduck-header>
      <div class="overflow-auto mx4">
      <div class="mxa max-w-[46rem] pt-[12vh] pb-22 px-5 text-center flex flex-col gap-8">
        <section>
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
        </section>
        <section>
          <p>Or add as a <a href="https://www.raycast.com/extensions/quicklinks" target="_blank" class="link link-active">Raycast Quicklink</a>:</p>
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
        </section>
        <section>
          <p>
            <a href="/search.html" class="link link-active">Oduck Search</a>
            &mdash; use as your browser's search engine homepage
          </p>
          <p class="mt-4">
            <a href="/custom.html" class="link link-active">Manage Custom Bangs →</a>
          </p>
        </section>
      </div>
      </div>
      <oduck-footer></oduck-footer>
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

}

function getBangredirectUrl() {
  const url = new URL(window.location.href);
  const query = url.searchParams.get("q")?.trim() ?? "";
  if (!query) {
    noSearchDefaultPageRender();
    return null;
  }

  const parsed = parseQuery(query);
  const selectedBang = allBangs.find((b) => b.t === parsed.bang) ?? null;
  const cleanQuery = parsed.cleanQuery;

  if (selectedBang) {
    if (cleanQuery === "")
      return `https://${selectedBang.d}`;
    return selectedBang.u.replace(
      "{{{s}}}",
      encodeURIComponent(cleanQuery).replace(/%2F/g, "/"),
    );
  }

  return cleanQuery && fallbackEngineUrl
    ? fallbackEngineUrl.replace("{{{s}}}", encodeURIComponent(cleanQuery).replace(/%2F/g, "/"))
    : null;
}

function doRedirect() {
  customBangs = getSavedCustomBangs() ?? [];
  syncAllBangs();

  const searchUrl = getBangredirectUrl();
  if (!searchUrl) return;
  window.location.replace(searchUrl);
}

doRedirect();
