import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderHistory from './pages/OrderHistory';
<Routes>
<Route path="/products/:id" element={<ProductDetail />} />
<Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
<Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
<Route path="/orders" element={<ProtectedRoute><OrderHistory /></ProtectedRoute>} />
</Routes>