/** Normalised scroll position (0 = top, 1 = bottom). */
export function getScrollRatio(element: HTMLElement): number {
  const max = element.scrollHeight - element.clientHeight;
  if (max <= 0) {
    return 0;
  }

  return element.scrollTop / max;
}

export function setScrollRatio(element: HTMLElement, ratio: number): void {
  const max = element.scrollHeight - element.clientHeight;
  element.scrollTop = Math.max(0, Math.min(max, ratio * max));
}
