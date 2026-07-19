import katex from "katex";

const CODE_REGION_PATTERN = /(```[\s\S]*?```|`[^`\n]+`)/g;
const DISPLAY_MATH_PATTERN = /\$\$([\s\S]+?)\$\$/g;
const INLINE_MATH_PATTERN = /(?<!\$)\$(?!\$)([^\n$]+?)\$(?!\$)/g;

function protectCodeRegions(source: string): { text: string; slots: string[] } {
  const slots: string[] = [];

  const text = source.replace(CODE_REGION_PATTERN, (match) => {
    const token = `\u0000MATH_SLOT_${slots.length}\u0000`;
    slots.push(match);
    return token;
  });

  return { text, slots };
}

function restoreCodeRegions(text: string, slots: string[]): string {
  return text.replace(/\u0000MATH_SLOT_(\d+)\u0000/g, (_match, index: string) => {
    return slots[Number.parseInt(index, 10)] ?? "";
  });
}

function renderDisplayMath(expression: string): string {
  try {
    const html = katex.renderToString(expression.trim(), {
      displayMode: true,
      throwOnError: false,
    });
    return `<div class="katex-display">${html}</div>`;
  } catch {
    return `<pre class="katex-error">$$${expression}$$</pre>`;
  }
}

function renderInlineMath(expression: string): string {
  try {
    const html = katex.renderToString(expression.trim(), {
      displayMode: false,
      throwOnError: false,
    });
    return `<span class="katex-inline">${html}</span>`;
  } catch {
    return `<code class="katex-error">$${expression}$</code>`;
  }
}

export function renderMathInMarkdown(source: string): string {
  const { text, slots } = protectCodeRegions(source);
  let result = text.replace(DISPLAY_MATH_PATTERN, (_match, expression: string) =>
    renderDisplayMath(expression),
  );
  result = result.replace(INLINE_MATH_PATTERN, (_match, expression: string) =>
    renderInlineMath(expression),
  );
  return restoreCodeRegions(result, slots);
}
