import json
from urllib import request


class TelegramBotClient:
    def __init__(self, token: str):
        if not token:
            raise ValueError("telegram_bot_token_not_configured")
        self.base_url = f"https://api.telegram.org/bot{token}"

    def call(self, method: str, payload: dict) -> dict:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        req = request.Request(
            f"{self.base_url}/{method}",
            data=body,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with request.urlopen(req, timeout=15) as response:  # noqa: S310 - fixed Telegram API host
            return json.loads(response.read().decode("utf-8"))

    def send_message(self, chat_id: int | str, text: str, **extra) -> dict:
        payload = {"chat_id": chat_id, "text": text, **extra}
        return self.call("sendMessage", payload)

    def answer_callback(self, callback_query_id: str, text: str | None = None) -> dict:
        payload = {"callback_query_id": callback_query_id}
        if text:
            payload["text"] = text
        return self.call("answerCallbackQuery", payload)
