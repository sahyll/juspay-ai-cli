import ProductCard from '../components/ProductCard.jsx';
import { PRODUCTS } from '../products.js';

export default function Home() {
  return (
    <>
      <section className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Everyday essentials, thoughtfully picked.
        </h1>
        <p className="text-gray-500">Browse our small, curated collection.</p>
      </section>
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {PRODUCTS.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </section>
    </>
  );
}
