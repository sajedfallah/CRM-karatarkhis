from pydantic import BaseModel, Field


class AdminEmployeeCreate(BaseModel):
    full_name: str = Field(min_length=1, max_length=255)
    telegram_user_id: str = Field(min_length=1, max_length=64)
    mobile: str | None = Field(default=None, max_length=32)
    email: str | None = Field(default=None, max_length=320)
    permission_profile: str = Field(default="عملیاتی", max_length=32)


class AdminEmployeeUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=1, max_length=255)
    telegram_user_id: str | None = Field(default=None, min_length=1, max_length=64)
    mobile: str | None = Field(default=None, max_length=32)
    email: str | None = Field(default=None, max_length=320)
    permission_profile: str | None = Field(default=None, max_length=32)
    is_active: bool | None = None


class AdminCustomerCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)


class AdminCustomerUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    is_active: bool | None = None
