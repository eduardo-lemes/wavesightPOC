"""
S3 storage module for CSV uploads and reports.
Falls back gracefully if AWS is not configured.
"""
import logging
import os

logger = logging.getLogger(__name__)

S3_BUCKET = os.getenv("S3_BUCKET", "")
S3_REGION = os.getenv("S3_REGION", "us-east-1")
PRESIGNED_EXPIRY = int(os.getenv("S3_PRESIGNED_EXPIRY", "3600"))


def _is_configured() -> bool:
    return bool(S3_BUCKET)


def _get_client():
    import boto3
    return boto3.client("s3", region_name=S3_REGION)


def upload_file(content: bytes, key: str, content_type: str = "text/csv") -> str | None:
    """Upload file to S3. Returns key on success, None if not configured or error."""
    if not _is_configured():
        return None

    try:
        client = _get_client()
        client.put_object(Bucket=S3_BUCKET, Key=key, Body=content, ContentType=content_type)
        logger.info(f"Uploaded to S3: {key}")
        return key
    except Exception:
        logger.exception(f"S3 upload failed for key={key}")
        return None


def get_presigned_url(key: str) -> str | None:
    """Get a presigned download URL. Returns None if not configured."""
    if not _is_configured():
        return None

    try:
        client = _get_client()
        url = client.generate_presigned_url(
            "get_object",
            Params={"Bucket": S3_BUCKET, "Key": key},
            ExpiresIn=PRESIGNED_EXPIRY,
        )
        return url
    except Exception:
        logger.exception(f"S3 presigned URL failed for key={key}")
        return None


def build_key(user_id: int, analysis_id: int, filename: str) -> str:
    """Build S3 key: uploads/{user_id}/{analysis_id}/{filename}"""
    safe_name = "".join(c if c.isalnum() or c in "._-" else "_" for c in filename)
    return f"uploads/{user_id}/{analysis_id}/{safe_name}"
