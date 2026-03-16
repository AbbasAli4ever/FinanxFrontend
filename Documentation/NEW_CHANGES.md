# Frontend Integration Guide — Multi-Company + Invitation Flow

## Base URLs
```
Auth:  /api/v1/auth
Users: /api/v1/users
```

---

## TypeScript Interfaces

```typescript
// Standard auth response
interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    isPrimaryAdmin: boolean;
    role: { code: string; name: string } | null;
  };
  company: { id: string; name: string };
  permissions: string[];
}

// Returned when user has multiple companies
interface CompanySelectionResponse {
  requiresCompanySelection: true;
  companies: CompanySelectionItem[];
  tempToken: string; // Valid for 5 minutes
}

interface CompanySelectionItem {
  companyId: string;
  companyName: string;
  userId: string;
  role: { code: string; name: string } | null;
  isPrimaryAdmin: boolean;
  lastLoginAt: string | null;
}

// For my-companies endpoint
interface MyCompanyItem extends CompanySelectionItem {
  isCurrentCompany: boolean;
}

// Login can return either shape
type LoginResponse = AuthResponse | CompanySelectionResponse;

// Validate invitation response
interface ValidateInvitationResponse {
  valid: boolean;
  message?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  company?: { id: string; name: string };
  role?: { id: string; code: string; name: string };
  existingUser?: boolean; // KEY: determines if password field is needed
  expiresAt?: string;
}
```

---

## 1. Login Flow

### `POST /api/v1/auth/login`

```json
{ "email": "user@example.com", "password": "password123" }
```

**Single company** → returns `AuthResponse` directly, proceed to dashboard.

**Multiple companies** → returns `CompanySelectionResponse`, navigate to company picker.

```typescript
const res = await api.post('/auth/login', { email, password });
const data = res.data.data;

if ('requiresCompanySelection' in data && data.requiresCompanySelection) {
  // Store tempToken, navigate to company selection screen
  navigateTo('/select-company', {
    companies: data.companies,
    tempToken: data.tempToken,
  });
} else {
  storeTokens(data.accessToken, data.refreshToken);
  navigateTo('/dashboard');
}
```

---

## 2. Select Company (from company picker)

### `POST /api/v1/auth/select-company`

**No auth header** — uses tempToken in body.

```json
{ "tempToken": "eyJ...", "companyId": "uuid-of-selected-company" }
```

**Response:** `AuthResponse`

**Errors:** `401` if tempToken expired (5 min) → redirect to login.

```typescript
const result = await api.post('/auth/select-company', {
  tempToken: storedTempToken,
  companyId: selectedCompanyId,
});
storeTokens(result.data.data.accessToken, result.data.data.refreshToken);
navigateTo('/dashboard');
```

---

## 3. Create Company With TempToken (from company picker)

### `POST /api/v1/auth/create-company-with-temp`

**No auth header** — uses tempToken in body. Use this when the user wants to create a new company from the company selection screen (before fully logged in).

```json
{
  "tempToken": "eyJ...",
  "companyName": "New Company",
  "companyEmail": "optional@company.com"
}
```

**Response:** `AuthResponse` — auto-logs into the new company.

```typescript
const result = await api.post('/auth/create-company-with-temp', {
  tempToken: storedTempToken,
  companyName: 'My New Company',
  companyEmail: 'info@newcompany.com', // optional
});
storeTokens(result.data.data.accessToken, result.data.data.refreshToken);
navigateTo('/dashboard');
```

---

## 4. My Companies (for company switcher)

### `GET /api/v1/auth/my-companies`

**Headers:** `Authorization: Bearer <accessToken>`

**Response:**
```json
{
  "success": true,
  "message": "Companies retrieved successfully",
  "data": [
    {
      "companyId": "uuid-1",
      "companyName": "FinanX Technologies",
      "userId": "user-uuid-1",
      "role": { "code": "company_admin", "name": "Company Administrator" },
      "isPrimaryAdmin": true,
      "lastLoginAt": "2026-03-14T18:05:07.114Z",
      "isCurrentCompany": true
    },
    {
      "companyId": "uuid-2",
      "companyName": "FinanX US",
      "userId": "user-uuid-2",
      "role": { "code": "standard", "name": "Standard User" },
      "isPrimaryAdmin": false,
      "lastLoginAt": null,
      "isCurrentCompany": false
    }
  ]
}
```

Use this for the company switcher dropdown in sidebar/header.

---

## 5. Switch Company

### `POST /api/v1/auth/switch-company`

**Headers:** `Authorization: Bearer <accessToken>`

```json
{ "companyId": "uuid-of-target-company" }
```

**Response:** `AuthResponse` with new tokens.

**Error Cases:**
- `404` — "You do not have access to this company"
- `400` — "Target company is deactivated"

**After switching:**
1. Replace stored tokens
2. Clear all cached data (invoices, customers, etc.)
3. Reload app or re-fetch everything

