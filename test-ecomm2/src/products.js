export const PRODUCTS = [
  {
    id: 'mug-01',
    name: 'Ceramic Coffee Mug',
    price: 14.0,
    description:
      'Handmade stoneware mug, 350ml. Microwave and dishwasher safe.',
    emoji: '☕',
  },
  {
    id: 'tote-01',
    name: 'Canvas Tote Bag',
    price: 22.5,
    description: 'Heavyweight organic cotton tote with reinforced straps.',
    emoji: '👜',
  },
  {
    id: 'notebook-01',
    name: 'Dotted Notebook',
    price: 9.75,
    description: 'A5 dotted notebook, 160 pages of 100gsm paper.',
    emoji: '📓',
  },
  {
    id: 'plant-01',
    name: 'Mini Potted Plant',
    price: 18.0,
    description: 'A small snake plant in a ceramic pot. Low maintenance.',
    emoji: '🪴',
  },
  {
    id: 'candle-01',
    name: 'Soy Wax Candle',
    price: 16.5,
    description: 'Lavender-scented hand-poured candle, 40h burn time.',
    emoji: '🕯️',
  },
  {
    id: 'bottle-01',
    name: 'Insulated Bottle',
    price: 28.0,
    description: 'Stainless steel, 500ml. Keeps drinks cold for 24h.',
    emoji: '🍼',
  },
];

export function findProduct(id) {
  return PRODUCTS.find((p) => p.id === id);
}

export const CURRENCY_SYMBOL = '₹';
export const SHIPPING_FLAT = 5.0;

export function formatMoney(n) {
  return `${CURRENCY_SYMBOL}${Number(n).toFixed(2)}`;
}
