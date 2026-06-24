import { Renderer, marked } from "marked";
import { slugifyHeading } from "./headings";

const HEADING_SIZES = ["", "3xl", "2xl", "xl", "lg", "base", "sm"];
const headingSlugCounts = new Map<string, number>();

function nextHeadingId(plain: string): string {
  const base = slugifyHeading(plain);
  const count = headingSlugCounts.get(base) ?? 0;
  headingSlugCounts.set(base, count + 1);
  return count === 0 ? base : `${base}-${count}`;
}

const renderer = new Renderer();

renderer.heading = ({ tokens, depth }) => {
  const text = renderer.parser.parseInline(tokens);
  const plain = text.replace(/<[^>]+>/g, "");
  const id = nextHeadingId(plain);
  const size = HEADING_SIZES[depth] ?? "base";
  return `<h${depth} id="${id}" class="font-heading text-${size} font-bold mt-6 mb-3">${text}</h${depth}>`;
};

renderer.paragraph = ({ tokens }) =>
  `<p class="font-base text-base leading-relaxed mb-3">${renderer.parser.parseInline(tokens)}</p>`;

renderer.list = ({ items, ordered, start }) => {
  const tag = ordered ? "ol" : "ul";
  const hasTasks = items.some((item) => item.task);
  const taskClass = hasTasks ? " contains-task-list" : "";
  const body = items.map((item) => renderer.listitem(item)).join("");
  const startAttr = ordered && start !== 1 ? ` start="${start}"` : "";
  return `<${tag}${startAttr} class="font-base text-base leading-relaxed pl-6 mb-3${taskClass}">${body}</${tag}>`;
};

renderer.listitem = (item) => {
  let itemBody = "";

  if (item.task) {
    const checkbox = renderer.checkbox({ checked: !!item.checked });

    if (item.loose) {
      const firstToken = item.tokens[0];
      if (firstToken?.type === "paragraph") {
        firstToken.text = `${checkbox} ${firstToken.text}`;
        const nestedText = firstToken.tokens?.[0];
        if (nestedText?.type === "text") {
          nestedText.text = `${checkbox} ${nestedText.text}`;
          nestedText.escaped = true;
        }
      } else {
        item.tokens.unshift({
          type: "text",
          raw: `${checkbox} `,
          text: `${checkbox} `,
          escaped: true,
        });
      }
    } else {
      itemBody += `${checkbox} `;
    }
  }

  itemBody += renderer.parser.parse(item.tokens, !!item.loose);
  const taskClass = item.task ? " task-list-item" : "";
  return `<li class="mb-1${taskClass}">${itemBody}</li>`;
};

renderer.checkbox = ({ checked }) =>
  `<input type="checkbox" class="task-list-checkbox" disabled${checked ? " checked" : ""} />`;

renderer.codespan = ({ text }) =>
  `<code class="font-mono text-sm bg-surface rounded-sm px-1">${text}</code>`;

renderer.code = ({ text, lang }) => {
  const language = lang ? ` data-language="${lang}"` : "";
  return `<pre class="font-mono text-sm bg-surface border rounded-md p-4 overflow-x-auto mb-4"${language}><code>${text}</code></pre>`;
};

renderer.blockquote = ({ tokens }) =>
  `<blockquote class="border-l-4 border-primary pl-4 italic text-secondary mb-4">${renderer.parser.parse(tokens)}</blockquote>`;

renderer.link = ({ href, tokens }) =>
  `<a href="${href}" class="text-primary underline">${renderer.parser.parseInline(tokens)}</a>`;

renderer.hr = () => `<hr class="my-6 border-t" />`;

renderer.table = ({ header, rows }) => {
  const headCells = header.map((cell) => renderer.tablecell(cell)).join("");
  const head = renderer.tablerow({ text: headCells });
  const body = rows
    .map((row) => {
      const cells = row.map((cell) => renderer.tablecell(cell)).join("");
      return renderer.tablerow({ text: cells });
    })
    .join("");

  return `<div class="table-wrapper overflow-x-auto mb-4"><table class="markdown-table w-full border-collapse text-sm"><thead>${head}</thead><tbody>${body}</tbody></table></div>`;
};

renderer.tablerow = ({ text }) => `<tr>${text}</tr>`;

renderer.tablecell = (token) => {
  const content = renderer.parser.parseInline(token.tokens);
  const tag = token.header ? "th" : "td";
  const align = token.align ? ` align="${token.align}"` : "";
  const cellClass = token.header ? "markdown-table__head" : "markdown-table__cell";

  return `<${tag}${align} class="${cellClass}">${content}</${tag}>`;
};

marked.setOptions({ gfm: true, breaks: true, renderer });

export async function renderMarkdown(markdown: string): Promise<string> {
  headingSlugCounts.clear();
  return marked.parse(markdown);
}
