from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class DocumentCreate(BaseModel):
    customer_id: str = Field(min_length=1, max_length=32)
    case_id: str | None = Field(default=None, max_length=64)
    document_type: str = Field(min_length=1, max_length=64)
    title: str = Field(min_length=1, max_length=255)
    drive_file_id: str = Field(min_length=1, max_length=128)
    drive_url: str = Field(min_length=1)
    mime_type: str | None = Field(default=None, max_length=255)
    version: int = Field(default=1, ge=1)
    status: str = Field(default="uploaded", min_length=1, max_length=32)
    expires_at: datetime | None = None
    notes: str | None = None


class DocumentUpdate(BaseModel):
    document_type: str | None = Field(default=None, min_length=1, max_length=64)
    title: str | None = Field(default=None, min_length=1, max_length=255)
    drive_file_id: str | None = Field(default=None, min_length=1, max_length=128)
    drive_url: str | None = None
    mime_type: str | None = Field(default=None, max_length=255)
    version: int | None = Field(default=None, ge=1)
    status: str | None = Field(default=None, min_length=1, max_length=32)
    expires_at: datetime | None = None
    notes: str | None = None


class DocumentApproval(BaseModel):
    approved: bool
    notes: str | None = None


class DocumentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    customer_id: str
    case_id: str | None
    document_type: str
    title: str
    drive_file_id: str
    drive_url: str
    mime_type: str | None
    version: int
    status: str
    uploaded_by: str | None
    approved_by: str | None
    approved_at: datetime | None
    expires_at: datetime | None
    notes: str | None
    created_at: datetime
    updated_at: datetime
