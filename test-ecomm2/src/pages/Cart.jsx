import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { formatMoney } from '../products.js';

export default function Cart() {
  const { items, subtotal, shipping, total, setQty, removeFromCart } = useCart();

  if (items.length === 0) {
    return (
      <>
        <h1 className="text-2xl font-bold mb-6">Your cart</h1>
        <div className="bg-white border border-gray-200 rounded-xl text-center py-12 px-4">
          <p className="text-gray-500 mb-4">Your cart is empty.</p>
          <Link to="/" className="btn btn-primary">
            Browse products
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <h1 className="text-2xl font-bold mb-6">Your cart</h1>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-6">
        {items.map((item) => (
          <div
            key={item.id}
            className="grid grid-cols-[56px_1fr_auto_auto_32px] gap-4 items-center p-5 border-b border-gray-200 last:border-b-0"
          >
            <div className="text-3xl text-center" aria-hidden="true">
              {item.emoji}
            </div>
            <div>
              <h3 className="font-medium">{item.name}</h3>
              <p className="text-sm text-gray-500">
                {formatMoney(item.price)} each
              </p>
            </div>
            <div className="inline-flex items-center gap-2 border border-gray-200 rounded-lg p-1">
              <button
                onClick={() => setQty(item.id, item.qty - 1)}
                aria-label="Decrease"
                className="w-7 h-7 rounded hover:bg-gray-50"
              >
                −
              </button>
              <span className="min-w-[1.5rem] text-center tabular-nums">
                {item.qty}
              </span>
              <button
                onClick={() => setQty(item.id, item.qty + 1)}
                aria-label="Increase"
                className="w-7 h-7 rounded hover:bg-gray-50"
              >
                +
              </button>
            </div>
            <div className="font-semibold min-w-[70px] text-right tabular-nums">
              {formatMoney(item.price * item.qty)}
            </div>
            <button
              onClick={() => removeFromCart(item.id)}
              aria-label="Remove"
              className="w-7 h-7 rounded text-gray-500 hover:bg-gray-50 hover:text-red-600"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-5 max-w-sm ml-auto">
        <div className="flex justify-between py-1 tabular-nums">
          <span>Subtotal</span>
          <span>{formatMoney(subtotal)}</span>
        </div>
        <div className="flex justify-between py-1 tabular-nums">
          <span>Shipping</span>
          <span>{formatMoney(shipping)}</span>
        </div>
        <div className="flex justify-between border-t border-gray-200 mt-1 pt-3 font-bold text-lg tabular-nums">
          <span>Total</span>
          <span>{formatMoney(total)}</span>
        </div>
        <Link to="/checkout" className="btn btn-primary btn-block">
          Checkout
        </Link>
        <Link to="/" className="btn btn-ghost btn-block">
          Continue shopping
        </Link>
      </div>
    </>
  );
}
