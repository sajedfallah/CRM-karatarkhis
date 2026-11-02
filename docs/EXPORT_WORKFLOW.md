# KARATARKHIS CRM — Export Workflow

## Required business input
نوع کالا، تعداد، نوع بسته‌بندی، وزن خالص، وزن ناخالص، ارزش کل بار، ارز، گمرک خروجی، HS Code، شماره موبایل راننده، شماره خودرو/پلاک.

## Corporate documents
Reusable customer documents such as کارت بازرگانی، وکالتنامه، مجوزها، استاندارد، جواز and other policy-defined documents are referenced by exact version.

## Flow
Draft → Cargo/Driver Data → Documents → AI/HS Check → Final Review → Customer Confirmation → Immutable Submission/Lock → Admin Review → Packing List → Consolidated Export PDF Package → Secure delivery to Customer + Admin.

## Artifact rules
Packing List and package are generated from the accepted immutable submission revision. Generated artifacts are immutable/versioned. Package manifest records exact included document versions. Missing/expired required documents may block generation.


## 2026-11-02 — Export intake and unified case workspace
Export registration now requires saved structured shipment/product details and an audited packing-list snapshot before customer submission. Editing invalidates the generated draft. Customer navigation groups import/export lists; declaration approval, documents table and case conversation are shown within the same registered request. Admin declaration upload has an explicit heading and shortcut. Initial packing output supports browser print/save as PDF; merged corporate-document PDF package remains incomplete. Existing submitted cases remain readable. No production migration or data change. TypeScript and Python compilation pass; PostgreSQL CI and Preview verification pending.