```typescript
const result = await api.post('/auth/switch-company', { companyId: targetId });
storeTokens(result.data.data.accessToken, result.data.data.refreshToken);
window.location.reload(); // or reset store and re-fetch
```

---

## 6. Create Company (when already logged in)

### `POST /api/v1/auth/create-company`

**Headers:** `Authorization: Bearer <accessToken>`

```json
{ "companyName": "New Company", "companyEmail": "optional@company.com" }
```

**Response:** `AuthResponse` — auto-switches to the new company.

The new company is created with:
- Default Chart of Accounts seeded
- Current user becomes `isPrimaryAdmin` with `company_admin` role
- Same password as existing account (synced)

```typescript
const result = await api.post('/auth/create-company', {
  companyName: 'My New Company',
  companyEmail: 'info@newcompany.com', // optional
});
storeTokens(result.data.data.accessToken, result.data.data.refreshToken);
window.location.reload();
```

---

## 7. Invitation Flow (UPDATED)

Two steps — validate first, then accept.

### Step 1: Validate the invitation token

### `GET /api/v1/users/validate-invitation?token=xxx`

**No auth header** — public endpoint.

**Response (valid invitation, existing user):**
```json
{
  "success": true,
  "message": "Invitation is valid",
  "data": {
    "valid": true,
    "email": "invited@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "company": { "id": "uuid", "name": "FinanX Technologies" },
    "role": { "id": "uuid", "code": "standard", "name": "Standard User" },
    "existingUser": true,
    "expiresAt": "2026-03-20T00:00:00.000Z"
  }
}
```

**Response (valid invitation, new user):**
```json
{
  "success": true,
  "message": "Invitation is valid",
  "data": {
    "valid": true,
    "email": "newuser@example.com",
    "firstName": "Jane",
    "lastName": "Smith",
    "company": { "id": "uuid", "name": "FinanX Technologies" },
    "role": { "id": "uuid", "code": "standard", "name": "Standard User" },
    "existingUser": false,
    "expiresAt": "2026-03-20T00:00:00.000Z"
  }
}
```

**Response (invalid invitation):**
```json
{
  "success": true,
  "message": "This invitation has expired",
  "data": {
    "valid": false,
    "message": "This invitation has expired"
  }
}
```

**Frontend logic based on `existingUser`:**

```typescript
const res = await api.get(`/users/validate-invitation?token=${token}`);
const invitation = res.data.data;

if (!invitation.valid) {
  // Show error: invitation.message
  // Possible messages:
  //   "Invalid invitation token"
  //   "This invitation has already been used or cancelled"
  //   "This invitation has expired"
  return;
}

if (invitation.existingUser) {
  // This user already has a FinanX account in another company
  // DO NOT show password field
  // Show: "Welcome back! You already have a FinanX account.
  //        Click Join to join {company.name} as {role.name}"
} else {
  // New user — SHOW password field (min 8 chars)
  // Show: "Set your password to join {company.name} as {role.name}"
}
```

### Step 2: Accept the invitation

### `POST /api/v1/users/accept-invitation`

**No auth header** — public endpoint.

**For existing users (no password needed):**
```json
{
  "invitationToken": "abc123..."
}
```

**For new users (password required, min 8 chars):**
```json
{
  "invitationToken": "abc123...",
  "password": "newpassword123"
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Invitation accepted successfully. You can now login.",
  "data": {
    "id": "user-uuid",
    "email": "invited@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": { "id": "...", "code": "standard", "name": "Standard User" },
    "company": { "id": "...", "name": "FinanX Technologies" }
  }
}
```

**Error Cases:**
- `400 "Password is required for new users"` — existingUser was false and no password sent
- `404 "Invalid invitation token"` — bad token
- `400 "This invitation has already been used or cancelled"`
- `400 "This invitation has expired"`
- `409 "User with this email already exists"` — user already exists in this company

**After success** → redirect to login page.

```typescript
const handleAcceptInvitation = async () => {
  const body: any = { invitationToken: token };

  // Only include password for new users
  if (!invitation.existingUser) {
    body.password = passwordInput;
  }

  await api.post('/users/accept-invitation', body);
  toast.success('Invitation accepted! Please login.');
  navigateTo('/login');
};
```

---

## 8. Registration — DISABLED

`POST /api/v1/auth/register` is **not available**. No signup page needed.

Remove or hide the signup/register route in the frontend.

New companies are created by:
- Logged-in users via `POST /auth/create-company` or `POST /auth/create-company-with-temp`
- Admin directly in the database for brand new users

---

## 9. Other Auth Endpoints (unchanged)

### Get Current User
`GET /api/v1/auth/me` — Bearer token required
```json
{
  "success": true,
  "data": {
    "id": "...",
    "email": "...",
    "firstName": "...",
    "lastName": "...",
    "isPrimaryAdmin": true,
    "company": { "id": "...", "name": "..." },
    "role": { "id": "...", "code": "...", "name": "..." }
  }
}
```

