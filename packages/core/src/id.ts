let counter = 0;

export function createId(prefix = "af"): string {
  counter++;
  return `${prefix}-${counter}`;
}