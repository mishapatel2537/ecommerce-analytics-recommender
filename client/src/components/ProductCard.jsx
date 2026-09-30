import { useState } from 'react';
import { Link } from 'react-router-dom';
import Icon, { categoryIcon } from './Icon';
import { productImage } from '../utils/productImage';

const formatPrice = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

function StockBadge({ stock }) {
  if (stock === 0) {
    return <span className="rounded-md bg-slate-900/85 px-2 py-1 text-xs font-medium text-white">Sold out</span>;
  }
  if (stock < 10) {
    return <span className="rounded-md bg-white px-2 py-1 text-xs font-medium text-amber-700 shadow-sm">Only {stock} left</span>;
  }
  return null;
}

// Product photo with a quiet placeholder if the image is missing
export function ProductImage({ product, className = '' }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className={`flex items-center justify-center bg-stone-100 text-stone-400 ${className}`}>
        <Icon name={categoryIcon(product.category)} className="h-10 w-10" strokeWidth={1.25} />
      </div>
    );
  }
  return (
    <img
      src={productImage(product)}
      alt={product.name}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`object-cover ${className}`}
    />
  );
}

export default function ProductCard({ product }) {
  return (
    <Link to={`/products/${product._id}`} className="group flex flex-col">
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-stone-100 ring-1 ring-stone-200/70">
        <ProductImage
          product={product}
          className="h-full w-full transition duration-500 ease-out group-hover:scale-[1.04]"
        />
        <div className="absolute top-3 left-3">
          <StockBadge stock={product.stock} />
        </div>
      </div>

      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-[15px] font-medium text-slate-900 group-hover:underline group-hover:underline-offset-4">
            {product.name}
          </h3>
          <p className="mt-0.5 text-sm text-slate-500">{product.category}</p>
        </div>
        <span className="shrink-0 text-[15px] font-semibold text-slate-900 tabular-nums">{formatPrice(product.price)}</span>
      </div>
    </Link>
  );
}

export function ProductCardSkeleton() {
  return (
    <div>
      <div className="skeleton aspect-[4/3] rounded-xl" />
      <div className="mt-3 flex justify-between">
        <div className="space-y-2">
          <div className="skeleton h-4 w-32 rounded" />
          <div className="skeleton h-3.5 w-20 rounded" />
        </div>
        <div className="skeleton h-4 w-14 rounded" />
      </div>
    </div>
  );
}
