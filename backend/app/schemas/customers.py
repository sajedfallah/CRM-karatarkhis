from pydantic import BaseModel, ConfigDict, Field, field_validator


class CustomerCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    name: str = Field(min_length=2, max_length=255)
    is_active: bool = True


class CustomerUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    name: str | None = Field(default=None, min_length=2, max_length=255)
    is_active: bool | None = None

    @field_validator("name")
    @classmethod
    def name_must_not_be_null(cls, value):
        if value is None:
            raise ValueError("customer_name_required")
        return value


class CustomerRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    is_active: bool
    drive_folder_id: str | None
    drive_provisioning_status: str
    drive_provisioning_error: str | None
