# KARATARKHIS CRM — Product Specification

KARATARKHIS is a Persian, RTL, case-centric customs clearance operations platform, not a generic CRM.

## Primary actors
SUPER_ADMIN, ADMIN, OPERATIONS_MANAGER, TEAM_MANAGER, EMPLOYEE, FINANCE, DOCUMENT_REVIEWER, SALES, CUSTOMER_RELATION, CUSTOMER, READ_ONLY.

## Core domains
Leads & Referrals; Customers/Customer 360; Cases/Case 360; Workflow; Tasks/SLA; Documents; Product/HS; Finance; Communication/Telegram; Smart Correspondence; AI Center; Corporate Compliance/Expiry; Export Packing List/PDF Package; Reports; Employees/RBAC; Audit.

## Core process
Customer → Case Draft → Documents → AI Pre-Check → Product/HS Review → Final Review → Customer Confirmation → Immutable Submission → Customer Lock → Admin Review → Workflow/Tasks/Finance → Completion.

## Import/Export
Both Import and Export follow confirmation, submission lock, versioning, document validity, RBAC, audit and human-approval rules.

## Export minimum fields
Product type, quantity, packaging type, net weight, gross weight, total value, currency, exit customs, HS code, driver mobile, vehicle number.

## UI
Persian-first, RTL-native, Vazirmatn, responsive. Customer Portal is simplified and never exposes internal/admin surfaces.
