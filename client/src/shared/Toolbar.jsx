import { useAuth } from '../../context/AuthContext';

export default function Topbar({ toast, onDismissToast }) {
  const { user, logout } = useAuth();
  if (!user) return null;

  const initials = user.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  const roleClass = { patient: 'av-patient', hospital: 'av-hospital', admin: 'av-admin' }[user.role];
  const displayName = user.hospitalName || user.name;

  return (
    <>
      <header className="topbar">
        <div className="logo">
          <div className="logo-pulse" />
          🩸 PlasmaHub
        </div>

        <div className="user-chip">
          <div className={`avatar ${roleClass}`}>{initials}</div>
          <div>
            <div className="user-name">{displayName}</div>
            <div className="user-role">
              <span className={`badge badge-${user.role}`}>
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </span>
            </div>
          </div>
          <button className="btn btn-outline btn-sm" onClick={logout}>
            Sign out
          </button>
        </div>
      </header>

      {toast && (
        <div className={`toast toast-${toast.type}`} onClick={onDismissToast}>
          <span>
            {toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : 'ℹ️'}
          </span>
          {toast.msg}
        </div>
      )}
    </>
  );
}