# Auth Integration Guide

## Base URL
```
https://your-railway-url.up.railway.app/api/v1
```

---

## Endpoints

### 1. Register
```http
POST /auth/register
Content-Type: application/json
```
```json
{
  "company": { "name": "My Company" },
  "user": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "password": "password123"
  }
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "uuid-v4-token",
    "user": {
      "id": "...",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "isPrimaryAdmin": true,
      "role": { "code": "company_admin", "name": "Company Administrator" }
    },
    "company": { "id": "...", "name": "My Company" },
    "permissions": ["customer:view", "invoice:create", "..."]
  }
}
```
Store `accessToken` and `refreshToken`. The `accessToken` expires in **15 minutes**.

---

### 2. Login
```http
POST /auth/login
Content-Type: application/json
```
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```
**Response:** Same shape as register.

---

### 3. Logout
```http
POST /auth/logout
Content-Type: application/json
```
```json
{
  "refreshToken": "<stored_refresh_token>"
}
```
After calling this:
1. Clear `accessToken` from storage
2. Clear `refreshToken` from storage
3. Redirect to `/login`

---

### 4. Refresh Access Token
When the access token expires (401 response), call:
```http
POST /auth/refresh
Content-Type: application/json
```
```json
{
  "refreshToken": "<stored_refresh_token>"
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "new_access_token",
    "refreshToken": "new_refresh_token"
  }
}
```
> IMPORTANT: Store the **new** refresh token — the old one is revoked (token rotation).

---

### 5. Get Current User
```http
GET /auth/me
Authorization: Bearer <accessToken>
```
Returns user info + permissions array.

---

### 6. Get My Permissions
```http
GET /auth/my-permissions
Authorization: Bearer <accessToken>
```
**Response:**
```json
{
  "data": {
    "permissions": ["customer:view", "invoice:create", "..."],
    "isPrimaryAdmin": true,
    "role": { "id": "...", "code": "company_admin", "name": "Company Administrator" }
  }
}
```

---

### 7. Forgot Password
```http
POST /auth/forgot-password
Content-Type: application/json
```
```json
{ "email": "john@example.com" }
```
Sends a reset email. Always returns success (prevents email enumeration).

---

### 8. Validate Reset Token
```http
GET /auth/validate-reset-token?token=<token_from_url>
```
Use this to check if the token in the URL is valid before showing the reset form.

**Response:**
```json
{ "data": { "valid": true, "email": "jo***@example.com" } }
```

---

### 9. Reset Password
```http
POST /auth/reset-password
Content-Type: application/json
```
```json
{
  "token": "<token_from_email_link>",
  "newPassword": "newpassword123"
}
```

---

## Using the Access Token

Add to every authenticated request:
```http
Authorization: Bearer <accessToken>
```

---

## Token Storage

```js
// After login/register
localStorage.setItem('accessToken', response.data.accessToken)
localStorage.setItem('refreshToken', response.data.refreshToken)

// On logout
localStorage.removeItem('accessToken')
localStorage.removeItem('refreshToken')
```

---

## Auto-Refresh Interceptor (axios)

```js
import axios from 'axios'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
})

// Attach access token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      const refreshToken = localStorage.getItem('refreshToken')
      if (!refreshToken) {
        localStorage.removeItem('accessToken')
        window.location.href = '/login'
        return Promise.reject(error)
      }

      try {
        const { data } = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
          { refreshToken }
        )
        const { accessToken, refreshToken: newRefreshToken } = data.data

        localStorage.setItem('accessToken', accessToken)
        localStorage.setItem('refreshToken', newRefreshToken)

        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return api(originalRequest)
      } catch {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
        return Promise.reject(error)
      }
    }

    return Promise.reject(error)
  }
)

export default api
```

---

## All Response Shapes

All API responses follow this format:
```json
{
  "success": true,
  "message": "...",
  "data": { ... }
}
```

Error responses:
```json
{
  "success": false,
  "statusCode": 401,
  "message": "Invalid credentials"
}
```
