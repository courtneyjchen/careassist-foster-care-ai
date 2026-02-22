from pydantic import BaseModel
from typing import Optional


class NoteCreate(BaseModel):
    note_type: str = "general"
    content: str
    author_id: Optional[int] = None


class NoteResponse(BaseModel):
    id: int
    note_type: str
    content: str
    created_at: str

    class Config:
        from_attributes = True
