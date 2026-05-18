function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [
    parseInt(h.substring(0, 2), 16) / 255,
    parseInt(h.substring(2, 4), 16) / 255,
    parseInt(h.substring(4, 6), 16) / 255,
  ];
}

function srgbToLinear(c) {
  if (c <= 0.04045) return c / 12.92;
  return Math.pow((c + 0.055) / 1.055, 2.4);
}

function luminance(hex) {
  const [r, g, b] = hexToRgb(hex);
  const lr = srgbToLinear(r);
  const lg = srgbToLinear(g);
  const lb = srgbToLinear(b);
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
}

function contrastRatio(hexA, hexB) {
  const L1 = luminance(hexA);
  const L2 = luminance(hexB);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

const brand = {
  'brand-brown': '#4A2C21',
  'brand-beige': '#E8D9C5',
  'brand-white': '#F5F1EA',
  'muted': '#7a5f50',
};

const pairs = [
  ['brand-brown','brand-white'],
  ['brand-white','brand-brown'],
  ['brand-brown','brand-beige'],
  ['brand-beige','brand-brown'],
  ['muted','brand-white'],
  ['muted','brand-beige'],
];

function check(c) {
  return {
    'contrast': Math.round(c*100)/100,
    'AA_normal': c >= 4.5,
    'AA_large': c >= 3.0,
    'AAA_normal': c >= 7.0
  };
}

const results = pairs.map(([fg,bg]) => {
  const ratio = contrastRatio(brand[fg], brand[bg]);
  const res = check(ratio);
  return { fg, bg, fg_hex: brand[fg], bg_hex: brand[bg], ...res };
});

console.log(JSON.stringify(results, null, 2));
