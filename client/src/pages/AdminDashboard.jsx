import SegmentsChart from '../components/SegmentsChart.jsx';

export default function AdminDashboard({ user }) {
  const isAdmin = user && user.role === 'admin';

  return (
    <>
      <div className="page-title">
        <h1>Admin dashboard</h1>
        <p className="muted">Customer insights and sales analytics.</p>
      </div>

      {isAdmin ? (
        <SegmentsChart />
      ) : (
        <section className="panel gate">
          <div className="gate-icon">{'\uD83D\uDD12'}</div>
          <h2>Admin access required</h2>
          <p className="muted">Sign in with an admin account from the menu in the top right to view the dashboard.</p>
        </section>
      )}
    </>
  );
}
