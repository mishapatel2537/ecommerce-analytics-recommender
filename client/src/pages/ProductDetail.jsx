import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import api from '../api/axios'; // from Person A

export default function ProductDetail() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    setLoading(true);
    api.get(`/products/${id}`)
      .then(res => setProduct(res.data.product))
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAdd = async () => {
    try {
      await addToCart(product._id, qty);
      setStatus({ type: 'success', text: 'Added to cart' });
    } catch (err) {
      setStatus({ type: 'error', text: err.response?.data?.message || 'Please log in first' });
    }
  };

  if (loading) {
    return <div className="mx-auto max-w-5xl px-4 py-20 text-center text-slate-500">Loading...</div>;
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-20 text-center">
        <p className="text-slate-600">We couldn't find that product.</p>
        <Link to="/" className="mt-4 inline-block text-sm font-semibold text-slate-900 underline">Back to shop</Link>
      </div>
    );
  }

  const inStock = product.stock > 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <Link to="/" className="text-sm text-slate-500 hover:text-slate-900">← Back to shop</Link>

      <div className="mt-6 grid gap-10 md:grid-cols-2">
        <div className="flex aspect-square items-center justify-center rounded-2xl bg-slate-100 text-7xl font-semibold text-slate-300">
          {product.name.charAt(0)}
        </div>

        <div className="flex flex-col">
          <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            {product.category}
          </span>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{product.name}</h1>
          <p className="mt-4 text-3xl font-semibold text-slate-900">₹{Number(product.price).toFixed(2)}</p>

          <p className={`mt-3 text-sm font-medium ${inStock ? 'text-green-700' : 'text-red-600'}`}>
            {inStock ? `${product.stock} in stock` : 'Out of stock'}
          </p>

          <div className="mt-6 flex items-center gap-4">
            <div className="flex items-center rounded-xl border border-slate-200">
              <button
                onClick={() => setQty(q => Math.max(1, q - 1))}
                className="px-4 py-2 text-lg text-slate-700 hover:bg-slate-50"
              >-</button>
              <span className="w-10 text-center text-sm font-medium">{qty}</span>
              <button
                onClick={() => setQty(q => Math.min(product.stock, q + 1))}
                className="px-4 py-2 text-lg text-slate-700 hover:bg-slate-50"
              >+</button>
            </div>

            <button
              onClick={handleAdd}
              disabled={!inStock}
              className="flex-1 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Add to cart
            </button>
          </div>

          {status && (
            <p className={`mt-4 text-sm ${status.type === 'success' ? 'text-green-700' : 'text-red-600'}`}>
              {status.text}
              {status.type === 'success' && (
                <Link to="/cart" className="ml-2 font-semibold underline">View cart</Link>
              )}
            </p>
          )}
        </div>
      </div>

      {/* Slots for Person C */}
      {/* <ReviewSection productId={product._id} /> */}
      {/* <AlsoBoughtStrip productId={product._id} /> */}
    </div>
  );
}