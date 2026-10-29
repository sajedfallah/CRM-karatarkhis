import hashlib
import json
from sqlalchemy import select
from app.models.product_review import DraftProductReview

PRODUCT_FIELDS=("brand","model","material","intended_use","technical_attributes","country_of_origin","hs_code")

def product_fingerprint(content):
    details=content.get("product_details") or {}
    source={key:content.get(key) or "" for key in ("operation_type","customs","product_description")}
    source["product_details"]={key:details.get(key) or "" for key in PRODUCT_FIELDS}
    return hashlib.sha256(json.dumps(source,sort_keys=True,ensure_ascii=False,separators=(",",":")).encode()).hexdigest()


def product_review(db,draft):
    row=db.scalar(select(DraftProductReview).where(DraftProductReview.draft_id==draft.id,
        DraftProductReview.product_revision==draft.product_revision))
    if not row or row.source_fingerprint!=product_fingerprint(draft.content):
        return {"status":"NEEDS_REVIEW","product_revision":draft.product_revision}
    return {"status":"VERIFIED","id":row.id,"product_revision":row.product_revision,
        "reviewed_by":row.reviewed_by,"reviewed_at":row.created_at,"reason":row.reason}

