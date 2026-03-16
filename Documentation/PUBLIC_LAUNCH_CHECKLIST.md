# Public Launch Checklist — Features Disabled for Private Deployment

This document tracks everything that was intentionally commented out or disabled
for the current private/single-tenant deployment. Re-enable each item before
opening FinanX to public self-signup.

---

## 1. User Registration (Sign Up)

**Status:** Disabled — backend endpoint off, frontend shows "Registration closed" screen.

### Backend
- `POST /auth/register` endpoint is disabled in `auth.controller.ts`.
- `register()` method in `auth.service.ts` and `RegisterDto` are **preserved** — just re-attach the route guard / decorator to re-enable.

### Frontend

**File: `src/app/(full-width-pages)/(auth)/signup/page.tsx`**

Replace the entire file content with:
```tsx
import SignUpForm from "@/components/auth/SignUpForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up | FinanX",
  description: "Create your FinanX account.",
};

export default function SignUp() {
  return <SignUpForm />;
}
```

**File: `src/components/auth/SignInForm.tsx`**

Find this comment near the bottom of the JSX (just before the closing `</div>`):
```tsx
{/* Sign-up link removed — registration is currently closed. Re-enable for public launch. */}
```

Replace it with:
```tsx
<p className="mt-5 text-[13px] text-center text-gray-500 dark:text-gray-400">
  Don&apos;t have an account?{" "}
  <Link href="/signup" className="text-brand-500 hover:text-brand-600 dark:text-brand-400 font-medium transition-colors">
    Sign up
  </Link>
</p>
```

**File: `src/components/auth/SignUpForm.tsx`**

No changes needed — the full form with all fields, validation, and `register()` call
from `AuthContext` is intact and ready to use.

**File: `src/context/AuthContext.tsx`**

The `register` method is already wired up and exported in context. No changes needed.

**File: `src/services/authService.ts`**

`register()` service function is already present and calls `POST /auth/register`. No changes needed.

---

## 2. Social Auth Buttons (Google / X)

**Status:** UI buttons exist in `SignUpForm` but are not wired to any OAuth flow.

**File: `src/components/auth/SignUpForm.tsx`** — lines ~84–100

The Google and X (Twitter) buttons are rendered but have no `onClick` handler.
When implementing OAuth:
- Add `onClick` handlers calling your OAuth provider's redirect
- Or remove the buttons entirely if social login won't be supported

---

## 3. Terms & Privacy Policy Links

**Status:** Referenced in `SignUpForm` as plain text, not linked.

**File: `src/components/auth/SignUpForm.tsx`** — checkbox label ~line 142

```tsx
<span className="text-gray-700 dark:text-gray-300 font-medium">Terms and Conditions</span>
<span className="text-gray-700 dark:text-gray-300 font-medium">Privacy Policy</span>
```

Replace with actual `<Link href="/terms">` and `<Link href="/privacy">` once those pages exist.

---

## 4. Invitation-Based Onboarding (Already Implemented)

**Status:** Fully implemented, available now.

`POST /auth/accept-invitation` → `src/app/(full-width-pages)/(auth)/accept-invitation/page.tsx`
and `src/components/auth/AcceptInvitationForm.tsx` are live.

This is the recommended onboarding path while registration is closed —
admins invite users via the invitation system instead of public sign-up.

---

## Summary Checklist

| Item | File(s) | Action |
|------|---------|--------|
| Re-enable `/auth/register` | backend `auth.controller.ts` | Uncomment/re-attach route |
| Restore signup page | `signup/page.tsx` | Swap content (see above) |
| Restore sign-in link | `SignInForm.tsx` | Replace comment with JSX (see above) |
| Wire social auth buttons | `SignUpForm.tsx` | Add OAuth `onClick` handlers |
| Add T&C / Privacy links | `SignUpForm.tsx` | Replace `<span>` with `<Link>` |
