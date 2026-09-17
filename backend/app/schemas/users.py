from pydantic import BaseModel, ConfigDict


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
