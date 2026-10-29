"""Document categories required for initial import-case readiness."""

IMPORT_DOCUMENT_TYPES = (
    ("bill_of_lading", "بارنامه"),
    ("insurance_policy", "بیمه‌نامه"),
    ("order_registration", "ثبت سفارش"),
    ("certificate_of_origin", "گواهی مبدأ"),
    ("commercial_invoice", "اینوویس"),
    ("packing_list", "پکینگ‌لیست"),
    ("proforma_invoice", "پروفرما"),
    ("inspection_certificate", "گواهی بازرسی"),
    ("clearance_assignment", "واگذاری ترخیصیه"),
    ("warehouse_receipt", "قبض انبار"),
)

IMPORT_DOCUMENT_LABELS = dict(IMPORT_DOCUMENT_TYPES)

