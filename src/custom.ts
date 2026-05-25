import {
  type CustomBang,
  parseCustomBangs,
} from "./custom-bang";
import "virtual:uno.css";

const LS_CUSTOM_BANGS = "custom-bangs";

let customBangs: CustomBang[] = [];
let editingCustomBangIndex: number | null = null;

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
    return `<p class="p-4 border border-dashed rounded text-center text-[#666] dark:(text-[#aaa])">No custom bangs yet.</p>`;
  }

  return `
    <ul class="grid gap-2 list-none">
      ${customBangs
        .map(
          (bang, index) => `
            <li class="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3.5 px-4 py-3.5 border rounded bg-[#fafafa] lt-sm:grid-cols-[auto_1fr] dark:(bg-[#171717])">
              <label class="flex items-center justify-center" title="${bang.enabled === false ? "Disabled" : "Enabled"}">
                <input
                  class="custom-bang-enabled-input w-4.5 h-4.5"
                  type="checkbox"
                  data-index="${index}"
                  ${bang.enabled === false ? "" : "checked"}
                />
              </label>
              <div class="flex items-baseline gap-2.5 min-w-0">
                <strong class="min-w-0 truncate">${escapeHtml(bang.s)}</strong>
                <span class="flex-none text-[#666] text-[13px] dark:text-[#aaa]">!${escapeHtml(bang.t)}</span>
              </div>
              <div class="flex gap-1.5 lt-sm:col-span-2 lt-sm:w-full">
                <button class="btn-base border text-[#333] hover:bg-[#f0f0f0] dark:(text-[#ddd] hover:bg-[#222]) flex-1 edit-custom-bang-button" type="button" data-index="${index}">Edit</button>
                <button class="btn-base text-[#b00020] hover:bg-[#f8e8ec] dark:(text-[#ff8a9a] hover:bg-[#2a171b]) flex-1 remove-custom-bang-button" type="button" data-index="${index}">Remove</button>
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

function render() {
  const app = document.querySelector<HTMLDivElement>("#app")!;
  app.innerHTML = `
    <div class="flex flex-col items-center min-h-screen pt-[12vh] px-5 pb-22">
      <div class="max-w-[46rem] w-full text-center">
        <h1>Custom Bangs</h1>
        <p>Create your own <code>!bang</code> shortcuts. <a href="/">← Back to Od*ck</a></p>
        <section class="mt-25 text-left">
          <div class="flex items-center justify-between gap-4 lt-sm:(flex-col items-start)">
            <h2 class="text-[22px]">Your Bangs</h2>
            <div class="flex gap-2 flex-wrap justify-end lt-sm:(w-full justify-stretch)">
              <button class="btn-base bg-[#1a1a1a] text-white hover:bg-[#333] dark:(bg-[#f1f1f1] text-[#111] hover:bg-[#d8d8d8]) open-custom-bang-form-button lt-sm:flex-1" type="button">Add Bang</button>
              <button class="btn-base border text-[#333] hover:bg-[#f0f0f0] dark:(text-[#ddd] hover:bg-[#222]) import-custom-bang-button lt-sm:flex-1" type="button">Import</button>
              <button class="btn-base border text-[#333] hover:bg-[#f0f0f0] dark:(text-[#ddd] hover:bg-[#222]) export-custom-bang-button lt-sm:flex-1" type="button">Export</button>
            </div>
          </div>
          <div class="custom-bang-list-container mt-4.5">${renderCustomBangList()}</div>
          <input class="custom-bang-file-input" type="file" accept="application/json,.json" hidden />
          <p class="custom-bang-status min-h-[21px] mt-2 text-sm text-[#555] dark:text-[#aaa]" aria-live="polite"></p>
        </section>
      </div>
      <div class="custom-bang-modal fixed inset-0 z-10 flex items-center justify-center p-5 bg-[rgb(0_0_0_/_0.35)] dark:bg-[rgb(0_0_0_/_0.6)]" role="dialog" aria-modal="true" aria-labelledby="custom-bang-dialog-title" hidden>
        <div class="w-[min(100%,34rem)] p-5 border rounded-md bg-white shadow-[0_16px_40px_rgb(0_0_0_/_0.18)] dark:(bg-[#131313])">
          <div class="flex items-center justify-between gap-4">
            <h3 id="custom-bang-dialog-title" class="text-[18px]">${getCustomBangDialogTitle()}</h3>
            <button class="close-custom-bang-modal-button flex items-center justify-center w-8 h-8 rounded text-[#555] text-2xl leading-none hover:bg-[#f0f0f0] dark:(text-[#ddd] hover:bg-[#222])" type="button" aria-label="Close">×</button>
          </div>
          <form class="custom-bang-form grid grid-cols-2 gap-2 mt-4 lt-sm:grid-cols-1">
            <input class="w-full min-w-0 px-2.5 py-2 border rounded bg-[#f5f5f5] text-[#1a1a1a] dark:(bg-[#191919] text-white)" name="t" type="text" placeholder="bang" autocomplete="off" required />
            <input class="w-full min-w-0 px-2.5 py-2 border rounded bg-[#f5f5f5] text-[#1a1a1a] dark:(bg-[#191919] text-white)" name="s" type="text" placeholder="name" autocomplete="off" required />
            <input class="w-full min-w-0 px-2.5 py-2 border rounded bg-[#f5f5f5] text-[#1a1a1a] dark:(bg-[#191919] text-white)" name="d" type="text" placeholder="domain (optional)" autocomplete="off" />
            <input class="w-full min-w-0 px-2.5 py-2 border rounded bg-[#f5f5f5] text-[#1a1a1a] dark:(bg-[#191919] text-white) col-span-2 lt-sm:col-auto" name="u" type="text" placeholder="https://example.com/search?q=%s" autocomplete="off" required />
            <button class="btn-base bg-[#1a1a1a] text-white hover:bg-[#333] dark:(bg-[#f1f1f1] text-[#111] hover:bg-[#d8d8d8]) submit-custom-bang-button col-span-2 lt-sm:col-auto" type="submit">Add</button>
            <button class="btn-base border text-[#333] hover:bg-[#f0f0f0] dark:(text-[#ddd] hover:bg-[#222]) cancel-edit-custom-bang-button col-span-2 lt-sm:col-auto" type="button">Cancel</button>
          </form>
        </div>
      </div>
      <footer class="fixed bottom-4 left-0 right-0 text-center text-sm text-[#666] dark:text-[#999]">
        <a href="https://x.com/kvoon_" target="_blank">kvoon3</a>
        •
        <a href="https://github.com/kvoon3/oduck" target="_blank">github</a>
      </footer>
    </div>
  `;

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

function init() {
  customBangs = getSavedCustomBangs() ?? [];
  render();
}

init();
