import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import PatientDashboard from './components/patient/PatientDashboard';
import HospitalDashboard from './components/hospital/HospitalDashboard';
import AdminDashboard from './components/admin/AdminDashboard.jsx';

function LoadingScreen() {
  return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', flexDirection:'column', gap:16 }}>
      <div style={{ fontSize:48 }}>🩸</div>
      <div style={{ width:36, height:36, border:'3px solid #fee2e2', borderTopColor:'#dc2626', borderRadius:'50%', animation:'spin .8s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

/** Only accessible when NOT logged in */
function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (user) return <Navigate to={`/${user.role}`} replace />;
  return children;
}

/** Only accessible by a specific role */
function RoleRoute({ role, children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to={`/${user.role}`} replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/patient"  element={<RoleRoute role="patient"><PatientDashboard /></RoleRoute>} />
          <Route path="/hospital" element={<RoleRoute role="hospital"><HospitalDashboard /></RoleRoute>} />
          <Route path="/admin"    element={<RoleRoute role="admin"><AdminDashboard /></RoleRoute>} />
          <Route path="*"         element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}