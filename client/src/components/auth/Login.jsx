import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Alert } from '../shared/ui';

const DEMOS = [
  { label: 'Admin', email: 'admin@plasmahub.com', password: 'Admin@123' },
  { label: 'Hospital', email: 'apollo@plasmahub.com', password: 'Hospital@123' },
  { label: 'Patient', email: 'patient@plasmahub.com', password: 'Patient@123' }
];

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (key) => (event) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
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

  const fillDemo = (demo) => {
    setForm({ email: demo.email, password: demo.password });
    setError('');
  };

  return (
    <div className="auth-wrap">
      <div className="auth-box">
        <div className="auth-hero">
          <div className="hero-icon">🩸</div>
          <h1>PlasmaHub</h1>
          <p>Manage blood requests, inventory, and hospital workflows from one dashboard.</p>
        </div>

        <div className="auth-card">
          <h2>Sign In</h2>
          {error && <Alert type="error">{error}</Alert>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                value={form.email}
                onChange={handleChange('email')}
                autoComplete="email"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                value={form.password}
                onChange={handleChange('password')}
                autoComplete="current-password"
                required
              />
            </div>
            <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
          <div className="auth-footer">
            New to PlasmaHub? <Link className="auth-link" to="/register">Create an account</Link>
          </div>
        </div>

        <div className="demo-card">
          <div className="demo-card-title">Demo Accounts</div>
          {DEMOS.map((demo) => (
            <div key={demo.label} className="demo-row">
              <div>
                <div className="demo-info">{demo.label}</div>
                <div className="demo-email">{demo.email}</div>
              </div>
              <button className="btn btn-outline btn-sm" type="button" onClick={() => fillDemo(demo)}>
                Fill
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
