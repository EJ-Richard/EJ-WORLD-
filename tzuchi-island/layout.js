// Upright sweet-potato silhouette in pointy-top odd-r hexes.
// Row 0 is north. Column increases toward the east. Penghu sits west of the bulge.
// Spacing follows the pointy-top odd-r formula: east-west is √3, north-south is 3/2.

export const HEX_SIZE = 1.12;

export const FILL = {
  coast: "#e4f3f8",
  plain: "#e7eef6",
  ridge: "#9ebbd4",
  lotus: "#f7dce6",
  penghu: "#d9eef4",
  topic: "#f8fbfe",
};

export const SIDE = {
  coast: "#7eafc8",
  plain: "#a9c0d4",
  ridge: "#5d86ab",
  lotus: "#e3b4c4",
  penghu: "#7eafc8",
  topic: "#0B3D6E",
};

// [col, row, kind, topicId]
const RAW = [
  [5, 0, "coast"],
  [4, 1, "coast"], [5, 1, "plain"], [6, 1, "coast"],
  [4, 2, "plain"], [5, 2, "plain"], [6, 2, "topic", "neihu"],
  [3, 3, "coast"], [4, 3, "plain"], [5, 3, "lotus"], [6, 3, "ridge"],
  [3, 4, "coast"], [4, 4, "topic", "land"], [5, 4, "plain"], [6, 4, "ridge"], [7, 4, "coast"],
  [2, 5, "coast"], [3, 5, "plain"], [4, 5, "plain"], [5, 5, "lotus"], [6, 5, "ridge"], [7, 5, "coast"],
  [1, 6, "coast"], [2, 6, "plain"], [3, 6, "topic", "bnt"], [4, 6, "plain"], [5, 6, "plain"], [6, 6, "topic", "finance"], [7, 6, "ridge"],
  [1, 7, "coast"], [2, 7, "plain"], [3, 7, "plain"], [4, 7, "lotus"], [5, 7, "plain"], [6, 7, "ridge"], [7, 7, "topic", "hospital"],
  [1, 8, "coast"], [2, 8, "topic", "fraud"], [3, 8, "plain"], [4, 8, "topic", "relief"], [5, 8, "plain"], [6, 8, "ridge"], [7, 8, "coast"],
  [1, 9, "coast"], [2, 9, "plain"], [3, 9, "plain"], [4, 9, "plain"], [5, 9, "lotus"], [6, 9, "ridge"], [7, 9, "coast"],
  [2, 10, "coast"], [3, 10, "plain"], [4, 10, "plain"], [5, 10, "plain"], [6, 10, "ridge"],
  [3, 11, "coast"], [4, 11, "plain"], [5, 11, "plain"], [6, 11, "coast"],
  [3, 12, "coast"], [4, 12, "plain"], [5, 12, "plain"], [6, 12, "coast"],
  [4, 13, "coast"], [5, 13, "plain"], [6, 13, "coast"],
  [4, 14, "coast"], [5, 14, "coast"],
  [5, 15, "coast"],
  [-3, 7, "penghu"], [-2, 7, "penghu"], [-3, 8, "penghu"], [-2, 8, "penghu"],
];

function jitter(col, row) {
  const n = Math.sin(col * 127.1 + row * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

export function buildHexes() {
  const placed = RAW.map(([col, row, kind, topic], index) => {
    const x = HEX_SIZE * Math.sqrt(3) * (col + 0.5 * (row & 1));
    const z = HEX_SIZE * 1.5 * row;
    return { index, col, row, kind, topic: topic || null, x, z, lift: (jitter(col, row) - 0.5) * 0.05 };
  });
  let sx = 0;
  let sz = 0;
  for (const hex of placed) {
    sx += hex.x;
    sz += hex.z;
  }
  const cx = sx / placed.length;
  const cz = sz / placed.length;
  return placed.map((hex) => ({ ...hex, x: hex.x - cx, z: hex.z - cz }));
}
