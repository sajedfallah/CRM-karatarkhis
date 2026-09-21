# KARATARKHIS CRM — Export Workflow

## Required business input
نوع کالا، تعداد، نوع بسته‌بندی، وزن خالص، وزن ناخالص، ارزش کل بار، ارز، گمرک خروجی، HS Code، شماره موبایل راننده، شماره خودرو/پلاک.

## Corporate documents
Reusable customer documents such as کارت بازرگانی، وکالتنامه، مجوزها، استاندارد، جواز and other policy-defined documents are referenced by exact version.

## Flow
Draft → Cargo/Driver Data → Documents → AI/HS Check → Final Review → Customer Confirmation → Immutable Submission/Lock → Admin Review → Packing List → Consolidated Export PDF Package → Secure delivery to Customer + Admin.

## Artifact rules
Packing List and package are generated from the accepted immutable submission revision. Generated artifacts are immutable/versioned. Package manifest records exact included document versions. Missing/expired required documents may block generation.
