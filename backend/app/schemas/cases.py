from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class CaseCreate(BaseModel):
    customer_id: str = Field(min_length=1, max_length=32)
    real_case_number: str | None = Field(default=None, max_length=128)
    operation_type: str = Field(min_length=1, max_length=32)
    customs: str = Field(min_length=1, max_length=64)
    status: str = Field(default="پیش‌نویس", min_length=1, max_length=64)


class CaseUpdate(BaseModel):
    real_case_number: str | None = Field(default=None, max_length=128)
    operation_type: str | None = Field(default=None, min_length=1, max_length=32)
    customs: str | None = Field(default=None, min_length=1, max_length=64)
    status: str | None = Field(default=None, min_length=1, max_length=64)


class CaseRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    customer_id: str
    real_case_number: str | None
    operation_type: str
    customs: str
    status: str
    sync_version: int
    sync_source: str | None
    sync_updated_at: datetime | None
    created_by: str | None
    created_at: datetime
    updated_at: datetime


class AssignmentCreate(BaseModel):
    user_id: str = Field(min_length=1, max_length=64)
    assignment_type: str = Field(min_length=1, max_length=64)
    is_primary: bool = False


class AssignmentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    case_id: str
    user_id: str
    customer_id: str | None
    assignment_type: str
    is_primary: bool
    is_active: bool
    assigned_by: str | None
    assigned_at: datetime
    ended_at: datetime | None
