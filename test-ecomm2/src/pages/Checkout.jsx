import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { formatMoney } from '../products.js';

const EMPTY_FORM = {
  name: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  postal: '',
  country: '',
};

export default function Checkout() {
  const { items, subtotal, shipping, total } = useCart();
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitted, setSubmitted] = useState(false);

  function update(key) {
    return (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  function handlePayNow(e) {
    e.preventDefault();
    // Payment integration is intentionally stubbed — to be wired up later.
    setSubmitted(true);
  }

  if (items.length === 0 && !submitted) {
    return (
      <>
        <h1 className="text-2xl font-bold mb-6">Checkout</h1>
        <div className="bg-white border border-gray-200 rounded-xl text-center py-12 px-4">
          <p className="text-gray-500 mb-4">
            Your cart is empty — add something first.
          </p>
          <Link to="/" className="btn btn-primary">
            Browse products
          </Link>
        </div>
      </>
    );
  }

  if (submitted) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl text-center py-14 px-6 max-w-lg mx-auto">
        <div className="w-16 h-16 mx-auto rounded-full bg-amber-500 text-white inline-flex items-center justify-center text-2xl font-bold mb-3">
          …
        </div>
        <h1 className="text-2xl font-bold mb-2">Pay Now clicked</h1>
        <p className="text-gray-500 mb-1">
          Payment integration isn't wired up yet — this is where the gateway
          handoff will go.
        </p>
        <p className="text-gray-500 mb-6">
          Order total:{' '}
          <span className="font-semibold text-gray-900">
            {formatMoney(total)}
          </span>
        </p>
        <div className="flex gap-2 justify-center">
          <Link to="/" className="btn">
            Back to store
          </Link>
          <button onClick={() => setSubmitted(false)} className="btn btn-primary">
            Edit order
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>
      <div className="grid grid-cols-1 md:grid-cols-[1fr_360px] gap-8 items-start">
        <section className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="font-semibold mb-4">Shipping &amp; contact</h2>
          <form onSubmit={handlePayNow} className="flex flex-col gap-4">
            <Field label="Full name" required>
              <input
                className="input"
                type="text"
                autoComplete="name"
                value={form.name}
                onChange={update('name')}
                required
              />
            </Field>
            <Field label="Email" required>
              <input
                className="input"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={update('email')}
                required
              />
            </Field>
            <Field label="Phone" required>
              <input
                className="input"
                type="tel"
                autoComplete="tel"
                pattern="[0-9+\-\s]{6,20}"
                placeholder="e.g. 9999999999"
                value={form.phone}
                onChange={update('phone')}
                required
              />
            </Field>
            <Field label="Address" required>
              <input
                className="input"
                type="text"
                autoComplete="street-address"
                value={form.address}
                onChange={update('address')}
                required
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="City" required>
                <input
                  className="input"
                  type="text"
                  autoComplete="address-level2"
                  value={form.city}
                  onChange={update('city')}
                  required
                />
              </Field>
              <Field label="Postal code" required>
                <input
                  className="input"
                  type="text"
                  autoComplete="postal-code"
                  value={form.postal}
                  onChange={update('postal')}
                  required
                />
              </Field>
            </div>
            <Field label="Country" required>
              <input
                className="input"
                type="text"
                autoComplete="country-name"
                value={form.country}
                onChange={update('country')}
                required
              />
            </Field>
            {/* Hidden submit so Enter still submits the form */}
            <button type="submit" className="hidden" />
          </form>
        </section>

        <aside className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="font-semibold mb-4">Order summary</h2>
          <div>
            {items.map((item) => (
              <div
                key={item.id}
                className="flex justify-between py-2 text-sm border-b border-dashed border-gray-200 last:border-b-0"
              >
                <span>
                  {item.emoji} {item.name} × {item.qty}
                </span>
                <span className="tabular-nums">
                  {formatMoney(item.price * item.qty)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-200">
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
          </div>
          <button
            type="button"
            onClick={handlePayNow}
            className="btn btn-primary btn-block"
            disabled={items.length === 0}
          >
            Pay now
          </button>
          <p className="text-sm text-gray-500 mt-3">
            Payment gateway will be wired up later.
          </p>
        </aside>
      </div>
    </>
  );
}

function Field({ label, required, children }) {
  return (
    <label className="flex flex-col gap-1 text-xs text-gray-500">
      <span>
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      {children}
    </label>
  );
}
