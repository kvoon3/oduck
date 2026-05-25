import type { bangs } from "./bang";

type Bang = (typeof bangs)[number];

export const customBangs: Bang[] = [
  // Add project-specific bang overrides here. Custom bangs are checked before
  // DuckDuckGo's bang list, so matching tags here replace the generated ones.
  {
    c: "AI",
    d: "chatgpt.com",
    r: 0,
    s: "ChatGPT",
    sc: "AI",
    t: "chatgpt",
    u: "https://chatgpt.com/?q={{{s}}}",
  },
];
