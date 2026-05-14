import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import Topbar from '../shared/Topbar';
import { StatusBadge, UrgencyBadge, BloodTag, EmptyState, Spinner, Alert, Modal, FormGroup, useToast } from '../shared/ui';
import { hospitalAPI } from '../../service/api';


const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

function RequestsTab({ requests, loading, statusFilter, setStatusFilter, onRespond }) {
  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="card-title">Incoming Requests</div>
          <div className="card-sub">{requests.length} request{requests.length === 1 ? '' : 's'}</div>
        </div>
        <FormGroup label="Status Filter">
          <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            {['pending', 'approved', 'fulfilled', 'rejected', 'cancelled'].map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </FormGroup>
      </div>
      {loading ? (
        <Spinner />
      ) : requests.length === 0 ? (
        <EmptyState icon="📭" message="No requests yet. Check back later." />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Patient</th>
                <th>Blood Group</th>
                <th>Units</th>
                <th>Urgency</th>
                <th>Status</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request._id} className={request.urgency === 'critical' ? 'row-critical' : ''}>
                  <td>{request.patient?.name || '—'}</td>
                  <td><BloodTag group={request.bloodGroup} /></td>
                  <td>{request.units}</td>
                  <td><UrgencyBadge urgency={request.urgency} /></td>
                  <td><StatusBadge status={request.status} /></td>
                  <td>{new Date(request.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                  <td>
                    {['pending', 'approved'].includes(request.status) && (
                      <button className="btn btn-outline btn-sm" type="button" onClick={() => onRespond(request)}>
                        Respond
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function InventoryTab({ inventory, editing, draftStock, setDraftStock, onEditToggle, onSave }) {
  const getUnits = (group) => {
    if (editing) {
      return draftStock[group] ?? 0;
    }
    return inventory.stock?.find((item) => item.bloodGroup === group)?.units ?? 0;
  };

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="card-title">Blood Inventory</div>
          <div className="card-sub">Update stock for each group</div>
        </div>
        {editing ? (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-outline btn-sm" type="button" onClick={onEditToggle}>
              Cancel
            </button>
            <button className="btn btn-primary btn-sm" type="button" onClick={onSave}>
              Save Changes
            </button>
          </div>
        ) : (
          <button className="btn btn-primary btn-sm" type="button" onClick={onEditToggle}>
            ✏️ Edit Inventory
          </button>
        )}
      </div>
      <div className="inv-grid">
        {BLOOD_GROUPS.map((group) => {
          const units = getUnits(group);
          const stateClass = units === 0 ? 'inv-empty' : units <= 5 ? 'inv-critical' : units <= 15 ? 'inv-low' : 'inv-good';
          return (
            <div key={group} className={`inv-cell ${stateClass}`}>
              <div className="bg-label">{group}</div>
              {editing ? (
                <input
                  type="number"
                  min="0"
                  max="9999"
                  value={units}
                  onChange={(e) => setDraftStock((prev) => ({ ...prev, [group]: Number(e.target.value) }))}
                />
              ) : (
                <div className="units">{units}</div>
              )}
              <div className="unit-lbl">units</div>
            </div>
          );
        })}
      </div>
      {editing && <div className="alert alert-info">Edit the inventory counts and save when ready.</div>}
    </div>
  );
}

function RespondModal({ request, onClose, onDone }) {
  const [form, setForm] = useState({ status: 'approved', hospitalNote: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await hospitalAPI.updateRequest(request._id, form);
      onDone();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Respond to Request" onClose={onClose}>
      {error && <Alert type="error">{error}</Alert>}
      <div className="modal-info">
        <p><strong>Patient:</strong> {request.patient?.name || '—'}</p>
        <p><strong>Blood Group:</strong> <BloodTag group={request.bloodGroup} /></p>
        <p><strong>Units:</strong> {request.units}</p>
        <p><strong>Urgency:</strong> <UrgencyBadge urgency={request.urgency} /></p>
        {request.notes ? <p><strong>Patient Notes:</strong> {request.notes}</p> : null}
      </div>
      <form onSubmit={handleSubmit}>
        <FormGroup label="Action">
          <select className="form-select" value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}>
            <option value="approved">Approve</option>
            <option value="fulfilled">Mark as Fulfilled</option>
            <option value="rejected">Reject</option>
          </select>
        </FormGroup>
        <FormGroup label="Note to Patient">
          <textarea
            className="form-input"
            rows={4}
            value={form.hospitalNote}
            onChange={(e) => setForm((prev) => ({ ...prev, hospitalNote: e.target.value }))}
            placeholder="Optional message to the patient"
          />
        </FormGroup>
        <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
          {loading ? 'Submitting…' : 'Confirm'}
        </button>
      </form>
    </Modal>
  );
}

export default function HospitalDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState('requests');
  const [stats, setStats] = useState(null);
  const [requests, setRequests] = useState([]);
  const [inventory, setInventory] = useState({ stock: [] });
  const [statusFilter, setStatusFilter] = useState('');
  const [editingInventory, setEditingInventory] = useState(false);
  const [draftStock, setDraftStock] = useState({});
  const [respondTarget, setRespondTarget] = useState(null);
  const { toast, show, dismiss } = useToast();
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [loadingInventory, setLoadingInventory] = useState(false);

  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const { data } = await hospitalAPI.getStats();
      setStats(data.data);
    } catch (err) {
      show(err.response?.data?.message || 'Unable to load stats.', 'error');
    } finally {
      setLoadingStats(false);
    }
  }, [show]);

  const fetchRequests = useCallback(async () => {
    setLoadingRequests(true);
    try {
      const { data } = await hospitalAPI.getRequests(statusFilter || undefined);
      setRequests(data.data);
    } catch (err) {
      show(err.response?.data?.message || 'Unable to load requests.', 'error');
    } finally {
      setLoadingRequests(false);
    }
  }, [statusFilter, show]);

  const fetchInventory = useCallback(async () => {
    setLoadingInventory(true);
    try {
      const { data } = await hospitalAPI.getInventory();
      setInventory(data.data);
      setDraftStock(data.data.stock.reduce((acc, item) => ({ ...acc, [item.bloodGroup]: item.units }), {}));
    } catch (err) {
      show(err.response?.data?.message || 'Unable to load inventory.', 'error');
    } finally {
      setLoadingInventory(false);
    }
  }, [show]);

  useEffect(() => {
    // Load stats and inventory on mount only
    fetchStats();
    fetchInventory();
  }, []);  // Empty dependency - load once on mount

  useEffect(() => {
    // Re-fetch requests when statusFilter changes
    fetchRequests();
  }, [statusFilter]);  // Only depend on actual filter state, not callback

  const handleSaveInventory = async () => {
    const stock = BLOOD_GROUPS.map((bloodGroup) => ({ bloodGroup, units: Number(draftStock[bloodGroup] ?? 0) }));
    try {
      await hospitalAPI.updateInventory(stock);
      show('Inventory updated successfully.', 'success');
      setEditingInventory(false);
      fetchInventory();
      fetchStats();
    } catch (err) {
      show(err.response?.data?.message || 'Unable to update inventory.', 'error');
    }
  };

  const handleRespondDone = () => {
    show('Request updated ✅', 'success');
    setRespondTarget(null);
    fetchRequests();
    fetchInventory();
    fetchStats();
  };

  return (
    <div className="app">
      <Topbar toast={toast} onDismissToast={dismiss} />
      <main className="main-content">
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header" style={{ alignItems: 'center' }}>
            <div>
              <div className="page-title">Hospital Dashboard</div>
              <div className="page-sub">{user.hospitalName}</div>
            </div>
          </div>
        </div>

        <div className="stats-grid">
          {[
            { label: 'Total Stock', value: stats?.totalStock ?? 0, color: 'var(--red)' },
            { label: 'Pending', value: stats?.pendingRequests ?? 0, color: 'var(--amber)' },
            { label: 'Fulfilled', value: stats?.fulfilledRequests ?? 0, color: 'var(--green)' },
            { label: 'Rejected', value: stats?.rejectedRequests ?? 0, color: 'var(--gray-400)' }
          ].map((item) => (
            <div key={item.label} className="stat-card" style={{ '--stat-color': item.color }}>
              <div className="stat-value">{loadingStats ? '–' : item.value}</div>
              <div className="stat-label">{item.label}</div>
            </div>
          ))}
        </div>

        <div className="tabs">
          <button className={`tab-btn ${tab === 'requests' ? 'active' : ''}`} type="button" onClick={() => setTab('requests')}>
            📋 Blood Requests
          </button>
          <button className={`tab-btn ${tab === 'inventory' ? 'active' : ''}`} type="button" onClick={() => setTab('inventory')}>
            🗃️ Inventory
          </button>
        </div>

        {tab === 'requests' && (
          <RequestsTab
            requests={requests}
            loading={loadingRequests}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            onRespond={(request) => setRespondTarget(request)}
          />
        )}

        {tab === 'inventory' && (
          <InventoryTab
            inventory={inventory}
            editing={editingInventory}
            draftStock={draftStock}
            setDraftStock={setDraftStock}
            onEditToggle={() => setEditingInventory((value) => !value)}
            onSave={handleSaveInventory}
          />
        )}

        {respondTarget && (
          <RespondModal request={respondTarget} onClose={() => setRespondTarget(null)} onDone={handleRespondDone} />
        )}
      </main>
    </div>
  );
}
