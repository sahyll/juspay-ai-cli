import { Link, NavLink } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';

export default function Header() {
  const { itemCount } = useCart();

  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
      <div className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between">
        <Link to="/" className="font-bold text-lg tracking-tight">
          Shoply
        </Link>
        <nav className="flex items-center gap-5 text-sm">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              isActive ? 'text-gray-900' : 'text-gray-500 hover:text-gray-900'
            }
          >
            Products
          </NavLink>
          <NavLink
            to="/cart"
            className={({ isActive }) =>
              `inline-flex items-center gap-2 ${
                isActive ? 'text-gray-900' : 'text-gray-500 hover:text-gray-900'
              }`
            }
          >
            Cart
            <span className="inline-flex items-center justify-center min-w-[1.4rem] h-[1.4rem] px-1.5 bg-brand text-white rounded-full text-xs font-semibold">
              {itemCount}
            </span>
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
