import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import Topbar from '../shared/Topbar';
import { StatusBadge, BloodTag, EmptyState, Spinner, useToast } from '../shared/ui';
import { adminAPI } from '../../service/api';


const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

function fmt(dateString) {
  return new Date(dateString).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function OverviewTab({ metrics }) {
  const maxCount = Math.max(...(metrics.bloodGroupDemand?.map((item) => item.count) || [1]), 1);
  const COLORS = ['#dc2626', '#ea580c', '#d97706', '#65a30d', '#0d9488', '#2563eb', '#7c3aed', '#db2777'];

  return (
    <>
      <div className="stats-grid">
        {[
          { label: 'Patients', value: metrics.totalPatients, color: 'var(--purple)' },
          { label: 'Hospitals', value: metrics.totalHospitals, color: 'var(--blue)' },
          { label: 'Total Requests', value: metrics.totalRequests, color: 'var(--red)' },
          { label: 'Pending', value: metrics.pendingRequests, color: 'var(--amber)' },
          { label: 'Fulfilled', value: metrics.fulfilledRequests, color: 'var(--green)' },
          { label: 'Critical', value: metrics.criticalRequests, color: '#f97316' },
          { label: 'Last 7 Days', value: metrics.recentRequests, color: 'var(--gray-400)' }
        ].map((item) => (
          <div key={item.label} className="stat-card" style={{ '--stat-color': item.color }}>
            <div className="stat-value">{item.value}</div>
            <div className="stat-label">{item.label}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header"><div className="card-title">Blood Group Demand</div></div>
        <div className="bar-chart">
          {BLOOD_GROUPS.map((bg, index) => {
            const demand = metrics.bloodGroupDemand?.find((item) => item._id === bg);
            const count = demand?.count || 0;
            const pct = Math.max(3, Math.round((count / maxCount) * 100));
            return (
              <div key={bg} className="bar-col">
                <div className="bar" style={{ height: `${pct}%`, background: COLORS[index] }} />
                <div className="bar-val">{count}</div>
                <div className="bar-lbl">{bg}</div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

function UsersTab({ users, loading, roleFilter, setRoleFilter }) {
  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">Users</div>
        <select className="form-select" style={{ width: 160 }} value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="">All Roles</option>
          <option value="patient">Patient</option>
          <option value="hospital">Hospital</option>
        </select>
      </div>
      {loading ? (
        <Spinner />
      ) : users.length === 0 ? (
        <EmptyState icon="👥" message="No users found for this filter." />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name / Hospital</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id}>
                  <td>{user.name || user.hospitalName}</td>
                  <td>{user.email}</td>
                  <td><span className={`badge ${user.role === 'patient' ? 'badge-patient' : 'badge-hospital'}`}>{user.role}</span></td>
                  <td>{fmt(user.createdAt)}</td>
                  <td><span className={user.isActive ? 'badge badge-active' : 'badge badge-inactive'}>{user.isActive ? 'Active' : 'Inactive'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function RequestsTab({ requests, loading, statusFilter, urgencyFilter, setStatusFilter, setUrgencyFilter }) {
  return (
    <div className="card">
      <div className="card-header" style={{ alignItems: 'center' }}>
        <div className="card-title">Requests</div>
        <div className="form-row cols-2" style={{ maxWidth: 360 }}>
          <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            {['pending', 'approved', 'fulfilled', 'rejected', 'cancelled'].map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <select className="form-select" value={urgencyFilter} onChange={(e) => setUrgencyFilter(e.target.value)}>
            <option value="">All Urgency</option>
            {['routine', 'urgent', 'critical'].map((urgency) => (
              <option key={urgency} value={urgency}>{urgency}</option>
            ))}
          </select>
        </div>
      </div>
      {loading ? (
        <Spinner />
      ) : requests.length === 0 ? (
        <EmptyState icon="📭" message="No blood requests match the filters." />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Patient</th>
                <th>Hospital</th>
                <th>Blood</th>
                <th>Units</th>
                <th>Urgency</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request._id} className={request.urgency === 'critical' ? 'row-critical' : ''}>
                  <td>{request.patient?.name || '—'}</td>
                  <td>{request.hospital?.hospitalName || 'Any hospital'}</td>
                  <td><BloodTag group={request.bloodGroup} /></td>
                  <td>{request.units}</td>
                  <td><span className={`badge badge-${request.urgency}`}>{request.urgency}</span></td>
                  <td><StatusBadge status={request.status} /></td>
                  <td>{fmt(request.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function InventoryTab({ inventories, loading }) {
  return (
    <div>
      {loading ? (
        <Spinner />
      ) : inventories.length === 0 ? (
        <EmptyState icon="🏥" message="No inventory data available." />
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {inventories.map((inv) => (
            <div key={inv._id} className="card">
              <div className="card-header" style={{ justifyContent: 'space-between' }}>
                <div>
                  <div className="card-title">{inv.hospital?.hospitalName}</div>
                  <div className="card-sub">{inv.hospital?.city}, {inv.hospital?.state}</div>
                </div>
                <div className="text-sm text-muted">Total: {inv.stock?.reduce((sum, item) => sum + item.units, 0)} units</div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {inv.stock?.map((item) => {
                  const statusClass = item.units === 0 ? 'inv-empty' : item.units <= 5 ? 'inv-critical' : item.units <= 15 ? 'inv-low' : 'inv-good';
                  return (
                    <div key={item.bloodGroup} className={`inv-cell ${statusClass}`} style={{ minWidth: 90, flex: '1 1 120px' }}>
                      <div className="bg-label">{item.bloodGroup}</div>
                      <div className="units">{item.units}</div>
                      <div className="unit-lbl">units</div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState('overview');
  const [metrics, setMetrics] = useState(null);
  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [inventories, setInventories] = useState([]);
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const { toast, show, dismiss } = useToast();

  const fetchMetrics = useCallback(async () => {
    try {
      const { data } = await adminAPI.getMetrics();
      setMetrics(data.data);
    } catch (err) {
      show(err.response?.data?.message || 'Unable to load metrics.', 'error');
    }
  }, [show]);

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const { data } = await adminAPI.getUsers({ role: roleFilter || undefined, limit: 50 });
      setUsers(data.data);
    } catch (err) {
      show(err.response?.data?.message || 'Unable to load users.', 'error');
    } finally {
      setLoadingUsers(false);
    }
  }, [roleFilter, show]);

  const fetchRequests = useCallback(async () => {
    setLoadingRequests(true);
    try {
      const { data } = await adminAPI.getRequests({ status: statusFilter || undefined, urgency: urgencyFilter || undefined, limit: 100 });
      setRequests(data.data);
    } catch (err) {
      show(err.response?.data?.message || 'Unable to load requests.', 'error');
    } finally {
      setLoadingRequests(false);
    }
  }, [statusFilter, urgencyFilter, show]);

  const fetchInventory = useCallback(async () => {
    setLoadingInventory(true);
    try {
      const { data } = await adminAPI.getInventory();
      setInventories(data.data);
    } catch (err) {
      show(err.response?.data?.message || 'Unable to load inventory.', 'error');
    } finally {
      setLoadingInventory(false);
    }
  }, [show]);

  useEffect(() => {
    // Load metrics on mount only
    fetchMetrics();
  }, []);  // Load once on mount

  useEffect(() => {
    // Re-fetch users when roleFilter changes
    if (tab === 'users') fetchUsers();
  }, [tab, roleFilter]);  // Depend on actual state, not callback

  useEffect(() => {
    // Re-fetch requests when tab or filters change
    if (tab === 'requests') fetchRequests();
  }, [tab, statusFilter, urgencyFilter]);  // Depend on actual state, not callback

  useEffect(() => {
    // Re-fetch inventory when tab changes
    if (tab === 'inventory') fetchInventory();
  }, [tab]);  // Depend on actual state, not callback

  return (
    <div className="app">
      <Topbar toast={toast} onDismissToast={dismiss} />
      <main className="main-content">
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header" style={{ alignItems: 'center' }}>
            <div>
              <div className="page-title">Admin Dashboard</div>
              <div className="page-sub">Manage users, requests, and inventory overview</div>
            </div>
          </div>
        </div>

        <div className="tabs">
          <button className={`tab-btn ${tab === 'overview' ? 'active' : ''}`} type="button" onClick={() => setTab('overview')}>
            📊 Overview
          </button>
          <button className={`tab-btn ${tab === 'users' ? 'active' : ''}`} type="button" onClick={() => setTab('users')}>
            👥 Users
          </button>
          <button className={`tab-btn ${tab === 'requests' ? 'active' : ''}`} type="button" onClick={() => setTab('requests')}>
            💉 Requests
          </button>
          <button className={`tab-btn ${tab === 'inventory' ? 'active' : ''}`} type="button" onClick={() => setTab('inventory')}>
            🗃️ Inventory
          </button>
        </div>

        {tab === 'overview' && (metrics ? <OverviewTab metrics={metrics} /> : <Spinner />)}
        {tab === 'users' && <UsersTab users={users} loading={loadingUsers} roleFilter={roleFilter} setRoleFilter={setRoleFilter} />}
        {tab === 'requests' && (
          <RequestsTab
            requests={requests}
            loading={loadingRequests}
            statusFilter={statusFilter}
            urgencyFilter={urgencyFilter}
            setStatusFilter={setStatusFilter}
            setUrgencyFilter={setUrgencyFilter}
          />
        )}
        {tab === 'inventory' && <InventoryTab inventories={inventories} loading={loadingInventory} />}
      </main>
    </div>
  );
}
