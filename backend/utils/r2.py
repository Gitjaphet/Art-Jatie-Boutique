# backend/utils/r2.py

import boto3
import uuid
import os
from fastapi import UploadFile
from botocore.exceptions import ClientError

R2_ACCESS_KEY = os.getenv("CLOUDFLARE_R2_ACCESS_KEY_ID")
R2_SECRET_KEY = os.getenv("CLOUDFLARE_R2_SECRET_ACCESS_KEY")
R2_BUCKET     = os.getenv("CLOUDFLARE_R2_BUCKET_NAME")
R2_PUBLIC_URL = os.getenv("CLOUDFLARE_R2_PUBLIC_URL")
ACCOUNT_ID    = os.getenv("CLOUDFLARE_R2_ACCOUNT_ID")

R2_ENDPOINT = f"https://{ACCOUNT_ID}.r2.cloudflarestorage.com"

s3_client = boto3.client(
    "s3",
    endpoint_url=R2_ENDPOINT,
    aws_access_key_id=R2_ACCESS_KEY,
    aws_secret_access_key=R2_SECRET_KEY,
    region_name="auto",
)

async def upload_image_to_r2(file: UploadFile) -> str:
    base_name  = os.path.splitext(file.filename)[0]
    extension  = os.path.splitext(file.filename)[1]
    clean_name = base_name.replace(" ", "-").lower()

    try:
        s3_client.head_object(Bucket=R2_BUCKET, Key=f"{clean_name}{extension}")
        short_uuid  = uuid.uuid4().hex[:8]
        unique_name = f"{clean_name}-{short_uuid}{extension}"
    except ClientError:
        unique_name = f"{clean_name}{extension}"

    content = await file.read()

    s3_client.put_object(
        Bucket=R2_BUCKET,
        Key=unique_name,
        Body=content,
        ContentType=file.content_type,
    )

    return f"{R2_PUBLIC_URL}/{unique_name}"