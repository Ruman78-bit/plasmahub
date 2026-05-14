import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import Topbar from '../shared/Topbar';
import { StatusBadge, UrgencyBadge, BloodTag, EmptyState, Spinner, Alert, Modal, FormGroup, useToast } from '../shared/ui';
import { patientAPI } from '../../service/api';


const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

function RequestsTab({ requests, loading, onOpenModal, onCancel }) {
  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="card-title">My Blood Requests</div>
          <div className="card-sub">{requests.length} request{requests.length === 1 ? '' : 's'}</div>
        </div>
        <button className="btn btn-primary" type="button" onClick={() => onOpenModal('')}>
          + New Request
        </button>
      </div>

      {loading ? (
        <Spinner />
      ) : requests.length === 0 ? (
        <EmptyState icon="💉" message="No blood requests yet. Create one to get support." />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Blood Group</th>
                <th>Units</th>
                <th>Urgency</th>
                <th>Hospital</th>
                <th>Status</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request._id} className={request.urgency === 'critical' ? 'row-critical' : ''}>
                  <td><BloodTag group={request.bloodGroup} /></td>
              
                  <td>{request.units}</td>
                  <td><UrgencyBadge urgency={request.urgency} /></td>
                  <td>{request.hospital?.hospitalName || 'Any hospital'}</td>
                  <td><StatusBadge status={request.status} /></td>
                  <td>{new Date(request.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                  <td>
                    {['pending', 'approved'].includes(request.status) ? (
                      <button className="btn btn-danger btn-sm" type="button" onClick={() => onCancel(request._id)}>
                        Cancel
                      </button>
                    ) : null}
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

function HospitalsTab({ hospitals, loading, filterBG, setFilterBG, onRequest }) {
  return (
    <div>
      <div className="form-row cols-2" style={{ marginBottom: 18 }}>
        <FormGroup label="Filter by blood group">
          <select className="form-select" value={filterBG} onChange={(e) => setFilterBG(e.target.value)}>
            <option value="">All Blood Groups</option>
            {BLOOD_GROUPS.map((bg) => (
              <option key={bg} value={bg}>{bg}</option>
            ))}
          </select>
        </FormGroup>
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button className="btn btn-outline" type="button" onClick={() => onRequest('')}>
            Request Blood
          </button>
        </div>
      </div>

      {loading ? (
        <Spinner />
      ) : hospitals.length === 0 ? (
        <EmptyState icon="🏥" message="No hospitals currently match this blood group." />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {hospitals.map((hospital) => (
            <div key={hospital._id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{hospital.hospitalName}</div>
                  <div className="text-sm text-muted">{hospital.city}, {hospital.state}</div>
                </div>
                <button className="btn btn-primary btn-sm" type="button" onClick={() => onRequest(hospital._id)}>
                  Request Blood Here
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
                {hospital.stock?.filter((unit) => unit.units > 0).map((unit) => (
                  <div key={unit.bloodGroup} style={{ borderRadius: 10, padding: '10px 12px', background: 'var(--red-l)' }}>
                    <div style={{ fontWeight: 700, color: 'var(--red-d)', marginBottom: 4 }}>{unit.bloodGroup}</div>
                    <div style={{ fontSize: 12, color: 'var(--gray-600)' }}>{unit.units} units available</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RequestModal({ hospitals, prefHospital, onClose, onSubmitted }) {
  const [form, setForm] = useState({ bloodGroup: 'O+', units: 1, urgency: 'routine', hospitalId: prefHospital || '', notes: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setForm((current) => ({ ...current, hospitalId: prefHospital || '' }));
  }, [prefHospital]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await patientAPI.createRequest(form);
      onSubmitted();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to submit request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="New Blood Request" onClose={onClose}>
      {error && <Alert type="error">{error}</Alert>}
      <form onSubmit={handleSubmit}>
        <FormGroup label="Blood Group Required">
          <select className="form-select" value={form.bloodGroup} onChange={(e) => setForm((prev) => ({ ...prev, bloodGroup: e.target.value }))}>
            {BLOOD_GROUPS.map((bg) => <option key={bg} value={bg}>{bg}</option>)}
          </select>
        </FormGroup>
        <div className="form-row cols-2">
          <FormGroup label="Units (1–10)">
            <input
              className="form-input"
              type="number"
              min="1"
              max="10"
              value={form.units}
              onChange={(e) => setForm((prev) => ({ ...prev, units: Number(e.target.value) }))}
              required
            />
          </FormGroup>
          <FormGroup label="Urgency">
            <select className="form-select" value={form.urgency} onChange={(e) => setForm((prev) => ({ ...prev, urgency: e.target.value }))}>
              <option value="routine">Routine</option>
              <option value="urgent">Urgent</option>
              <option value="critical">Critical</option>
            </select>
          </FormGroup>
        </div>
        <FormGroup label="Preferred Hospital (optional)">
          <select className="form-select" value={form.hospitalId} onChange={(e) => setForm((prev) => ({ ...prev, hospitalId: e.target.value }))}>
            <option value="">Any hospital</option>
            {hospitals.map((hospital) => (
              <option key={hospital._id} value={hospital._id}>{hospital.hospitalName}</option>
            ))}
          </select>
        </FormGroup>
        <FormGroup label="Medical Notes (optional)">
          <textarea
            className="form-input"
            rows={4}
            value={form.notes}
            onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
            placeholder="Any details for the hospital"
          />
        </FormGroup>
        <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
          {loading ? 'Submitting…' : 'Submit Request'}
        </button>
      </form>
    </Modal>
  );
}

export default function PatientDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState('requests');
  const [requests, setRequests] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [loadingHospitals, setLoadingHospitals] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [prefHospital, setPrefHospital] = useState('');
  const [filterBG, setFilterBG] = useState('');
  const { toast, show, dismiss } = useToast();

  const fetchRequests = useCallback(async () => {
    setLoadingRequests(true);
    try {
      const { data } = await patientAPI.getRequests();
      setRequests(data.data);
    } catch (err) {
      show(err.response?.data?.message || 'Unable to load requests.', 'error');
    } finally {
      setLoadingRequests(false);
    }
  }, [show]);

  const fetchHospitals = useCallback(async () => {
    setLoadingHospitals(true);
    try {
      const { data } = await patientAPI.getHospitals(filterBG || undefined);
      setHospitals(data.data);
    } catch (err) {
      show(err.response?.data?.message || 'Unable to load hospitals.', 'error');
    } finally {
      setLoadingHospitals(false);
    }
  }, [filterBG, show]);

  useEffect(() => {
    fetchRequests();
    fetchHospitals();
  }, [filterBG, show]);  // Re-fetch only when filter or show changes, NOT on callback identity

  const handleOpenModal = (hospitalId) => {
    setPrefHospital(hospitalId || '');
    setTab('requests');
    setShowModal(true);
  };

  const handleCancelRequest = async (id) => {
    if (!window.confirm('Cancel this request?')) return;
    try {
      await patientAPI.cancelRequest(id);
      show('Request cancelled successfully.', 'success');
      fetchRequests();
    } catch (err) {
      show(err.response?.data?.message || 'Unable to cancel request.', 'error');
    }
  };

  const handleSubmitSuccess = () => {
    show('Blood request submitted! ✅', 'success');
    fetchRequests();
  };

  return (
    <div className="app">
      <Topbar toast={toast} onDismissToast={dismiss} />
      <main className="main-content">
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header" style={{ alignItems: 'center' }}>
            <div>
              <div className="page-title">Patient Dashboard</div>
              <div className="page-sub">Welcome back, {user.name}</div>
            </div>
            <button className="btn btn-primary" type="button" onClick={() => handleOpenModal('')}>
              + New Request
            </button>
          </div>
        </div>

        <div className="tabs">
          <button className={`tab-btn ${tab === 'requests' ? 'active' : ''}`} type="button" onClick={() => setTab('requests')}>
            📋 My Requests
          </button>
          <button className={`tab-btn ${tab === 'hospitals' ? 'active' : ''}`} type="button" onClick={() => setTab('hospitals')}>
            🏥 Find Hospitals
          </button>
        </div>

        {tab === 'requests' && (
          <RequestsTab
            requests={requests}
            loading={loadingRequests}
            onOpenModal={handleOpenModal}
            onCancel={handleCancelRequest}
          />
        )}

        {tab === 'hospitals' && (
          <HospitalsTab
            hospitals={hospitals}
            loading={loadingHospitals}
            filterBG={filterBG}
            setFilterBG={setFilterBG}
            onRequest={handleOpenModal}
          />
        )}

        {showModal && (
          <RequestModal
            hospitals={hospitals}
            prefHospital={prefHospital}
            onClose={() => setShowModal(false)}
            onSubmitted={handleSubmitSuccess}
          />
        )}
      </main>
    </div>
  );
}
