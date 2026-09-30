import { Routes, Route } from 'react-router-dom';

function Home() {
  return (
    <div className="mx-auto max-w-5xl p-8">
      <h1 className="text-3xl font-bold">E-commerce Analytics</h1>
      <p className="mt-2 text-gray-600">Skeleton is running. Pages get registered in App.jsx.</p>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Register pages here: one line per route. */}
      <Route path="/" element={<Home />} />
    </Routes>
  );
}
