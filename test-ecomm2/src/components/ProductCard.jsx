import { useState } from 'react';
import { useCart } from '../context/CartContext.jsx';
import { formatMoney } from '../products.js';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);

  function handleAdd() {
    addToCart(product.id);
    setAdded(true);
    setTimeout(() => setAdded(false), 1000);
  }

  return (
    <article className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-2 shadow-card transition hover:-translate-y-0.5 hover:shadow-cardHover">
      <div
        aria-hidden="true"
        className="text-5xl text-center py-4 bg-gray-50 rounded-lg"
      >
        {product.emoji}
      </div>
      <h3 className="text-base font-semibold mt-1">{product.name}</h3>
      <p className="text-sm text-gray-500 flex-1">{product.description}</p>
      <div className="flex items-center justify-between mt-2">
        <span className="font-semibold text-lg">
          {formatMoney(product.price)}
        </span>
        <button
          onClick={handleAdd}
          className={`btn btn-primary ${added ? '!bg-green-600 !border-green-600' : ''}`}
        >
          {added ? 'Added ✓' : 'Add to cart'}
        </button>
      </div>
    </article>
  );
}
