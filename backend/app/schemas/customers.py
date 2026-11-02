import re
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class CustomerProfile(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    customer_type: Literal['person', 'company'] | None = None
    national_id: str | None = Field(default=None, max_length=32)
    registration_number: str | None = Field(default=None, max_length=64)
    economic_code: str | None = Field(default=None, max_length=32)
    contact_name: str | None = Field(default=None, max_length=255)
    phone: str | None = Field(default=None, max_length=40)
    mobile: str | None = Field(default=None, max_length=40)
    email: str | None = Field(default=None, max_length=320)
    province: str | None = Field(default=None, max_length=100)
    city: str | None = Field(default=None, max_length=100)
    postal_code: str | None = Field(default=None, max_length=20)
    address: str | None = Field(default=None, max_length=2000)

    @field_validator('national_id', 'registration_number', 'economic_code', 'phone', 'mobile', 'postal_code', mode='before')
    @classmethod
    def normalize_digits(cls, value):
        if isinstance(value, str):
            return value.translate(str.maketrans('۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩', '01234567890123456789')).strip() or None
        return value

    @field_validator('email')
    @classmethod
    def validate_email(cls, value):
        if not value:
            return None
        if not re.fullmatch(r'[^\s@]+@[^\s@]+\.[^\s@]+', value):
            raise ValueError('invalid_email')
        return value.lower()


class CustomerCreate(CustomerProfile):
    model_config = ConfigDict(str_strip_whitespace=True)
    name: str = Field(min_length=2, max_length=255)
    is_active: bool = True


class CustomerUpdate(CustomerProfile):
    model_config = ConfigDict(str_strip_whitespace=True)
    name: str | None = Field(default=None, min_length=2, max_length=255)
    is_active: bool | None = None

    @field_validator("name")
    @classmethod
    def name_must_not_be_null(cls, value):
        if value is None:
            raise ValueError("customer_name_required")
        return value


class CustomerRead(CustomerProfile):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    is_active: bool
    drive_folder_id: str | None
    drive_provisioning_status: str
    drive_provisioning_error: str | None
    manager_invitation_status: str | None = None

