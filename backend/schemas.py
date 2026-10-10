from pydantic import BaseModel, ConfigDict
from typing import Optional

class LoginRequest(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    email: str
    name: str
    role: str
    is_active: bool

class AuthResponse(BaseModel):
    user: UserResponse
