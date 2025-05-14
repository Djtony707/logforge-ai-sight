
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta
from typing import Annotated

from .. import app, db_pool
from ..models import Token, User
from ..auth import (
    authenticate_user, 
    create_access_token, 
    get_current_active_user, 
    ACCESS_TOKEN_EXPIRE_MINUTES
)

@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: Annotated[OAuth2PasswordRequestForm, Depends()]):
    user = await authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Update last login time
    async with db_pool.acquire() as conn:
        await conn.execute(
            "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE username = $1", 
            user["username"]
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["username"], "role": user["role"]},
        expires_delta=access_token_expires,
    )
    return {"access_token": access_token, "token_type": "bearer", "role": user["role"]}

@app.get("/users/me", response_model=User)
async def read_users_me(current_user: Annotated[dict, Depends(get_current_active_user)]):
    return {
        "username": current_user["username"],
        "email": current_user["email"],
        "role": current_user["role"]
    }
