export type ExtensionStatus = "connected" | "disconnected" | "checking";

let status: ExtensionStatus = "checking";
const listeners = new Set<(s: ExtensionStatus) => void>();

function notify() {
  listeners.forEach((cb) => cb(status));
}

export function getExtensionStatus(): ExtensionStatus {
  return status;
}

export function onExtensionStatusChange(
  cb: (s: ExtensionStatus) => void,
): () => void {
  listeners.add(cb);
  cb(status);
  return () => listeners.delete(cb);
}

function setExtensionStatus(newStatus: ExtensionStatus) {
  if (status === newStatus) return;
  status = newStatus;
  notify();
}

function sendPing(requestId: string) {
  window.postMessage(
    { source: "oduck-web", type: "ping-extension", requestId },
    window.location.origin,
  );
}

export function checkExtensionStatus(timeoutMs = 800): void {
  setExtensionStatus("checking");

  let resolved = false;
  let timeoutId: ReturnType<typeof setTimeout>;
  let intervalId: ReturnType<typeof setInterval>;
  const requestId = crypto.randomUUID();

  const handler = (e: MessageEvent) => {
    if (e.source !== window) return;
    const data =
      typeof e.data === "object" && e.data !== null
        // oxlint-disable-next-line typescript/no-unsafe-type-assertion
        ? (e.data as Record<string, unknown>)
        : undefined;
    if (
      data?.source === "oduck-extension" &&
      (
        (data?.type === "pong-extension" && data?.requestId === requestId) ||
        data?.type === "ready-extension"
      )
    ) {
      resolved = true;
      setExtensionStatus("connected");
      cleanup();
    }
  };

  const cleanup = () => {
    window.removeEventListener("message", handler);
    clearInterval(intervalId);
    clearTimeout(timeoutId);
  };

  window.addEventListener("message", handler);
  sendPing(requestId);
  intervalId = setInterval(() => sendPing(requestId), 100);

  timeoutId = setTimeout(() => {
    if (!resolved) {
      setExtensionStatus("disconnected");
      cleanup();
    }
  }, timeoutMs);
}

export function getStatusLabel(s: ExtensionStatus): string {
  switch (s) {
    case "connected":
      return "Extension connected";
    case "disconnected":
      return "Extension not installed";
    case "checking":
      return "Checking extension…";
    default:
      return "Unknown";
  }
}

export function getStatusIconClass(s: ExtensionStatus): string {
  switch (s) {
    case "connected":
      return "i-ph-check-circle-duotone text-green-600";
    case "disconnected":
      return "i-ph-plug-duotone text-neutral-400";
    case "checking":
      return "i-ph-spinner-duotone text-neutral-400 animate-spin";
    default:
      return "i-ph-question-duotone text-neutral-400";
  }
}

export function renderExtensionStatusBadge(container: HTMLElement): () => void {
  const badge = document.createElement("div");
  badge.className = "inline-flex items-center gap-1.5 text-sm text-neutral-400";

  const update = (s: ExtensionStatus) => {
    const label = getStatusLabel(s);
    const iconClass = getStatusIconClass(s);
    badge.innerHTML = `<span class="${iconClass} text-lg" aria-hidden="true"></span><span>${label}</span>`;
  };

  update(status);
  container.appendChild(badge);

  const unsubscribe = onExtensionStatusChange(update);

  return () => {
    unsubscribe();
    if (badge.parentNode) {
      badge.parentNode.removeChild(badge);
    }
  };
}
