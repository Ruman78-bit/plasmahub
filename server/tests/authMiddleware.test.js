process.env.JWT_SECRET = 'test-jwt-secret';

jest.mock('../models/User', () => ({ findById: jest.fn() }));

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/authMiddleware');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockUserLookup = (user) => {
  User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(user) });
};

describe('protect', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('rejects a request with no Authorization header', async () => {
    const req = { headers: {} };
    const res = mockRes();
    const next = jest.fn();

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('rejects a header that does not start with Bearer', async () => {
    const req = { headers: { authorization: 'Token abc' } };
    const res = mockRes();
    const next = jest.fn();

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('rejects an invalid token', async () => {
    const req = { headers: { authorization: 'Bearer not-a-real-token' } };
    const res = mockRes();
    const next = jest.fn();

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Token invalid or expired' });
    expect(next).not.toHaveBeenCalled();
  });

  test('rejects an expired token', async () => {
    const token = jwt.sign({ id: 'u1' }, process.env.JWT_SECRET, { expiresIn: -10 });
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    const next = jest.fn();

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('rejects a valid token when the user does not exist', async () => {
    mockUserLookup(null);
    const token = jwt.sign({ id: 'u1' }, process.env.JWT_SECRET);
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    const next = jest.fn();

    await protect(req, res, next);

    expect(User.findById).toHaveBeenCalledWith('u1');
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('rejects a valid token when the user is inactive', async () => {
    mockUserLookup({ _id: 'u1', role: 'patient', isActive: false });
    const token = jwt.sign({ id: 'u1' }, process.env.JWT_SECRET);
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    const next = jest.fn();

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('attaches the user and calls next for a valid token and active user', async () => {
    const user = { _id: 'u1', role: 'patient', isActive: true };
    mockUserLookup(user);
    const token = jwt.sign({ id: 'u1' }, process.env.JWT_SECRET);
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    const next = jest.fn();

    await protect(req, res, next);

    expect(req.user).toBe(user);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});

describe('authorize', () => {
  test('calls next when the user has an allowed role', () => {
    const req = { user: { role: 'hospital' } };
    const res = mockRes();
    const next = jest.fn();

    authorize('hospital')(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  test('accepts any of several allowed roles', () => {
    const req = { user: { role: 'admin' } };
    const res = mockRes();
    const next = jest.fn();

    authorize('hospital', 'admin')(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  test('returns 403 when the role is not allowed', () => {
    const req = { user: { role: 'patient' } };
    const res = mockRes();
    const next = jest.fn();

    authorize('admin')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Role 'patient' is not authorized for this resource"
    });
    expect(next).not.toHaveBeenCalled();
  });
});
