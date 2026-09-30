import { Link } from 'react-router-dom';

const formatPrice = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

function StockBadge({ stock }) {
  if (stock === 0) {
    return <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">Out of stock</span>;
  }
  if (stock < 10) {
    return <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">Only {stock} left</span>;
  }
  return <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-800">In stock</span>;
}

export default function ProductCard({ product }) {
  return (
    <Link
      to={`/products/${product._id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      {/* No product images in the schema: show the initial as a placeholder */}
      <div className="flex aspect-[16/9] items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
        <span className="text-5xl font-bold text-gray-400 transition group-hover:text-blue-500">{product.name[0]}</span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <span className="text-xs font-medium uppercase tracking-wide text-gray-500">{product.category}</span>
        <h3 className="line-clamp-2 font-semibold text-gray-900 group-hover:text-blue-700">{product.name}</h3>
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-lg font-bold text-gray-900">{formatPrice(product.price)}</span>
          <StockBadge stock={product.stock} />
        </div>
      </div>
    </Link>
  );
}
