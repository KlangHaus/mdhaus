function basename(filePath: string): string {
  const parts = filePath.split("/");
  return parts[parts.length - 1] ?? filePath;
}

function dirname(filePath: string): string {
  const lastSlash = filePath.lastIndexOf("/");
  return lastSlash === -1 ? "" : filePath.slice(0, lastSlash);
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
}

export function suggestImageDestination(
  fileName: string,
  workspaceRoot: string | null,
  currentFilePath: string | null,
): string {
  const safeName = sanitizeFileName(fileName) || "image.png";
  const parent =
    currentFilePath !== null && workspaceRoot !== null
      ? dirname(currentFilePath)
      : workspaceRoot ?? "";

  if (parent.length === 0) {
    return safeName;
  }

  return `${parent}/${safeName}`;
}

export function markdownImageReference(imagePath: string, currentFilePath: string | null): string {
  if (!currentFilePath) {
    return `![](${basename(imagePath)})`;
  }

  const parent = dirname(currentFilePath);
  if (imagePath.startsWith(`${parent}/`)) {
    const relative = imagePath.slice(parent.length + 1);
    return `![](${relative})`;
  }

  return `![](${basename(imagePath)})`;
}

export async function readFileAsBytes(file: File): Promise<number[]> {
  const buffer = await file.arrayBuffer();
  return Array.from(new Uint8Array(buffer));
}
