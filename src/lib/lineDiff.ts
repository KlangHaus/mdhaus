export interface DiffLine {
  kind: "same" | "add" | "remove";
  text: string;
  oldLine?: number;
  newLine?: number;
}

function lcsMatrix(left: string[], right: string[]): number[][] {
  const rows = left.length + 1;
  const cols = right.length + 1;
  const matrix: number[][] = Array.from({ length: rows }, () => Array(cols).fill(0));

  for (let row = 1; row < rows; row += 1) {
    for (let col = 1; col < cols; col += 1) {
      if (left[row - 1] === right[col - 1]) {
        matrix[row][col] = matrix[row - 1][col - 1] + 1;
      } else {
        matrix[row][col] = Math.max(matrix[row - 1][col], matrix[row][col - 1]);
      }
    }
  }

  return matrix;
}

export function diffLines(oldText: string, newText: string): DiffLine[] {
  const left = oldText.split("\n");
  const right = newText.split("\n");
  const matrix = lcsMatrix(left, right);
  const result: DiffLine[] = [];

  let row = left.length;
  let col = right.length;

  const stack: DiffLine[] = [];

  while (row > 0 || col > 0) {
    if (row > 0 && col > 0 && left[row - 1] === right[col - 1]) {
      stack.push({ kind: "same", text: left[row - 1], oldLine: row, newLine: col });
      row -= 1;
      col -= 1;
    } else if (col > 0 && (row === 0 || matrix[row][col - 1] >= matrix[row - 1][col])) {
      stack.push({ kind: "add", text: right[col - 1], newLine: col });
      col -= 1;
    } else if (row > 0) {
      stack.push({ kind: "remove", text: left[row - 1], oldLine: row });
      row -= 1;
    }
  }

  while (stack.length > 0) {
    result.push(stack.pop() as DiffLine);
  }

  return result;
}
