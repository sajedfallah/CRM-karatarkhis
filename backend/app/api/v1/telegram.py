from fastapi import APIRouter, Header, HTTPException
from sqlalchemy import select

from app.api.deps import DbSession
from app.api.v1.admin import (
    create_customer,
    create_employee,
    delete_customer,
    delete_employee,
    list_customers,
    list_employees,
    update_customer,
    update_employee,
)
from app.core.config import get_settings
from app.integrations.telegram_bot import TelegramBotClient
from app.models.core import User
from app.schemas.admin import (
    AdminCustomerCreate,
    AdminCustomerUpdate,
    AdminEmployeeCreate,
    AdminEmployeeUpdate,
)

router = APIRouter(prefix="/telegram", tags=["telegram"])
settings = get_settings()


def _admin_menu() -> dict:
    return {
        "inline_keyboard": [
            [
                {"text": "👥 کارمندان", "callback_data": "admin:employees:list"},
                {"text": "➕ کارمند", "callback_data": "admin:employees:add"},
            ],
            [
                {"text": "✏️ کارمند", "callback_data": "admin:employees:edit"},
                {"text": "🗑 کارمند", "callback_data": "admin:employees:delete"},
            ],
            [
                {"text": "🏢 مشتریان", "callback_data": "admin:customers:list"},
                {"text": "➕ مشتری", "callback_data": "admin:customers:add"},
            ],
            [
                {"text": "✏️ مشتری", "callback_data": "admin:customers:edit"},
                {"text": "🗑 مشتری", "callback_data": "admin:customers:delete"},
            ],
        ]
    }


def _get_admin(db: DbSession, telegram_user_id: str | int | None) -> User | None:
    if telegram_user_id is None:
        return None
    return db.scalar(
        select(User).where(
            User.telegram_user_id == str(telegram_user_id),
            User.role == "admin",
            User.is_active.is_(True),
        )
    )


def _force_reply() -> dict:
    return {"force_reply": True, "selective": True}


def _bool_from_fa(value: str) -> bool:
    normalized = value.strip().lower()
    if normalized in {"فعال", "true", "1", "بله", "yes"}:
        return True
    if normalized in {"غیرفعال", "false", "0", "خیر", "no"}:
        return False
    raise ValueError("invalid_boolean")


def _process_reply(text: str, prompt: str, db: DbSession, admin: User) -> str:
    parts = [part.strip() for part in text.split("|")]

    if prompt.startswith("[ADD_EMPLOYEE]"):
        if len(parts) < 2:
            raise ValueError("نام | Telegram ID")
        result = create_employee(
            AdminEmployeeCreate(full_name=parts[0], telegram_user_id=parts[1]),
            db,
            admin,
        )
        return f"✅ کارمند ثبت شد\n{result['id']} | {result['full_name']}"

    if prompt.startswith("[EDIT_EMPLOYEE]"):
        if len(parts) < 4:
            raise ValueError("User ID | نام | Telegram ID | فعال/غیرفعال")
        result = update_employee(
            parts[0],
            AdminEmployeeUpdate(
                full_name=parts[1],
                telegram_user_id=parts[2],
                is_active=_bool_from_fa(parts[3]),
            ),
            db,
            admin,
        )
        return f"✅ کارمند اصلاح شد\n{result['id']} | {result['full_name']}"

    if prompt.startswith("[DELETE_EMPLOYEE]"):
        delete_employee(parts[0], db, admin)
        return "✅ کارمند حذف شد"

    if prompt.startswith("[ADD_CUSTOMER]"):
        result = create_customer(AdminCustomerCreate(name=text.strip()), db, admin)
        return f"✅ مشتری ثبت شد\n{result['id']} | {result['name']}"

    if prompt.startswith("[EDIT_CUSTOMER]"):
        if len(parts) < 3:
            raise ValueError("Customer ID | نام | فعال/غیرفعال")
        result = update_customer(
            parts[0],
            AdminCustomerUpdate(name=parts[1], is_active=_bool_from_fa(parts[2])),
            db,
            admin,
        )
        return f"✅ مشتری اصلاح شد\n{result['id']} | {result['name']}"

    if prompt.startswith("[DELETE_CUSTOMER]"):
        delete_customer(parts[0], db, admin)
        return "✅ مشتری حذف شد"

    raise ValueError("unknown_admin_action")


