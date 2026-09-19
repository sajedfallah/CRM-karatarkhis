from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class TaskCreate(BaseModel):
    relation_type: str = Field(min_length=1, max_length=32)
    related_id: str | None = Field(default=None, max_length=64)
    customer_id: str | None = Field(default=None, max_length=32)
    case_id: str | None = Field(default=None, max_length=64)
    title: str = Field(min_length=1, max_length=255)
    category: str | None = Field(default=None, max_length=64)
    assignee_user_id: str | None = Field(default=None, max_length=64)
    priority: str = Field(default="عادی", min_length=1, max_length=32)
    status: str = Field(default="جدید", min_length=1, max_length=32)
    due_at: datetime | None = None
    needs_manager: bool = False
    result: str | None = None
    next_action: str | None = None
    notes: str | None = None


class TaskUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    category: str | None = Field(default=None, max_length=64)
    assignee_user_id: str | None = Field(default=None, max_length=64)
    priority: str | None = Field(default=None, min_length=1, max_length=32)
    status: str | None = Field(default=None, min_length=1, max_length=32)
    due_at: datetime | None = None
    needs_manager: bool | None = None
    result: str | None = None
    next_action: str | None = None
    notes: str | None = None


class TaskRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    relation_type: str
    related_id: str | None
    customer_id: str | None
    case_id: str | None
    title: str
    category: str | None
    created_by: str | None
    assignee_user_id: str | None
    priority: str
    status: str
    due_at: datetime | None
    needs_manager: bool
    result: str | None
    next_action: str | None
    notes: str | None
    created_at: datetime
    updated_at: datetime


class TaskMessageCreate(BaseModel):
    body: str = Field(min_length=1, max_length=10000)


class TaskMessageRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    task_id: str
    sender_user_id: str | None
    body: str
    source: str
    created_at: datetime
