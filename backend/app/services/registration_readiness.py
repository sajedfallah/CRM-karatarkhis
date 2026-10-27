"""Read-only registration diagnostics, not a final-submission authorization."""
from app.models.core import Customer
from app.services.document_expiry import latest_versions, local_today, validity

# Canonical wizard dependencies not yet implemented. Never infer PASS from
# populated initial fields or from a declaration-document customer approval.
WORKFLOW_GAPS = (
    ("PRD-HS", "اطلاعات کامل کالا و بررسی انسانی HS"),
    ("CASE-SHIPMENT", "اطلاعات کامل حمل متناسب با نوع عملیات"),
    ("DOC-CORE", "اتصال نسخه دقیق اسناد و بررسی الزامات مدارک پرونده"),
    ("AI-CORE", "پیش‌بررسی اسناد و رسیدگی انسانی به موارد لازم"),
    ("FIN-CORE", "بررسی مالی اولیه"),
    ("CASE-ASSIGNMENT", "تخصیص مسئول و بازبینی نهایی"),
    ("SUB-001", "تأیید صریح مشتری روی نسخه اطلاعات پرونده"),
    ("SUB-002", "ثبت نسخه ثابت اطلاعات و قفل پس از ثبت نهایی"),
)


def registration_readiness(db, draft):
    customer=db.get(Customer,draft.customer_id)
    data=draft.content
    fields=[("customer","مشتری فعال",bool(customer and customer.is_active))]
    for key,title in (("title","عنوان پرونده"),("operation_type","نوع عملیات"),("customs","گمرک"),
        ("product_description","شرح اولیه کالا"),("shipment_reference","مرجع حمل / بارنامه"),
        ("quantity","تعداد"),("net_weight","وزن خالص"),("gross_weight","وزن ناخالص")):
        value=data.get(key)
        fields.append((key,title,value is not None and (not isinstance(value,str) or bool(value.strip()))))
    documents=[]
    for document,version in latest_versions(db):
        if document.customer_id==draft.customer_id:
            documents.append({"id":document.id,"title":document.title,"version_id":version.id,
                "version":version.version,"status":validity(version)})
    return {"draft_id":draft.id,"draft_version":draft.version,"evaluated_on":local_today(),
        "initial_data_complete":all(passed for _,_,passed in fields),
        "final_submission_available":False,
        "initial_checks":[{"id":key,"title":title,"complete":passed} for key,title,passed in fields],
        "workflow_gaps":[{"requirement":key,"title":title,"status":"NOT_IMPLEMENTED"} for key,title in WORKFLOW_GAPS],
        "corporate_documents":documents,
        "corporate_documents_are_linked":False}

