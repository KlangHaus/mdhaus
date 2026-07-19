import mermaid from "mermaid";

let initialized = false;
let currentTheme: "neutral" | "dark" = "neutral";

function resolveMermaidTheme(): "neutral" | "dark" {
  const root = document.documentElement;
  if (root.classList.contains("dark") || root.dataset.theme === "dark") {
    return "dark";
  }

  if (root.dataset.theme === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }

  return "neutral";
}

function ensureMermaid() {
  const theme = resolveMermaidTheme();
  if (initialized && theme === currentTheme) {
    return;
  }

  mermaid.initialize({
    startOnLoad: false,
    theme,
    securityLevel: "loose",
    fontFamily: "var(--font-family-base, system-ui, sans-serif)",
  });
  initialized = true;
  currentTheme = theme;
}

export async function renderMermaidBlocks(container: HTMLElement): Promise<void> {
  ensureMermaid();
  const blocks = container.querySelectorAll<HTMLElement>(
    "pre[data-language='mermaid'] code, pre.mermaid code",
  );

  for (const code of blocks) {
    const pre = code.parentElement;
    if (!pre || pre.classList.contains("mermaid-diagram") || pre.classList.contains("mermaid-error")) {
      continue;
    }

    const source = code.textContent?.trim() ?? "";
    if (source.length === 0) {
      continue;
    }

    const id = `mermaid-${Math.random().toString(36).slice(2, 10)}`;
    try {
      const { svg } = await mermaid.render(id, source);
      const wrapper = document.createElement("div");
      wrapper.className = "mermaid-diagram";
      wrapper.dataset.mermaidRendered = "true";
      wrapper.innerHTML = svg;
      pre.replaceWith(wrapper);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const errorBlock = document.createElement("pre");
      errorBlock.className = "mermaid-error";
      errorBlock.textContent = `Mermaid error: ${message}\n\n${source}`;
      pre.replaceWith(errorBlock);
    }
  }
}

export function resetMermaidTheme() {
  initialized = false;
}
