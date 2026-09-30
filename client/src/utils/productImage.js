// Product photos live in client/public/products/<slug>.webp (see docs/image-credits.md).
// The file name is the product name slugified, so no schema change is needed:
//   'Laptop Pro 14"' -> /products/laptop-pro-14.webp
// If a product has its own `image` field, that wins. Products without a photo
// (e.g. ones an admin just created) fail to load, and the UI shows a placeholder.

export const slugify = (name) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export function productImage(product) {
  return product.image || `/products/${slugify(product.name)}.webp`;
}