@router.post("/webhook")
def telegram_webhook(
    update: dict,
    db: DbSession,
    x_telegram_bot_api_secret_token: str | None = Header(default=None),
) -> dict:
    if settings.telegram_webhook_secret and x_telegram_bot_api_secret_token != settings.telegram_webhook_secret:
        raise HTTPException(status_code=403, detail="invalid_telegram_webhook_secret")
    if not settings.telegram_bot_token:
        raise HTTPException(status_code=503, detail="telegram_bot_not_configured")

    bot = TelegramBotClient(settings.telegram_bot_token)
    callback = update.get("callback_query")
    message = update.get("message")

    if callback:
        sender = callback.get("from", {})
        admin = _get_admin(db, sender.get("id"))
        bot.answer_callback(callback.get("id", ""))
        if admin is None:
            return {"ok": True}
        chat_id = callback.get("message", {}).get("chat", {}).get("id")
        action = callback.get("data", "")

        if action == "admin:employees:list":
            rows = list_employees(db, admin)
            text = "👥 کارمندان\n" + ("\n".join(f"{r['id']} | {r['full_name']} | {r['telegram_user_id']} | {'فعال' if r['is_active'] else 'غیرفعال'}" for r in rows) if rows else "هیچ کارمندی ثبت نشده است.")
            bot.send_message(chat_id, text)
        elif action == "admin:employees:add":
            bot.send_message(chat_id, "[ADD_EMPLOYEE]\nنام | Telegram ID", reply_markup=_force_reply())
        elif action == "admin:employees:edit":
            bot.send_message(chat_id, "[EDIT_EMPLOYEE]\nUser ID | نام جدید | Telegram ID جدید | فعال/غیرفعال", reply_markup=_force_reply())
        elif action == "admin:employees:delete":
            bot.send_message(chat_id, "[DELETE_EMPLOYEE]\nUser ID", reply_markup=_force_reply())
        elif action == "admin:customers:list":
            rows = list_customers(db, admin)
            text = "🏢 مشتریان\n" + ("\n".join(f"{r['id']} | {r['name']} | {'فعال' if r['is_active'] else 'غیرفعال'}" for r in rows) if rows else "هیچ مشتری ثبت نشده است.")
            bot.send_message(chat_id, text)
        elif action == "admin:customers:add":
            bot.send_message(chat_id, "[ADD_CUSTOMER]\nنام مشتری", reply_markup=_force_reply())
        elif action == "admin:customers:edit":
            bot.send_message(chat_id, "[EDIT_CUSTOMER]\nCustomer ID | نام جدید | فعال/غیرفعال", reply_markup=_force_reply())
        elif action == "admin:customers:delete":
            bot.send_message(chat_id, "[DELETE_CUSTOMER]\nCustomer ID", reply_markup=_force_reply())
        return {"ok": True}

    if message:
        sender = message.get("from", {})
        admin = _get_admin(db, sender.get("id"))
        if admin is None:
            return {"ok": True}
        chat_id = message.get("chat", {}).get("id")
        text = (message.get("text") or "").strip()

        if text in {"/admin", "مدیریت", "پنل مدیریت"}:
            bot.send_message(chat_id, "پنل مدیریت CRM", reply_markup=_admin_menu())
            return {"ok": True}

        reply_to = message.get("reply_to_message") or {}
        prompt = (reply_to.get("text") or "").strip()
        if prompt.startswith("["):
            try:
                result_text = _process_reply(text, prompt, db, admin)
            except HTTPException as exc:
                result_text = f"❌ عملیات انجام نشد: {exc.detail}"
            except (ValueError, IndexError) as exc:
                result_text = f"❌ فرمت ورودی صحیح نیست.\n{exc}"
            bot.send_message(chat_id, result_text, reply_markup=_admin_menu())
            return {"ok": True}

    return {"ok": True}
