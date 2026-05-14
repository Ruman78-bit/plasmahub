import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Alert, FormGroup } from '../shared/ui';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState('patient');
  const [form, setForm] = useState({
    email: '', password: '', name: '', phone: '',
    // patient
    bloodGroup: 'O+', age: '', address: '',
    // hospital
    hospitalName: '', licenseNumber: '', city: '', state: '',
  });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    try {
      const user = await register({ ...form, role });
      navigate(`/${user.role}`, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-box">
        <div className="auth-hero">
          <div className="hero-icon" style={{ fontSize: 44 }}>🩸</div>
          <h1>Create Account</h1>
          <p>Join PlasmaHub today</p>
        </div>

        <div className="auth-card">
          <h2>Register</h2>

          {error && <Alert type="error">{error}</Alert>}

          {/* Role Selector */}
          <div className="role-tabs">
            {[
              { key: 'patient',  icon: '🧑‍⚕️', label: 'Patient' },
              { key: 'hospital', icon: '🏥',    label: 'Hospital' },
            ].map(r => (
              <div
                key={r.key}
                className={`role-tab ${role === r.key ? 'active' : ''}`}
                onClick={() => setRole(r.key)}
              >
                <div className="rt-icon">{r.icon}</div>
                <div className="rt-label">{r.label}</div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {/* Common fields */}
            <FormGroup label={role === 'hospital' ? 'Contact Person Name' : 'Full Name'}>
              <input className="form-input" placeholder="Your full name" value={form.name} onChange={set('name')} required />
            </FormGroup>

            <div className="form-row cols-2">
              <FormGroup label="Email Address">
                <input className="form-input" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required />
              </FormGroup>
              <FormGroup label="Phone Number">
                <input className="form-input" type="tel" placeholder="9999999999" value={form.phone} onChange={set('phone')} />
              </FormGroup>
            </div>

            <FormGroup label="Password (min 8 chars)">
              <input className="form-input" type="password" placeholder="••••••••" minLength={8} value={form.password} onChange={set('password')} required />
            </FormGroup>

            {/* Patient-specific */}
            {role === 'patient' && (
              <>
                <div className="form-row cols-2">
                  <FormGroup label="Your Blood Group">
                    <select className="form-select" value={form.bloodGroup} onChange={set('bloodGroup')}>
                      {BLOOD_GROUPS.map(bg => <option key={bg}>{bg}</option>)}
                    </select>
                  </FormGroup>
                  <FormGroup label="Age">
                    <input className="form-input" type="number" min="1" max="120" placeholder="25" value={form.age} onChange={set('age')} required />
                  </FormGroup>
                </div>
                <FormGroup label="Home Address">
                  <input className="form-input" placeholder="Street, City, State" value={form.address} onChange={set('address')} />
                </FormGroup>
              </>
            )}

            {/* Hospital-specific */}
            {role === 'hospital' && (
              <>
                <FormGroup label="Hospital Name">
                  <input className="form-input" placeholder="Apollo Blood Bank" value={form.hospitalName} onChange={set('hospitalName')} required />
                </FormGroup>
                <div className="form-row cols-2">
                  <FormGroup label="License Number">
                    <input className="form-input" placeholder="KA-BB-2024-001" value={form.licenseNumber} onChange={set('licenseNumber')} required />
                  </FormGroup>
                  <FormGroup label="City">
                    <input className="form-input" placeholder="Bengaluru" value={form.city} onChange={set('city')} required />
                  </FormGroup>
                </div>
                <FormGroup label="State">
                  <input className="form-input" placeholder="Karnataka" value={form.state} onChange={set('state')} required />
                </FormGroup>
              </>
            )}

            <button
              className="btn btn-primary btn-lg btn-full"
              type="submit"
              disabled={loading}
              style={{ marginTop: 6 }}
            >
              {loading ? 'Creating account…' : '🚀 Create Account'}
            </button>
          </form>

          <p className="auth-footer">
            Already have an account?{' '}
            <Link to="/login" className="auth-link">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}