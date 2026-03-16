# Multi-Company Per User — Frontend Integration Guide

## Base URL
```
/api/v1/auth
```

---

## TypeScript Interfaces

```typescript
// Standard auth response (unchanged from before)
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
  company: {
    id: string;
    name: string;
  };
  permissions: string[];
}

// NEW: Returned when user has multiple companies
interface CompanySelectionResponse {
  requiresCompanySelection: true;
  companies: CompanySelectionItem[];
  tempToken: string;  // Valid for 5 minutes
}

interface CompanySelectionItem {
  companyId: string;
  companyName: string;
  userId: string;
  role: { code: string; name: string } | null;
  isPrimaryAdmin: boolean;
  lastLoginAt: string | null;  // ISO date
}

// NEW: For my-companies endpoint
interface MyCompanyItem extends CompanySelectionItem {
  isCurrentCompany: boolean;
}

// Login can return either shape
type LoginResponse = AuthResponse | CompanySelectionResponse;
```

---

## Login Flow

### POST `/auth/login`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response A — Single Company (auto-login):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "uuid...",
    "user": { "id": "...", "email": "...", ... },
    "company": { "id": "...", "name": "My Company" },
    "permissions": ["invoice:view", ...]
  }
}
```

**Response B — Multiple Companies:**
```json
{
  "success": true,
  "message": "Please select a company to continue",
  "data": {
    "requiresCompanySelection": true,
    "companies": [
      {
        "companyId": "uuid-1",
        "companyName": "Company A",
        "userId": "user-uuid-1",
        "role": { "code": "company_admin", "name": "Company Administrator" },
        "isPrimaryAdmin": true,
        "lastLoginAt": "2026-03-14T18:05:07.114Z"
      },
      {
        "companyId": "uuid-2",
        "companyName": "Company B",
        "userId": "user-uuid-2",
        "role": { "code": "standard", "name": "Standard User" },
        "isPrimaryAdmin": false,
        "lastLoginAt": null
      }
    ],
    "tempToken": "eyJ..."
  }
}
```

### Frontend Logic
```typescript
const response = await api.post('/auth/login', { email, password });
const data = response.data.data;

