import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Alert } from '../shared/ui';

const DEMOS = [
  { label: 'Admin',    email: 'admin@plasmahub.com',  password: 'Admin@123',    role: 'admin' },
  { label: 'Hospital', email: 'apollo@plasmahub.com', password: 'Hospital@123', role: 'hospital' },
  { label: 'Patient',  email: 'patient@plasmahub.com',password: 'Patient@123',  role: 'patient' },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm]     = useState({ email: '', password: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      navigate(`/${user.role}`, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = d => setForm({ email: d.email, password: d.password });

  return (
    <div className="auth-wrap">
      <div className="auth-box">
        <div className="auth-hero">
          <div className="hero-icon">🩸</div>
          <h1>PlasmaHub</h1>
          <p>Blood Bank Management System</p>
        </div>

        <div className="auth-card">
          <h2>Sign In</h2>

          {error && <Alert type="error">{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                className="form-input"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={set('email')}
                autoComplete="email"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="form-input"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={set('password')}
                autoComplete="current-password"
                required
              />
            </div>

            <button
              className="btn btn-primary btn-lg btn-full"
              type="submit"
              disabled={loading}
              style={{ marginTop: 4 }}
            >
              {loading ? 'Signing in…' : '🔑 Sign In'}
            </button>
          </form>

          <p className="auth-footer">
            Don't have an account?{' '}
            <Link to="/register" className="auth-link">Register here</Link>
          </p>
        </div>

        {/* Demo credentials */}
        <div className="demo-card">
          <div className="demo-card-title">⚡ Quick Demo Login</div>
          {DEMOS.map(d => (
            <div className="demo-row" key={d.label}>
              <div className="demo-info">
                <span className={`badge badge-${d.role}`} style={{ marginRight: 6 }}>{d.label}</span>
                <span className="demo-email">{d.email}</span>
              </div>
              <button className="btn btn-outline btn-sm" onClick={() => fillDemo(d)}>
                Fill
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}