from pydantic import BaseModel, Field


class ManualCustomerPayload(BaseModel):
    id: str = Field(min_length=1, max_length=32)
    name: str = Field(min_length=1, max_length=255)
    is_active: bool = True


class ManualCasePayload(BaseModel):
    id: str = Field(min_length=1, max_length=64)
    customer_id: str = Field(min_length=1, max_length=32)
    real_case_number: str | None = Field(default=None, max_length=128)
    operation_type: str = Field(min_length=1, max_length=32)
    customs: str = Field(min_length=1, max_length=64)
    status: str = Field(min_length=1, max_length=64)
    sync_version: int = Field(default=1, ge=1)


class ManualSyncBatch(BaseModel):
    customers: list[ManualCustomerPayload] = Field(default_factory=list, max_length=1000)
    cases: list[ManualCasePayload] = Field(default_factory=list, max_length=1000)
    dry_run: bool = True


class ManualSyncResult(BaseModel):
    dry_run: bool
    customers_scanned: int
    customers_imported: int
    customers_skipped: int
    cases_scanned: int
    cases_imported: int
    cases_skipped: int
    conflicts: list[str] = Field(default_factory=list)
