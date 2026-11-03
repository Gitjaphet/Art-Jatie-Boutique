import bcrypt
from datetime import datetime, timedelta
from typing import Optional
from jose import jwt
import os
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()

SECRET_KEY = os.getenv("SECRET_KEY", "une-cle-secrete-super-longue-et-aleatoire")
ALGORITHM = "HS256"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(
        plain_password.encode("utf-8"),
        hashed_password.encode("utf-8")
    )

def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(hours=24 * 7))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_access_token(token: str) -> Optional[dict]:
    try:
        from jose import JWTError
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except Exception:
        return None
    
def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Dépendance FastAPI : vérifie le token JWT et exige is_admin=True."""
    payload = decode_access_token(credentials.credentials)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalide ou expiré",
        )
    if not payload.get("is_admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux administrateurs",
        )
    return payload

# ── Admin facultatif ──────────────────────────────────────────────────────
from typing import Optional as _Optional
from fastapi import Depends as _Depends
from fastapi.security import HTTPBearer as _HTTPBearer, HTTPAuthorizationCredentials as _Creds

_bearer_facultatif = _HTTPBearer(auto_error=False)


def get_admin_facultatif(credentials: _Optional[_Creds] = _Depends(_bearer_facultatif)) -> _Optional[dict]:
    """Comme get_current_admin, mais ne refuse jamais : renvoie le profil admin, ou None.
    Pour une route publique qui accepte des options en plus quand un admin connecté l'appelle."""
    if not credentials:
        return None
    payload = decode_access_token(credentials.credentials)
    return payload if payload and payload.get("is_admin") else None
