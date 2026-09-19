from pydantic import BaseModel, ConfigDict, Field


class PermissionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    role: str
    scope_type: str
    scope_id: str
    profile: str
    can_view: bool
    can_create: bool
    can_edit: bool
    can_assign: bool
    can_approve_documents: bool
    can_finance: bool
    is_active: bool


class CurrentUserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    full_name: str
    mobile: str | None
    email: str | None
    telegram_user_id: str | None
    role: str
    customer_id: str | None
    permission_profile: str
    is_active: bool
    workspace_url: str | None


class UserCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=255)
    mobile: str | None = Field(default=None, max_length=32)
    email: str | None = Field(default=None, max_length=320)
    telegram_user_id: str | None = Field(default=None, max_length=64)
    role: str = "internal_employee"
    customer_id: str | None = None
    permission_profile: str = "عملیاتی"
    is_active: bool = True


class UserUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=255)
    mobile: str | None = Field(default=None, max_length=32)
    email: str | None = Field(default=None, max_length=320)
    telegram_user_id: str | None = Field(default=None, max_length=64)
    role: str | None = None
    customer_id: str | None = None
    permission_profile: str | None = None
    is_active: bool | None = None


class UserRead(CurrentUserRead):
    pass
