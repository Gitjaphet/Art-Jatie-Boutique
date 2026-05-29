# ai/schemas.py
from pydantic import BaseModel, Field

class ChatInput(BaseModel):
    """Schéma pour valider le message envoyé par le client."""
    message: str = Field(
        ..., 
        min_length=1, 
        description="Le message textuel envoyé par l'utilisateur à l'agent."
    )

class ChatOutput(BaseModel):
    """Schéma pour garantir la structure de la réponse renvoyée au frontend."""
    response: str = Field(
        ..., 
        description="La réponse textuelle générée par l'agent commercial."
    )