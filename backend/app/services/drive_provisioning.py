from dataclasses import dataclass

from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.integrations.google_drive import GoogleDriveClient
from app.models.core import Case, Customer


CUSTOMER_BASE_FOLDERS = (
    "00-اسناد پایه",
    "01-وکالت‌نامه",
    "02-مجوزها",
    "03-مدارک ثبتی",
    "99-سایر",
)

CASE_FOLDERS = (
    "01-اسناد تجاری",
    "02-حمل و قبض انبار",
    "03-مجوزها و بازرسی",
    "04-گمرک و ترخیص",
    "05-مالی و تسویه",
    "99-سایر",
)


@dataclass(frozen=True)
class ProvisioningResult:
    folder_id: str
    folder_url: str


class DriveProvisioningService:
    def __init__(self, db: Session):
        self.db = db
        settings = get_settings()
        if not settings.google_crm_documents_root_folder_id:
            raise RuntimeError("google_crm_documents_root_folder_id_not_configured")
        self.root_folder_id = settings.google_crm_documents_root_folder_id
        self.client = GoogleDriveClient(
            credentials_file=settings.google_service_account_file,
            credentials_json=settings.google_service_account_json,
            credentials_json_b64=settings.google_service_account_json_b64,
        )

    @staticmethod
    def _url(folder_id: str) -> str:
        return f"https://drive.google.com/drive/folders/{folder_id}"

    def provision_customer(self, customer: Customer) -> ProvisioningResult:
        try:
            customer_folder = self.client.ensure_folder(
                parent_id=self.root_folder_id,
                name=f"{customer.id} | {customer.name}",
            )
            base_docs = self.client.ensure_folder(parent_id=customer_folder, name="00-اسناد پایه")
            self.client.ensure_folder(parent_id=base_docs, name="01-وکالت‌نامه")
            self.client.ensure_folder(parent_id=base_docs, name="02-مجوزها")
            self.client.ensure_folder(parent_id=base_docs, name="03-مدارک ثبتی")
            self.client.ensure_folder(parent_id=base_docs, name="99-سایر")
            self.client.ensure_folder(parent_id=customer_folder, name="پرونده‌ها")
            customer.drive_folder_id = customer_folder
            customer.drive_provisioning_status = "ready"
            customer.drive_provisioning_error = None
            self.db.flush()
            return ProvisioningResult(customer_folder, self._url(customer_folder))
        except Exception as exc:
            customer.drive_provisioning_status = "error"
            customer.drive_provisioning_error = str(exc)[:2000]
            self.db.flush()
            raise

    def provision_case(self, case: Case, customer: Customer) -> ProvisioningResult:
        if not customer.drive_folder_id or customer.drive_provisioning_status != "ready":
            self.provision_customer(customer)
        try:
            cases_root = self.client.ensure_folder(parent_id=customer.drive_folder_id, name="پرونده‌ها")
            operation = case.operation_type or "نامشخص"
            operation_root = self.client.ensure_folder(parent_id=cases_root, name=operation)
            display_number = case.real_case_number or case.id
            case_folder = self.client.ensure_folder(
                parent_id=operation_root,
                name=f"{case.id} | {display_number}",
            )
            for folder_name in CASE_FOLDERS:
                self.client.ensure_folder(parent_id=case_folder, name=folder_name)
            case.drive_folder_id = case_folder
            case.drive_provisioning_status = "ready"
            case.drive_provisioning_error = None
            self.db.flush()
            return ProvisioningResult(case_folder, self._url(case_folder))
        except Exception as exc:
            case.drive_provisioning_status = "error"
            case.drive_provisioning_error = str(exc)[:2000]
            self.db.flush()
            raise
