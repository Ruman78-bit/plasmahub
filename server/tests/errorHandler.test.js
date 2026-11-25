const errorHandler = require('../middleware/errorHandler');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('errorHandler', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  test('defaults to status 500 and the error message', () => {
    const res = mockRes();

    errorHandler(new Error('Something broke'), {}, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json.mock.calls[0][0]).toMatchObject({ success: false, message: 'Something broke' });
  });

  test('uses the status code set on the error', () => {
    const res = mockRes();
    const err = new Error('Not found');
    err.statusCode = 404;

    errorHandler(err, {}, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('maps a duplicate key error to 409 and names the field', () => {
    const res = mockRes();
    const err = new Error('E11000 duplicate key');
    err.code = 11000;
    err.keyValue = { email: 'a@b.com' };

    errorHandler(err, {}, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json.mock.calls[0][0].message).toBe('email already exists');
  });

  test('maps a validation error to 400 and joins the messages', () => {
    const res = mockRes();
    const err = new Error('Validation failed');
    err.name = 'ValidationError';
    err.errors = {
      name: { message: 'Name is required' },
      phone: { message: 'Phone is invalid' }
    };

    errorHandler(err, {}, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0].message).toBe('Name is required. Phone is invalid');
  });

  test('maps a cast error to 400 with an invalid ID message', () => {
    const res = mockRes();
    const err = new Error('Cast failed');
    err.name = 'CastError';

    errorHandler(err, {}, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0].message).toBe('Invalid ID format');
  });

  test('includes the stack outside production', () => {
    process.env.NODE_ENV = 'development';
    const res = mockRes();

    errorHandler(new Error('Oops'), {}, res, jest.fn());

    expect(res.json.mock.calls[0][0].stack).toBeDefined();
  });

  test('hides the stack in production', () => {
    process.env.NODE_ENV = 'production';
    const res = mockRes();

    errorHandler(new Error('Oops'), {}, res, jest.fn());

    expect(res.json.mock.calls[0][0].stack).toBeUndefined();
  });
});
