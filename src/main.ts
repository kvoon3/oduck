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
let editingCustomBangIndex: number | null = null;

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

function formatCustomBangsConfig() {
  return JSON.stringify(customBangs, null, 2);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getActiveCustomBangs(): Bang[] {
  return customBangs
    .filter((bang) => bang.enabled !== false)
    .map(({ enabled: _enabled, ...bang }) => bang);
}

function syncAllBangs() {
  allBangs = [...getActiveCustomBangs(), ...bangs];
}

function getDomainFromSearchUrl(searchUrl: string) {
  try {
    return new URL(searchUrl.replace("{{{s}}}", "query").replace("%s", "query")).hostname;
  } catch {
    return "";
  }
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

function renderCustomBangList() {
  if (customBangs.length === 0) {
    return `<p class="custom-bang-empty">No custom bangs yet.</p>`;
  }

  return `
    <ul class="custom-bang-list">
      ${customBangs
        .map(
          (bang, index) => `
            <li class="custom-bang-item">
              <label class="toggle-row" title="${bang.enabled === false ? "Disabled" : "Enabled"}">
                <input
                  class="custom-bang-enabled-input"
                  type="checkbox"
                  data-index="${index}"
                  ${bang.enabled === false ? "" : "checked"}
                />
              </label>
              <div class="custom-bang-details">
                <strong>${escapeHtml(bang.s)}</strong>
                <span>!${escapeHtml(bang.t)}</span>
              </div>
              <div class="custom-bang-row-actions">
                <button class="secondary-button edit-custom-bang-button" type="button" data-index="${index}">Edit</button>
                <button class="danger-button remove-custom-bang-button" type="button" data-index="${index}">Remove</button>
              </div>
            </li>
          `,
        )
        .join("")}
    </ul>
  `;
}

function getCustomBangDialogTitle() {
  return editingCustomBangIndex === null ? "Add Bang" : "Edit Bang";
}

function persistCustomBangs(message?: string) {
  syncAllBangs();
  localStorage.setItem(LS_CUSTOM_BANGS, formatCustomBangsConfig());

  const customBangList = document.querySelector<HTMLDivElement>(
    ".custom-bang-list-container",
  );
  const customBangStatus = document.querySelector<HTMLParagraphElement>(
    ".custom-bang-status",
  );

  if (customBangList) customBangList.innerHTML = renderCustomBangList();
  if (customBangStatus && message) {
    customBangStatus.textContent = message;
    customBangStatus.classList.remove("is-error");
  }
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
        <section class="custom-bang-panel">
          <div class="custom-bang-header">
            <h2>Custom Bangs</h2>
            <div class="custom-bang-actions">
              <button class="primary-button open-custom-bang-form-button" type="button">Add Bang</button>
              <button class="secondary-button import-custom-bang-button" type="button">Import</button>
              <button class="secondary-button export-custom-bang-button" type="button">Export</button>
            </div>
          </div>
          <div class="custom-bang-list-container">${renderCustomBangList()}</div>
          <input class="custom-bang-file-input" type="file" accept="application/json,.json" hidden />
          <p class="custom-bang-status" aria-live="polite"></p>
        </section>
      </div>
      <div class="custom-bang-modal" role="dialog" aria-modal="true" aria-labelledby="custom-bang-dialog-title" hidden>
        <div class="custom-bang-modal-panel">
          <div class="custom-bang-modal-header">
            <h3 id="custom-bang-dialog-title">${getCustomBangDialogTitle()}</h3>
            <button class="icon-button close-custom-bang-modal-button" type="button" aria-label="Close">×</button>
          </div>
          <form class="custom-bang-form">
            <input class="custom-bang-input" name="t" type="text" placeholder="bang" autocomplete="off" required />
            <input class="custom-bang-input" name="s" type="text" placeholder="name" autocomplete="off" required />
            <input class="custom-bang-input" name="d" type="text" placeholder="domain (optional)" autocomplete="off" />
            <input class="custom-bang-input custom-bang-url-field" name="u" type="text" placeholder="https://example.com/search?q=%s" autocomplete="off" required />
            <button class="primary-button submit-custom-bang-button" type="submit">Add</button>
            <button class="secondary-button cancel-edit-custom-bang-button" type="button">Cancel</button>
          </form>
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
    downloadJson("oduck.raycast-quicklink.json", quicklink);
  });

  const customBangList = app.querySelector<HTMLDivElement>(
    ".custom-bang-list-container",
  )!;
  const customBangForm = app.querySelector<HTMLFormElement>(
    ".custom-bang-form",
  )!;
  const customBangModal = app.querySelector<HTMLDivElement>(
    ".custom-bang-modal",
  )!;
  const customBangDialogTitle = app.querySelector<HTMLHeadingElement>(
    "#custom-bang-dialog-title",
  )!;
  const openCustomBangFormButton = app.querySelector<HTMLButtonElement>(
    ".open-custom-bang-form-button",
  )!;
  const submitCustomBangButton = app.querySelector<HTMLButtonElement>(
    ".submit-custom-bang-button",
  )!;
  const cancelEditCustomBangButton = app.querySelector<HTMLButtonElement>(
    ".cancel-edit-custom-bang-button",
  )!;
  const closeCustomBangModalButton = app.querySelector<HTMLButtonElement>(
    ".close-custom-bang-modal-button",
  )!;
  const customBangStatus = app.querySelector<HTMLParagraphElement>(
    ".custom-bang-status",
  )!;
  const customBangFileInput = app.querySelector<HTMLInputElement>(
    ".custom-bang-file-input",
  )!;
  const importCustomBangButton = app.querySelector<HTMLButtonElement>(
    ".import-custom-bang-button",
  )!;
  const exportCustomBangButton = app.querySelector<HTMLButtonElement>(
    ".export-custom-bang-button",
  )!;

  function setCustomBangStatus(message: string, isError = false) {
    customBangStatus.textContent = message;
    customBangStatus.classList.toggle("is-error", isError);
  }

  function stopEditingCustomBang() {
    editingCustomBangIndex = null;
    customBangForm.reset();
    submitCustomBangButton.textContent = "Add";
    customBangDialogTitle.textContent = getCustomBangDialogTitle();
    customBangModal.hidden = true;
  }

  function startEditingCustomBang(index: number) {
    const bang = customBangs[index];
    if (!bang) return;

    editingCustomBangIndex = index;
    customBangForm.t.value = bang.t;
    customBangForm.s.value = bang.s;
    customBangForm.d.value = bang.d;
    customBangForm.u.value = bang.u;
    customBangDialogTitle.textContent = getCustomBangDialogTitle();
    submitCustomBangButton.textContent = "Update";
    customBangModal.hidden = false;
    customBangForm.t.focus();
    setCustomBangStatus(`Editing !${bang.t}.`);
  }

  openCustomBangFormButton.addEventListener("click", () => {
    editingCustomBangIndex = null;
    customBangForm.reset();
    customBangDialogTitle.textContent = getCustomBangDialogTitle();
    submitCustomBangButton.textContent = "Add";
    customBangModal.hidden = false;
    customBangForm.t.focus();
  });

  customBangList.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    if (!target.classList.contains("custom-bang-enabled-input")) return;

    const index = Number(target.dataset.index);
    const bang = customBangs[index];
    if (!bang) return;

    bang.enabled = target.checked;
    persistCustomBangs(target.checked ? `Enabled !${bang.t}.` : `Disabled !${bang.t}.`);
  });

  customBangList.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) return;

    const index = Number(target.dataset.index);
    const bang = customBangs[index];
    if (!bang) return;

    if (target.classList.contains("edit-custom-bang-button")) {
      startEditingCustomBang(index);
      return;
    }

    if (target.classList.contains("remove-custom-bang-button")) {
      customBangs.splice(index, 1);
      if (editingCustomBangIndex === index) {
        stopEditingCustomBang();
      } else if (
        editingCustomBangIndex !== null &&
        editingCustomBangIndex > index
      ) {
        editingCustomBangIndex -= 1;
      }
      persistCustomBangs(`Removed !${bang.t}.`);
    }
  });

  cancelEditCustomBangButton.addEventListener("click", () => {
    stopEditingCustomBang();
    setCustomBangStatus("");
  });

  closeCustomBangModalButton.addEventListener("click", () => {
    stopEditingCustomBang();
  });

  customBangModal.addEventListener("click", (event) => {
    if (event.target === customBangModal) stopEditingCustomBang();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !customBangModal.hidden) {
      stopEditingCustomBang();
    }
  });

  customBangForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(customBangForm);
    const tag = String(formData.get("t") ?? "")
      .trim()
      .replace(/^!/, "")
      .toLowerCase();
    const name = String(formData.get("s") ?? "").trim();
    const searchUrl = String(formData.get("u") ?? "").trim();
    const domain =
      String(formData.get("d") ?? "").trim() ||
      getDomainFromSearchUrl(searchUrl);

    try {
      const nextBang = parseCustomBangs([
        {
          c: "Custom",
          d: domain,
          enabled: true,
          r: 0,
          s: name,
          sc: "Custom",
          t: tag,
          u: searchUrl,
        },
      ])[0];

      if (!nextBang) throw new Error("Custom bang is invalid.");

      if (editingCustomBangIndex !== null) {
        customBangs[editingCustomBangIndex] = {
          ...nextBang,
          enabled: customBangs[editingCustomBangIndex]?.enabled ?? true,
        };
      } else if (customBangs.find((bang) => bang.t === tag)) {
        throw new Error(`!${tag} already exists. Use Edit to change it.`);
      } else {
        customBangs.push(nextBang);
      }

      stopEditingCustomBang();
      persistCustomBangs(`Saved !${tag}.`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Custom bang config is invalid.";
      setCustomBangStatus(message, true);
    }
  });

  exportCustomBangButton.addEventListener("click", () => {
    downloadJson("custom-bang.json", customBangs);
    setCustomBangStatus("Exported custom-bang.json.");
  });

  importCustomBangButton.addEventListener("click", () => {
    customBangFileInput.click();
  });

  customBangFileInput.addEventListener("change", async () => {
    const file = customBangFileInput.files?.[0];
    if (!file) return;

    try {
      const nextCustomBangs = parseCustomBangs(JSON.parse(await file.text()));
      customBangs = nextCustomBangs;
      stopEditingCustomBang();
      persistCustomBangs("Imported and saved locally.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Custom bang config is invalid.";
      setCustomBangStatus(message, true);
    } finally {
      customBangFileInput.value = "";
    }
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

async function doRedirect() {
  customBangs = getSavedCustomBangs() ?? (await loadCustomBangs());
  syncAllBangs();

  const searchUrl = getBangredirectUrl();
  if (!searchUrl) return;
  window.location.replace(searchUrl);
}

doRedirect();
