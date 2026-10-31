# HealthIQ — Role-Based Healthcare Intelligence Platform

A React interface for Patient, Doctor, and Administrator workspaces, including account registration and account-access flows.

## Run locally
1. Install Node.js 18 or later.
2. Extract this folder and open it in VS Code.
3. Run `npm install`.
4. Copy `.env.example` to `.env` and set `VITE_API_BASE_URL`.
5. Run `npm run dev`.

## Account access flows
- **Patient registration:** public registration form, email verification, and patient-role assignment by the backend.
- **Doctor onboarding:** an administrator invites a doctor from User Management. The doctor receives a one-time invitation link and sets a password.
- **Administrator onboarding:** no public admin registration. An authorized super-administrator provisions admin accounts.
- **Forgot password:** sends a reset code to the account's registered email, then accepts the code and a new password.
- **Login:** the backend verifies credentials and returns the user's role. The app redirects patients to their personal workspace and doctors/admins to the professional workspace.

There is no role selector on public registration. A patient cannot register as a doctor or administrator.

## Backend API contract
Set `VITE_API_BASE_URL` in `.env`. The default adapter in `src/services/api.js` expects these endpoints. Adjust endpoint names or payload mappings there if your backend uses a different contract.

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/auth/login` | Verify email/password; return `accessToken` and user object |
| GET | `/auth/me` | Return the authenticated user |
| POST | `/auth/logout` | Invalidate the authenticated session |
| POST | `/auth/register/patient` | Create patient registration and begin verification |
| POST | `/auth/verify-email` | Verify patient email using challenge ID and code |
| POST | `/auth/resend-verification` | Resend patient email verification code |
| POST | `/auth/forgot-password` | Start password reset; respond generically to avoid account enumeration |
| POST | `/auth/reset-password` | Validate reset code and change password |
| POST | `/admin/users/invite` | Admin-only doctor invitation |
| POST | `/auth/accept-invitation` | Accept one-time doctor invitation and set password |

### Example login response
```json
{
  "accessToken": "issued-session-token",
  "user": {
    "id": "account-id",
    "name": "Account holder",
    "role": "doctor"
  }
}
```

### Patient registration response
Return a `challengeId` to start the email verification screen:
```json
{
  "verificationRequired": true,
  "challengeId": "one-time-verification-challenge"
}
```
After successful email verification, activate the patient account according to your patient identity matching and hospital approval rules.

### Doctor invitation
`POST /admin/users/invite` must be available only to administrators. The backend must assign the `doctor` role and email a one-time invitation URL pointing to `/accept-invitation?token=...`. The invitation token should expire and be single-use.

## Required authorization rules
- Patient: only their own linked health record.
- Doctor: all patients within the authenticated hospital/tenant, as confirmed for this project.
- Administrator: hospital-wide access plus data management and user administration.
- Only authorized administrators can invite doctors or administer platform data.
- Never trust a role or patient ID supplied by the browser. Derive user identity and access scope from the authenticated server-side session on every protected API call.
- Route guards improve navigation but do not replace backend authorization.

## Security notes
- Use HTTPS in deployment.
- Store passwords only as strong salted password hashes on the server; never store plain-text passwords.
- Use short-lived, one-time verification and invitation codes/tokens with expiry and rate limits.
- Use secure, HttpOnly, SameSite cookies for production sessions where your backend architecture supports them. The included adapter currently demonstrates bearer-token integration for development; review token storage before production.
- Avoid account enumeration in password recovery responses.
- Never place private patient files or datasets in `public/`.

## Data and clinical functionality
No patient datasets, CSV files, fabricated patient records, or fabricated clinical risk values are included. Data and clinical model outputs appear only after your backend supplies authorized responses. This package does not include a database, authentication server, email/OTP delivery service, or clinical decision engine.
