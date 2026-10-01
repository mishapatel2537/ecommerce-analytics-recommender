import { useEffect, useState } from 'react';
import api from './api/axios.js';
import Header from './components/Header.jsx';
import Storefront from './pages/Storefront.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';

export default function App() {
  const [view, setView] = useState('store');
  const [users, setUsers] = useState([]);
  const [userId, setUserId] = useState(localStorage.getItem('testUserId') || '');

  useEffect(() => {
    api.get('/dev/users').then((res) => setUsers(res.data)).catch(() => {});
  }, []);

  const user = users.find((u) => u._id === userId) || null;

  const signIn = (id) => {
    const next = users.find((u) => u._id === id);
    if (next) {
      localStorage.setItem('testUserId', next._id);
      localStorage.setItem('testRole', next.role);
    } else {
      localStorage.removeItem('testUserId');
      localStorage.removeItem('testRole');
    }
    setUserId(id);
  };

  return (
    <>
      <Header view={view} onView={setView} users={users} userId={userId} onSignIn={signIn} user={user} />
      <main className="container">
        {view === 'store' ? (
          <Storefront key={userId} user={user} />
        ) : (
          <AdminDashboard key={userId} user={user} />
        )}
      </main>
    </>
  );
}
