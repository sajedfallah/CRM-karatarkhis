# KARATARKHIS CRM — Smart Correspondence

## Current status
MISSING in current V5 baseline.

Employee/Admin can describe the intended letter in natural language; AI prepares a formal draft using authorized Customer/Case/Document context.

## Rules
- AI cannot invent case number, document number, date, amount, confirmed HS or recipient data.
- Missing facts are flagged as NEEDS_INFORMATION.
- Official outgoing letters require human review; sensitive types may require Manager/Admin approval.
- Sent letters are immutable; corrections create a new version/correction letter.
- Incoming letters may produce suggested tasks/deadlines but execution follows approval/automation policy.
