# Day 32 — Payroll Frontend Integration Guide

Base URL: `{{API_URL}}/api/v1/payroll`

---

## Employee Management

### Create Employee
```http
POST /payroll/employees
Authorization: Bearer {{token}}
Permission: employee:create

{
  "firstName": "John",          // required
  "lastName": "Doe",            // required
  "hireDate": "2024-01-15",    // required ISO date
  "employeeNumber": "EMP-0001", // optional, auto-generated
  "email": "john@company.com",
  "phone": "+1234567890",
  "dateOfBirth": "1990-05-20",
  "gender": "Male",
  "department": "Engineering",
  "jobTitle": "Software Engineer",
  "employmentType": "FULL_TIME",  // FULL_TIME | PART_TIME | CONTRACTOR | TEMPORARY
  "payType": "SALARY",            // SALARY | HOURLY
  "payFrequency": "MONTHLY",     // WEEKLY | BIWEEKLY | SEMIMONTHLY | MONTHLY
  "payRate": 120000,              // Annual salary or hourly rate
  "bankName": "Chase",
  "bankAccountNumber": "****1234",
  "bankRoutingNumber": "021000021",
  "taxFilingStatus": "SINGLE",   // SINGLE | MARRIED | HEAD_OF_HOUSEHOLD
  "federalAllowances": 1,
  "stateAllowances": 1,
  "addressLine1": "123 Main St",
  "city": "New York",
  "state": "NY",
  "postalCode": "10001",
  "country": "US",
  "notes": "Optional notes",
  "userId": "uuid"              // Optional: link to existing user
}
```

### List Employees
```http
GET /payroll/employees?page=1&limit=20&search=John&employmentType=FULL_TIME&payType=SALARY&payFrequency=MONTHLY&isActive=true
Authorization: Bearer {{token}}
Permission: employee:view
```

### Get Employee
```http
GET /payroll/employees/:id
Authorization: Bearer {{token}}
Permission: employee:view
```

### Update Employee
```http
PATCH /payroll/employees/:id
Authorization: Bearer {{token}}
Permission: employee:edit

{ "payRate": 130000, "department": "Senior Engineering" }
```

### Deactivate Employee
```http
DELETE /payroll/employees/:id
Authorization: Bearer {{token}}
Permission: employee:deactivate
```
Note: Soft-delete — sets `isActive=false` and `terminationDate`.

### Employee Pay History
```http
GET /payroll/employees/:id/pay-history?page=1&limit=20
Authorization: Bearer {{token}}
Permission: employee:view
```
Returns pay run items from POSTED/PAID pay runs.

### Link User to Employee
```http
POST /payroll/employees/:id/link-user
Authorization: Bearer {{token}}
Permission: employee:edit

{ "userId": "user-uuid" }
```

### Unlink User from Employee
```http
DELETE /payroll/employees/:id/link-user
Authorization: Bearer {{token}}
Permission: employee:edit
```

---

## Pay Run Management

### Create Pay Run
```http
POST /payroll/pay-runs
Authorization: Bearer {{token}}
Permission: payroll:create

{
  "payPeriodStart": "2026-03-01",  // required
  "payPeriodEnd": "2026-03-31",    // required
  "payDate": "2026-03-31",        // required
  "payFrequency": "MONTHLY",      // required: WEEKLY | BIWEEKLY | SEMIMONTHLY | MONTHLY
  "paymentAccountId": "uuid",     // optional: bank account for payment
  "notes": "March payroll"
}
```

### List Pay Runs
```http
GET /payroll/pay-runs?page=1&limit=20&status=DRAFT&payFrequency=MONTHLY&startDate=2026-01-01&endDate=2026-12-31
Authorization: Bearer {{token}}
Permission: payroll:view
```

### Get Pay Run Detail
```http
GET /payroll/pay-runs/:id
Authorization: Bearer {{token}}
Permission: payroll:view
```
Returns full detail including items, employee info, earnings, and deductions.

### Update Pay Run (DRAFT only)
```http
PATCH /payroll/pay-runs/:id
Authorization: Bearer {{token}}
Permission: payroll:create

{ "payDate": "2026-04-01", "notes": "Updated" }
```

### Delete Pay Run (DRAFT only)
```http
DELETE /payroll/pay-runs/:id
Authorization: Bearer {{token}}
Permission: payroll:create
```

---

## Pay Run Items

### Auto-Generate Items
```http
POST /payroll/pay-runs/:id/generate
Authorization: Bearer {{token}}
Permission: payroll:create
```
Finds active employees matching the pay run's frequency and creates items with calculated regular pay. Skips employees already in the pay run.

