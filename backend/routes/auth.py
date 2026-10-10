from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_

from database import get_db
from models import User
from schemas import LoginRequest, AuthResponse, UserResponse
from security import verify_password, create_access_token, decode_access_token
from config import COOKIE_NAME, ACCESS_TOKEN_EXPIRE_MINUTES

router = APIRouter(prefix="", tags=["Authentication"])

@router.post("/login", response_model=AuthResponse)
async def login(
    payload: LoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    # Search by username or email
    stmt = select(User).where(
        or_(User.username == payload.username.strip(), User.email == payload.username.strip())
    )
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    # Generic authentication error to avoid credential enumeration
    invalid_cred_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid username or password."
    )

    if not user:
        raise invalid_cred_exception

    if not verify_password(payload.password, user.password_hash):
        raise invalid_cred_exception

    if not user.is_active:
        raise invalid_cred_exception

    # Create JWT session token
    token = create_access_token(
        data={"sub": str(user.id), "username": user.username, "role": user.role}
    )

    # Set secure HttpOnly cookie
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite="lax",
        secure=False,  # Set to False for local http development
        path="/"
    )

    return AuthResponse(user=UserResponse.model_validate(user))

@router.get("/me", response_model=AuthResponse)
async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )

    payload = decode_access_token(token)
    if not payload or not payload.get("sub"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid"
        )

    user_id = int(payload["sub"])
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )

    return AuthResponse(user=UserResponse.model_validate(user))

@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(
        key=COOKIE_NAME,
        path="/"
    )
    return {"message": "Logged out successfully"}
