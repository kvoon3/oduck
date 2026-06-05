import { ref, shallowRef } from "vue";
import type { CustomBang, CustomBangInput } from "../types/custom-bang";
// oxlint-disable-next-line import/default
import BangProcessorWorker from "../workers/bang-processor.worker?worker";

export interface ProcessResult {
  merged: CustomBang[];
  newTags: string[];
  conflicts: { local: CustomBang; remote: CustomBang }[];
  duration: number;
}

export function useBangProcessor() {
  const worker = shallowRef(new BangProcessorWorker());
  const processing = ref(false);

  function terminate() {
    worker.value?.terminate();
    worker.value = new BangProcessorWorker();
  }

  async function process(
    rawBangs: CustomBangInput[],
    sourceName: string,
    existingBangs: CustomBang[],
    existingSourceTags: string[] = [],
    keepRemote = false,
  ): Promise<ProcessResult> {
    processing.value = true;

    return new Promise((resolve, reject) => {
      const w = worker.value;
      if (!w) {
        processing.value = false;
        reject(new Error("Worker not available"));
        return;
      }

      const onMessage = (e: MessageEvent<{ type: string; result: unknown }>) => {
        if (e.data.type === "done") {
          cleanup();
          processing.value = false;
          // oxlint-disable-next-line typescript/no-unsafe-type-assertion
          resolve(e.data.result as ProcessResult);
        }
      };

      const onError = (e: ErrorEvent) => {
        cleanup();
        processing.value = false;
        reject(e.error ?? new Error(e.message));
      };

      function cleanup() {
        w.removeEventListener("message", onMessage);
        w.removeEventListener("error", onError);
      }

      w.addEventListener("message", onMessage);
      w.addEventListener("error", onError);

      w.postMessage(
        {
          type: "process",
          payload: {
            rawBangs,
            sourceName,
            existingBangs,
            existingSourceTags,
            keepRemote,
          },
        },
        [],
      );
    });
  }

  return {
    processing,
    process,
    terminate,
  };
}
