// Utility to calculate distance between two points
export function distance([x1, y1], [x2, y2]) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

// Map normalized [0,1] coordinates to canvas size, mirrored horizontally
export function mapToCanvas([x, y], width, height) {
  return [(1 - x) * width, y * height];
}
