"""S3 service placeholder."""


class S3Service:
    def __init__(self):
        self.configured = False

    async def upload_file(self, file_bytes: bytes, key: str) -> str:
        if not self.configured:
            raise RuntimeError("S3 not configured.")
        return f"s3://{key}"

    async def list_files(self, prefix: str = "") -> list:
        return []


s3_service = S3Service()
