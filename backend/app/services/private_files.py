import os
import boto3
from botocore.config import Config

MAX_FILE_BYTES = 3 * 1024 * 1024


class PrivateFileStore:
    def __init__(self):
        if not all(os.getenv(key) for key in ("AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_ENDPOINT_URL_S3", "CUSTOMER_DOCUMENT_BUCKET")):
            raise RuntimeError("private_storage_not_configured")
        self.bucket = os.environ["CUSTOMER_DOCUMENT_BUCKET"]
        self.client = boto3.client("s3", endpoint_url=os.environ["AWS_ENDPOINT_URL_S3"],
            region_name=os.getenv("AWS_REGION", "us-east-1"),
            config=Config(signature_version="s3v4", s3={"addressing_style": "path"},
                connect_timeout=5, read_timeout=25, retries={"max_attempts": 1}))

    def put(self, key: str, body: bytes, mime_type: str):
        self.client.put_object(Bucket=self.bucket, Key=key, Body=body, ContentType=mime_type, CacheControl="private, no-store")

    def probe(self):
        self.client.head_bucket(Bucket=self.bucket)

    def get(self, key: str) -> bytes:
        response = self.client.get_object(Bucket=self.bucket, Key=key)
        stream = response["Body"]
        try:
            return stream.read(MAX_FILE_BYTES + 1)
        finally:
            stream.close()

    def remove_uncommitted(self, key: str):
        self.client.delete_object(Bucket=self.bucket, Key=key)
