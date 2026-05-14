import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Alert } from '../shared/ui';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [role, setRole] = useState('patient');
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    bloodGroup: 'O+',
    age: '',
    address: '',
    hospitalName: '',
    licenseNumber: '',
    city: '',
    state: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRoleChange = (nextRole) => {
    setRole(nextRole);
    setError('');
  };

  const handleChange = (key) => (event) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        role,
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        bloodGroup: role === 'patient' ? form.bloodGroup : undefined,
        age: role === 'patient' ? Number(form.age) : undefined,
        address: role === 'patient' ? form.address : undefined,
        hospitalName: role === 'hospital' ? form.hospitalName : undefined,
        licenseNumber: role === 'hospital' ? form.licenseNumber : undefined,
        city: role === 'hospital' ? form.city : undefined,
        state: role === 'hospital' ? form.state : undefined
      };

      const user = await register(payload);
      navigate(`/${user.role}`, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-box">
        <div className="auth-hero">
          <div className="hero-icon">🩸</div>
          <h1>Register</h1>
          <p>Choose a role and create your PlasmaHub account.</p>
        </div>

        <div className="auth-card">
          <div className="role-tabs">
            <button
              type="button"
              className={`role-tab ${role === 'patient' ? 'active' : ''}`}
              onClick={() => handleRoleChange('patient')}
            >
              <div className="rt-icon">🧑‍🤝‍🧑</div>
              <div className="rt-label">Patient</div>
            </button>
            <button
              type="button"
              className={`role-tab ${role === 'hospital' ? 'active' : ''}`}
              onClick={() => handleRoleChange('hospital')}
            >
              <div className="rt-icon">🏥</div>
              <div className="rt-label">Hospital</div>
            </button>
          </div>

          {error && <Alert type="error">{error}</Alert>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Name</label>
              <input className="form-input" value={form.name} onChange={handleChange('name')} required />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" value={form.email} onChange={handleChange('email')} required />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-input" type="tel" value={form.phone} onChange={handleChange('phone')} required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" value={form.password} onChange={handleChange('password')} required />
            </div>

            {role === 'patient' ? (
              <>
                <div className="form-group">
                  <label className="form-label">Blood Group</label>
                  <select className="form-select" value={form.bloodGroup} onChange={handleChange('bloodGroup')}>
                    {BLOOD_GROUPS.map((bg) => <option key={bg} value={bg}>{bg}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Age</label>
                  <input className="form-input" type="number" min="1" max="120" value={form.age} onChange={handleChange('age')} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Address</label>
                  <textarea className="form-textarea" value={form.address} onChange={handleChange('address')} />
                </div>
              </>
            ) : (
              <>
                <div className="form-group">
                  <label className="form-label">Hospital Name</label>
                  <input className="form-input" value={form.hospitalName} onChange={handleChange('hospitalName')} required />
                </div>
                <div className="form-group">
                  <label className="form-label">License Number</label>
                  <input className="form-input" value={form.licenseNumber} onChange={handleChange('licenseNumber')} />
                </div>
                <div className="form-row cols-2">
                  <div className="form-group">
                    <label className="form-label">City</label>
                    <input className="form-input" value={form.city} onChange={handleChange('city')} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">State</label>
                    <input className="form-input" value={form.state} onChange={handleChange('state')} required />
                  </div>
                </div>
              </>
            )}

            <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
          <div className="auth-footer">
            Already have an account? <Link className="auth-link" to="/login">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
