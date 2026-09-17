from datetime import datetime

from pydantic import BaseModel, ConfigDict


class CaseRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    customer_id: str
    real_case_number: str | None
    operation_type: str
    customs: str
    status: str
    created_by: str | None
    created_at: datetime
    updated_at: datetime


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