if ('requiresCompanySelection' in data && data.requiresCompanySelection) {
  // Show company picker UI
  // Store data.tempToken temporarily
  // Display data.companies as a list
  navigateTo('/select-company', { companies: data.companies, tempToken: data.tempToken });
} else {
  // Single company — proceed as before
  storeTokens(data.accessToken, data.refreshToken);
  navigateTo('/dashboard');
}
```

---

## Select Company

### POST `/auth/select-company`

**No auth header needed** — uses the `tempToken` from the login response.

**Request:**
```json
{
  "tempToken": "eyJ...",
  "companyId": "uuid-of-selected-company"
}
```

**Response:** Standard `AuthResponse` (same as single-company login).

**Error Cases:**
- `401` — Token expired (5-minute window) or invalid → redirect to login
- `401` — Invalid company selection

```typescript
const result = await api.post('/auth/select-company', {
  tempToken: storedTempToken,
  companyId: selectedCompanyId,
});
storeTokens(result.data.data.accessToken, result.data.data.refreshToken);
navigateTo('/dashboard');
```

---

## My Companies

### GET `/auth/my-companies`

**Headers:** `Authorization: Bearer <accessToken>`

**Response:**
```json
{
  "success": true,
  "message": "Companies retrieved successfully",
  "data": [
    {
      "companyId": "uuid-1",
      "companyName": "FinanX Technologies Pvt Ltd",
      "userId": "user-uuid-1",
      "role": { "code": "company_admin", "name": "Company Administrator" },
      "isPrimaryAdmin": true,
      "lastLoginAt": "2026-03-14T18:05:07.114Z",
      "isCurrentCompany": true
    },
    {
      "companyId": "uuid-2",
      "companyName": "FinanX US Operations",
      "userId": "user-uuid-2",
      "role": { "code": "company_admin", "name": "Company Administrator" },
      "isPrimaryAdmin": true,
      "lastLoginAt": null,
      "isCurrentCompany": false
    }
  ]
}
```

**Use for:** Company switcher dropdown in the sidebar/header.

---

## Switch Company

### POST `/auth/switch-company`

**Headers:** `Authorization: Bearer <accessToken>`

**Request:**
```json
{
  "companyId": "uuid-of-target-company"
}
```

**Response:** Standard `AuthResponse` with new tokens for the target company.

**Error Cases:**
- `404` — "You do not have access to this company"
- `400` — "Target company is deactivated"

```typescript
const result = await api.post('/auth/switch-company', { companyId: targetId });
// Replace stored tokens
storeTokens(result.data.data.accessToken, result.data.data.refreshToken);
// Reload app state — company context has changed
window.location.reload(); // or reset store and re-fetch
```

**Important:** After switching, ALL API calls will operate in the new company context. The frontend should:
1. Replace stored tokens
2. Clear any cached data (invoices, customers, etc.)
3. Re-fetch dashboard/initial data

---

## Create Company

### POST `/auth/create-company`

**Headers:** `Authorization: Bearer <accessToken>`

**Request:**
```json
{
  "companyName": "New Company Name",
  "companyEmail": "optional@company.com"
}
```

**Response:** Standard `AuthResponse` — auto-switches to the new company.

The new company is created with:
- Default Chart of Accounts seeded
- Current user becomes `isPrimaryAdmin` with `company_admin` role
- Same password as existing account (synced)

```typescript
const result = await api.post('/auth/create-company', {
  companyName: 'My New Company',
  companyEmail: 'info@newcompany.com',  // optional
});
storeTokens(result.data.data.accessToken, result.data.data.refreshToken);
// App is now in the new company context
window.location.reload();
```

---

## Register (Updated Behavior)

### POST `/auth/register`

**Request (unchanged):**
```json
{
  "company": { "name": "Company Name", "email": "optional@company.com" },
  "user": { "firstName": "John", "lastName": "Doe", "email": "john@example.com", "password": "password123" }
}
```

**New Behavior:**
- If the email has NO existing accounts → creates company + user (same as before)
- If the email HAS existing accounts → creates new company + user, but **password must match** the existing account's password
  - If password doesn't match: `401 "You already have an account. Please use your existing password."`

---

## Suggested UI Components

### 1. Company Picker (Login Flow)
Show after login when `requiresCompanySelection === true`:
```
┌─────────────────────────────────┐
│   Select a Company              │
│                                 │
│   ┌─────────────────────────┐   │
│   │ 🏢 FinanX Technologies  │   │
│   │   Admin · Last: 2 hrs   │   │
│   └─────────────────────────┘   │
│                                 │
│   ┌─────────────────────────┐   │
│   │ 🏢 FinanX US Operations │   │
│   │   Admin · Never          │   │
│   └─────────────────────────┘   │
│                                 │
└─────────────────────────────────┘
```

### 2. Company Switcher (Sidebar/Header)
Dropdown using `GET /auth/my-companies`:
```
┌──────────────────────────┐
│ FinanX Technologies ▼    │  ← Current company
├──────────────────────────┤
│ FinanX US Operations     │  ← Click to switch
│ FinanX Europe GmbH       │
├──────────────────────────┤
│ + Create New Company     │  ← Opens create form
└──────────────────────────┘
```

### 3. Create Company Modal
Simple form triggered from the company switcher:
```
┌─────────────────────────────────┐
│   Create New Company            │
│                                 │
│   Company Name *                │
│   ┌─────────────────────────┐   │
│   │                         │   │
│   └─────────────────────────┘   │
│                                 │
│   Company Email (optional)      │
│   ┌─────────────────────────┐   │
│   │                         │   │
│   └─────────────────────────┘   │
│                                 │
│   [Cancel]          [Create]    │
└─────────────────────────────────┘
```

---

## Company Switcher Integration Example (React)

```tsx
function CompanySwitcher() {
  const [companies, setCompanies] = useState<MyCompanyItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/auth/my-companies').then(res => setCompanies(res.data.data));
  }, []);

  const current = companies.find(c => c.isCurrentCompany);
  const others = companies.filter(c => !c.isCurrentCompany);

  const handleSwitch = async (companyId: string) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/switch-company', { companyId });
      const { accessToken, refreshToken } = res.data.data;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      window.location.reload(); // Full reload to reset app state
    } catch (err) {
      toast.error('Failed to switch company');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dropdown>
      <DropdownTrigger>{current?.companyName}</DropdownTrigger>
      <DropdownMenu>
        {others.map(c => (
          <DropdownItem key={c.companyId} onClick={() => handleSwitch(c.companyId)}>
            {c.companyName}
          </DropdownItem>
        ))}
        <DropdownItem onClick={() => openCreateCompanyModal()}>
          + Create New Company
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
}
```

---

## Key Implementation Notes

1. **Token replacement on switch**: When switching companies, you get entirely new `accessToken` and `refreshToken`. The old tokens remain valid for their original company until they expire, but should be discarded.

2. **Cache invalidation**: After switching companies, ALL cached data (invoices, customers, accounts, etc.) must be cleared and re-fetched. The simplest approach is `window.location.reload()`.

3. **tempToken is short-lived**: The company selection tempToken expires in 5 minutes. If it expires, redirect to login.

4. **Password is shared**: Changing password in any company updates it everywhere. Users only need to remember one password.

5. **Roles are per-company**: A user can be `company_admin` in Company A and `standard` in Company B. Permissions are company-specific.

6. **No migration needed**: This is a backend-only change. No database migration required.