### Add Item Manually
```http
POST /payroll/pay-runs/:id/items
Authorization: Bearer {{token}}
Permission: payroll:create

{
  "employeeId": "uuid",          // required
  "regularHours": 160,
  "overtimeHours": 10,
  "overtimeRate": 1.5,
  "earnings": [
    { "earningType": "BONUS", "description": "Q1 bonus", "amount": 5000 }
  ],
  "deductions": [
    { "deductionType": "FEDERAL_TAX", "amount": 2500 },
    { "deductionType": "HEALTH_INSURANCE", "amount": 500, "isEmployerContribution": false }
  ],
  "notes": "Optional"
}
```

**Earning Types**: REGULAR, OVERTIME, BONUS, COMMISSION, ALLOWANCE, OTHER
**Deduction Types**: FEDERAL_TAX, STATE_TAX, LOCAL_TAX, SOCIAL_SECURITY, MEDICARE, HEALTH_INSURANCE, RETIREMENT_401K, LOAN_REPAYMENT, UNION_DUES, GARNISHMENT, OTHER

### Update Item (DRAFT only)
```http
PATCH /payroll/pay-runs/:id/items/:itemId
Authorization: Bearer {{token}}
Permission: payroll:create

{ "overtimeHours": 20, "earnings": [...], "deductions": [...] }
```
Note: Replaces all earnings/deductions — send the full list.

### Remove Item (DRAFT only)
```http
DELETE /payroll/pay-runs/:id/items/:itemId
Authorization: Bearer {{token}}
Permission: payroll:create
```

---

## Pay Run Lifecycle

### Submit for Approval
```http
POST /payroll/pay-runs/:id/submit
Authorization: Bearer {{token}}
Permission: payroll:approve
```
DRAFT → PENDING_APPROVAL. Requires at least one item with grossPay > 0.

### Approve
```http
POST /payroll/pay-runs/:id/approve
Authorization: Bearer {{token}}
Permission: payroll:approve
```
PENDING_APPROVAL → APPROVED.

### Reject
```http
POST /payroll/pay-runs/:id/reject
Authorization: Bearer {{token}}
Permission: payroll:approve

{ "reason": "Need to review hours" }
```
PENDING_APPROVAL → DRAFT. Clears submit fields.

### Post (Creates Journal Entry)
```http
POST /payroll/pay-runs/:id/post
Authorization: Bearer {{token}}
Permission: payroll:process
```
APPROVED → POSTED. Creates auto journal entry:
- Debit: Expenses = grossPay + employerTaxes
- Credit: Other Current Liabilities = taxes + employerTaxes + deductions
- Credit: Bank = netPay

### Mark as Paid
```http
POST /payroll/pay-runs/:id/mark-paid
Authorization: Bearer {{token}}
Permission: payroll:process
```
POSTED → PAID.

### Void (Creates Reversal Journal Entry)
```http
POST /payroll/pay-runs/:id/void
Authorization: Bearer {{token}}
Permission: payroll:process

{ "reason": "Duplicate pay run" }
```
POSTED or PAID → VOID. Creates reversal journal entry (opposite of posting).

---

## Payslips

### Get All Payslips for a Pay Run
```http
GET /payroll/pay-runs/:id/payslips
Authorization: Bearer {{token}}
Permission: payroll:view
```
Only available for POSTED or PAID pay runs.

### Get Individual Payslip
```http
GET /payroll/payslips/:itemId
Authorization: Bearer {{token}}
Permission: payroll:view
```
Returns full breakdown: employee info, earnings, deductions, pay run details.

---

## Reports

### Payroll Summary
```http
GET /payroll/reports/summary?startDate=2026-01-01&endDate=2026-12-31
Authorization: Bearer {{token}}
Permission: payroll:view
```
Returns totals, monthly breakdown, and list of POSTED/PAID pay runs.

### Tax Liability Summary
```http
GET /payroll/reports/tax-liability?startDate=2026-01-01&endDate=2026-12-31
Authorization: Bearer {{token}}
Permission: payroll:view
```
Returns tax liabilities grouped by deduction type (tax types only), with employee vs employer breakdown.

---

## Pay Calculation Logic

### Salary Employees
- Regular Pay = Annual Salary / Periods Per Year
- Overtime: hourlyRate = Annual Salary / 2080, then hourlyRate * overtimeHours * overtimeRate

### Hourly Employees
- Regular Pay = Hourly Rate * Regular Hours
- Overtime = Hourly Rate * Overtime Hours * Overtime Rate (default 1.5x)

### Periods Per Year
| Frequency | Periods | Default Hours |
|-----------|---------|---------------|
| WEEKLY | 52 | 40 |
| BIWEEKLY | 26 | 80 |
| SEMIMONTHLY | 24 | 86.67 |
| MONTHLY | 12 | 173.33 |

---

## Status Flow Reference
```
Status              | Can Edit Items | Can Delete Pay Run |
--------------------|----------------|-------------------|
DRAFT               | Yes            | Yes               |
PENDING_APPROVAL    | No             | No                |
APPROVED            | No             | No                |
POSTED              | No             | No                |
PAID                | No             | No                |
VOID                | No             | No                |
```
