import { renderMarkdown } from "./markdown";

export const PRINT_ROOT_ID = "mdhaus-print-root";
export const PRINT_BODY_CLASS = "mdhaus-printing";
export const MARKDOWN_CONTENT_CLASS = "container-prose prose markdown-content";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getPrintRoot(): HTMLDivElement {
  let root = document.getElementById(PRINT_ROOT_ID) as HTMLDivElement | null;
  if (!root) {
    root = document.createElement("div");
    root.id = PRINT_ROOT_ID;
    root.setAttribute("aria-hidden", "true");
    document.body.appendChild(root);
  }

  return root;
}

export class PrintDocumentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PrintDocumentError";
  }
}

export async function printMarkdownDocument(options: {
  title: string;
  markdown: string;
  lang?: string;
}): Promise<void> {
  if (options.markdown.trim().length === 0) {
    throw new PrintDocumentError("empty");
  }

  const bodyHtml = await renderMarkdown(options.markdown);
  const lang = escapeHtml(options.lang ?? "en");
  const root = getPrintRoot();

  root.innerHTML = `<article class="${MARKDOWN_CONTENT_CLASS}" lang="${lang}">${bodyHtml}</article>`;
  document.title = options.title;
  document.body.classList.add(PRINT_BODY_CLASS);

  await new Promise<void>((resolve, reject) => {
    let settled = false;

    const finish = () => {
      if (settled) {
        return;
      }

      settled = true;
      window.clearTimeout(fallbackTimer);
      window.removeEventListener("afterprint", onAfterPrint);
      document.body.classList.remove(PRINT_BODY_CLASS);
      root.innerHTML = "";
      resolve();
    };

    const onAfterPrint = () => {
      finish();
    };

    const fallbackTimer = window.setTimeout(finish, 120_000);
    window.addEventListener("afterprint", onAfterPrint, { once: true });

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        try {
          window.focus();
          window.print();
        } catch (error) {
          settled = true;
          window.clearTimeout(fallbackTimer);
          window.removeEventListener("afterprint", onAfterPrint);
          document.body.classList.remove(PRINT_BODY_CLASS);
          root.innerHTML = "";
          reject(error);
        }
      });
    });
  });
}
