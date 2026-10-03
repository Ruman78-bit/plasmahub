# Plasma Hub — Troubleshooting Guide

A first-line support guide for common problems in Plasma Hub, a blood bank management platform built with React (Vite), Axios, Node.js, Express and MongoDB, using JWT authentication and role-based access (patient, hospital, admin).

Each entry follows the same pattern: **Symptom → Likely cause → How to diagnose → Fix**.

---

## 1. Quick health check

Work through these in order before digging into a specific issue.

1. **Backend running?** The terminal running the Express server should show it listening, with no crash or stack trace.
2. **Database connected?** The server startup logs should confirm the MongoDB connection. If not, see [Issue 8](#8-backend-will-not-start-or-cannot-connect-to-mongodb).
3. **API reachable?** In Postman, send a request to a simple `GET` endpoint. A response of any kind means the server is up.
4. **Browser view.** Open DevTools. The **Network** tab shows the failing request, its status code and response body. The **Console** tab shows JavaScript errors.

## 2. Status code cheat sheet

| Status | Usual meaning in Plasma Hub | Go to |
|--------|-----------------------------|-------|
| 400 | Invalid or missing input in the request | Check the request body in Network or Postman |
| 401 | Missing, expired or invalid JWT (the app signs the user out) | [Issue 2](#2-user-is-signed-out-unexpectedly-or-requests-return-401) |
| 403 | Logged in, but the role is not allowed to do this | [Issue 3](#3-403-forbidden-or-redirected-away-from-a-page) |
| 413 | Request body larger than the allowed size limit | [Issue 6](#6-413-payload-too-large) |
| 429 | Too many login attempts (rate limit) | [Issue 5](#5-429-too-many-requests-on-login) |
| 500 | Unexpected server error | Read the backend logs around that time |

---

## Issues

### 1. Infinite request and re-render loop

**Symptom:** The page becomes slow or freezes. The Network tab fills with the same API request repeating over and over. A component keeps re-rendering.

**Likely cause:** A combination of:
- Unstable hook references: functions or objects recreated on every render and used as hook dependencies.
- Effect dependency chains: one effect updates state, which triggers another effect, which updates state again.
- An unmemoized auth context: the context value is a new object on every render, so every component using it re-renders.

**How to diagnose:**
1. Watch the Network tab for repeated identical requests.
2. Add a temporary `console.log` inside the suspect `useEffect` to see how often it runs.
3. Check each dependency array and ask which value changes on every render.
4. Use the React DevTools Profiler to see which component re-renders and why.

**Fix:**
- Wrap functions used as dependencies in `useCallback`.
- Wrap the auth context value in `useMemo` so it only changes when its data changes.
- Make effects depend on stable, primitive values where possible.
- Break effect chains so one effect does not trigger another in a cycle.

**Prevention:** Enable the `react-hooks/exhaustive-deps` lint rule and review dependency arrays during code review.

---

### 2. User is signed out unexpectedly, or requests return 401

**Symptom:** The user logs in but is immediately signed out, or API calls fail with 401.

**Likely cause:**
- The JWT has expired.
- The `Authorization` header is missing from the request.
- The secret used to sign the token differs from the one used to verify it (for example, after changing environment settings).

**How to diagnose:**
1. In the Network tab, open the failing request and check that the `Authorization` header is present.
2. Check the token's expiry time by decoding its payload locally. Do not paste real tokens into third-party websites.
3. Confirm the same JWT secret is used for signing and verification.

**Fix:** Log in again to get a fresh token. Correct the secret or environment setting if they do not match, then restart the backend.

**Note:** The Axios client attaches the JWT to each request and signs the user out on a 401 response, so this behaviour is expected when a token is no longer valid.

---

### 3. 403 Forbidden, or redirected away from a page

**Symptom:** A logged-in user cannot open a page or call an endpoint.

**Likely cause:** The account's role (patient, hospital or admin) does not have access. Route guards on the frontend and role-based access control on the backend both enforce this.

**How to diagnose:** Confirm which role the account has and which role the page or endpoint requires.

**Fix:** Use an account with the correct role. This is expected behaviour, not a bug, unless the correct role is being blocked.

---

### 4. Browser shows a CORS error

**Symptom:** The Console shows an error that the request was blocked by the CORS policy.

**Likely cause:** CORS is restricted to specific allowed origins. The frontend is running from an origin (scheme, host and port) that is not on the list, for example a different port or a deployed URL.

**How to diagnose:** The error message names the blocked origin. Compare it with the allowed origins in the backend CORS configuration.

**Fix:** Add the exact frontend origin to the allowed list and restart the backend.

---

### 5. 429 Too Many Requests on login

**Symptom:** Login fails with 429 after several attempts.

**Likely cause:** Rate limiting on the login routes was triggered by repeated attempts.

**Fix:** Wait for the rate-limit window to reset, then try again. Avoid repeatedly retrying login in tests or scripts.

---

### 6. 413 Payload Too Large

**Symptom:** A request fails with 413.

**Likely cause:** The request body is larger than the size limit configured on the server.

**Fix:** Reduce the size of the data being sent. Increase the limit only if the larger payload is genuinely needed.

---

### 7. Registration is rejected

**Symptom:** A new account cannot be registered with certain roles.

**Likely cause:** Self-registration is limited to the patient and hospital roles by design, so admin accounts cannot be created through the registration form.

**Fix:** Register as a patient or hospital. This is expected behaviour.

---

### 8. Backend will not start, or cannot connect to MongoDB

**Symptom:** The server crashes on startup, or logs a MongoDB connection error.

**Likely cause:**
- MongoDB is not running (for a local database).
- The connection string is wrong or missing from the environment settings.
- The database host is blocking the connection (for a hosted database, the machine's IP may not be allowed).
- Another required environment setting, such as the JWT secret, is missing.

**How to diagnose:** Read the error in the terminal. It usually names the connection or the missing value.

**Fix:** Start MongoDB, correct the connection string or environment settings, allow the connection if the host blocks it, then restart the backend.

---

### 9. Request cannot be fulfilled

**Symptom:** A hospital tries to fulfil a blood request and it fails.

**Likely cause:** Fulfilment checks available stock and deducts units, so it fails when the hospital does not have enough units of that blood group.

**How to diagnose:** Check the hospital's stock for that blood group and the request's current status.

**Fix:** Update the stock if the figures are wrong, or reject the request if the hospital cannot supply it.

---

## Before escalating an issue

If the steps above do not resolve it, collect this information first so the next person can start straight away:

- What you expected to happen and what actually happened
- Steps to reproduce the problem
- The role of the account used (patient, hospital or admin)
- The failing request's URL, method, status code and response body (from the Network tab or Postman)
- Console errors and the backend log lines from around the time of the failure
- What you have already tried

Then raise it with the maintainer or team lead, including the details above.
