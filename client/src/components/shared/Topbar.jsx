import { useAuth } from '../../context/AuthContext';

const roleBadge = {
  patient: 'badge-patient',
  hospital: 'badge-hospital',
  admin: 'badge-admin'
};

const roleLabel = {
  patient: 'Patient',
  hospital: 'Hospital',
  admin: 'Administrator'
};

const getInitials = (value) => {
  if (!value) return '';
  return value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
};

export default function Topbar({ toast, onDismissToast }) {
  const { user, logout } = useAuth();
  const displayName = user?.hospitalName || user?.name || 'User';
  const initials = getInitials(displayName);

  return (
    <header className="topbar">
      <div className="logo">
        <span className="logo-pulse" />
        PlasmaHub
      </div>
      <div className="user-chip">
        <div className={`avatar av-${user?.role}`}>{initials}</div>
        <div>
          <div className="user-name">{displayName}</div>
          <div className="user-role">
            <span className={`badge ${roleBadge[user?.role] || 'badge-info'}`}>
              {roleLabel[user?.role] || user?.role}
            </span>
          </div>
        </div>
        <button className="btn btn-outline btn-sm" onClick={logout} type="button">
          Sign out
        </button>
      </div>
      {toast && (
        <button
          type="button"
          className={`toast toast-${toast.type}`}
          onClick={onDismissToast}
          style={{ position: 'fixed', bottom: 24, right: 24 }}
        >
          {toast.msg}
        </button>
      )}
    </header>
  );
}
