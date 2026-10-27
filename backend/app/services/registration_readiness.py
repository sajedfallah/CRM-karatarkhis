"""Read-only registration diagnostics, not a final-submission authorization."""
from app.models.core import Customer
from app.services.product_review import product_review
from app.services.document_expiry import latest_versions, local_today, validity

# Canonical wizard dependencies not yet implemented. Never infer PASS from
# populated initial fields or from a declaration-document customer approval.
WORKFLOW_GAPS = (
    ("PRD-HS", "بانک کالا و اتصال بررسی HS به ثبت نهایی"),
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
    shipment_checks=[]
    if data.get("operation_type")=="export":
        shipment=data.get("export_shipment") or {}
        product=data.get("product_details") or {}
        checks=(
            ("package_type","نوع بسته‌بندی",bool(shipment.get("package_type"))),
            ("package_count","تعداد بسته",shipment.get("package_count") is not None),
            ("total_value","ارزش کل",shipment.get("total_value") is not None),
            ("currency","ارز",bool(shipment.get("currency"))),
            ("customs","گمرک خروجی",bool(data.get("customs"))),
            ("hs_code","کد HS",bool(product.get("hs_code"))),
            ("driver_mobile","موبایل راننده",bool(shipment.get("driver_mobile"))),
            ("vehicle_identifier","خودرو / پلاک",bool(shipment.get("vehicle_identifier"))),
        )
        shipment_checks=[{"id":key,"title":title,"complete":complete} for key,title,complete in checks]
        review=product_review(db,draft)
        shipment_checks.append({"id":"hs_human_review","title":"بررسی انسانی کد HS","complete":review["status"]=="VERIFIED"})
    documents=[]
    for document,version in latest_versions(db):
        if document.customer_id==draft.customer_id:
            documents.append({"id":document.id,"title":document.title,"version_id":version.id,
                "version":version.version,"status":validity(version)})
    return {"draft_id":draft.id,"draft_version":draft.version,"evaluated_on":local_today(),
        "initial_data_complete":all(passed for _,_,passed in fields),
        "shipment_check_status":"COMPLETE" if shipment_checks and all(item["complete"] for item in shipment_checks) else "INCOMPLETE" if shipment_checks else "NOT_DEFINED",
        "shipment_checks":shipment_checks,
        "final_submission_available":False,"product_review":product_review(db,draft),
        "initial_checks":[{"id":key,"title":title,"complete":passed} for key,title,passed in fields],
        "workflow_gaps":[{"requirement":key,"title":title,"status":"NOT_IMPLEMENTED"} for key,title in WORKFLOW_GAPS],
        "corporate_documents":documents,
        "corporate_documents_are_linked":False}