### Get Permissions
`GET /api/v1/auth/my-permissions` — Bearer token required
```json
{
  "success": true,
  "data": {
    "permissions": ["invoice:view", "invoice:create", "..."],
    "isPrimaryAdmin": true,
    "role": null
  }
}
```

### Logout
`POST /api/v1/auth/logout` — No auth header
```json
{ "refreshToken": "uuid..." }
```

### Refresh Tokens
`POST /api/v1/auth/refresh` — No auth header
```json
{ "refreshToken": "uuid..." }
```
Response: `{ "data": { "accessToken": "eyJ...", "refreshToken": "new-uuid..." } }`

### Forgot Password
`POST /api/v1/auth/forgot-password` — No auth header
```json
{ "email": "user@example.com" }
```

### Reset Password
`POST /api/v1/auth/reset-password` — No auth header
```json
{ "token": "reset-token-from-email", "password": "newpassword123" }
```

### Validate Reset Token
`GET /api/v1/auth/validate-reset-token?token=xxx` — No auth header
```json
{ "data": { "valid": true } }
```

---

## Summary of All Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `POST` | `/auth/login` | None | Login |
| `POST` | `/auth/select-company` | tempToken in body | Pick company after login |
| `POST` | `/auth/create-company-with-temp` | tempToken in body | Create company from picker |
| `GET` | `/auth/my-companies` | Bearer | List user's companies |
| `POST` | `/auth/switch-company` | Bearer | Switch company |
| `POST` | `/auth/create-company` | Bearer | Create company (logged in) |
| `GET` | `/auth/me` | Bearer | Get current user |
| `GET` | `/auth/my-permissions` | Bearer | Get permissions |
| `POST` | `/auth/logout` | None | Logout (send refreshToken in body) |
| `POST` | `/auth/refresh` | None | Refresh tokens (send refreshToken in body) |
| `POST` | `/auth/forgot-password` | None | Request password reset |
| `POST` | `/auth/reset-password` | None | Reset password with token |
| `GET` | `/auth/validate-reset-token` | None | Check if reset token is valid |
| `GET` | `/users/validate-invitation` | None | Check invitation + existingUser flag |
| `POST` | `/users/accept-invitation` | None | Accept invitation |
| ~~`POST`~~ | ~~`/auth/register`~~ | ~~None~~ | **Disabled** |

---

## Suggested UI Components

### 1. Company Picker (Login Flow)
Show after login when `requiresCompanySelection === true`:
```
+----------------------------------+
|   Select a Company               |
|                                  |
|   +---------------------------+  |
|   | FinanX Technologies       |  |
|   | Admin - Last: 2 hrs ago   |  |
|   +---------------------------+  |
|                                  |
|   +---------------------------+  |
|   | FinanX US Operations      |  |
|   | Admin - Never             |  |
|   +---------------------------+  |
|                                  |
|   [+ Create New Company]         |
+----------------------------------+
```

### 2. Company Switcher (Sidebar/Header)
Dropdown using `GET /auth/my-companies`:
```
+----------------------------+
| FinanX Technologies  v     |  <- Current company
+----------------------------+
| FinanX US Operations       |  <- Click to switch
| FinanX Europe GmbH         |
+----------------------------+
| + Create New Company       |  <- Opens create form
+----------------------------+
```

### 3. Invitation Accept Page
Two states based on `existingUser`:

**Existing user (`existingUser: true`):**
```
+----------------------------------+
|   Join FinanX Technologies       |
|                                  |
|   Welcome back, John!            |
|   You already have a FinanX      |
|   account. Click below to join   |
|   as Standard User.              |
|                                  |
|   [Join Company]                 |
+----------------------------------+
```

**New user (`existingUser: false`):**
```
+----------------------------------+
|   Join FinanX Technologies       |
|                                  |
|   Hi John! Set your password     |
|   to join as Standard User.      |
|                                  |
|   Password *                     |
|   +---------------------------+  |
|   |                           |  |
|   +---------------------------+  |
|                                  |
|   Confirm Password *             |
|   +---------------------------+  |
|   |                           |  |
|   +---------------------------+  |
|                                  |
|   [Join Company]                 |
+----------------------------------+
```

---

## Key Notes

1. **tempToken expires in 5 minutes** — if expired on select-company or create-company-with-temp, redirect user back to login
2. **Password is shared across companies** — changing password in one company updates it everywhere. Users only remember one password
3. **Roles are per-company** — same person can be admin in Company A and standard user in Company B. Permissions are company-specific
4. **After switch/create company** — replace stored tokens and clear all cached data (invoices, customers, accounts, etc.). Simplest approach: `window.location.reload()`
5. **Invitation for existing users** — no password needed, just click Join. Their existing password works across all companies
6. **Invitation for new users** — password field required (min 8 chars). After accepting, they login with that password
7. **All API responses** follow the shape: `{ success: boolean, message: string, data: T }`
