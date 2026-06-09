import json
import os
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
from langchain_core.messages import HumanMessage, SystemMessage, ToolMessage

from ai.agent import llm_with_tools, TOOLS_MAP, SYSTEM_PROMPT

router = APIRouter()


class Message(BaseModel):
    role: str  # "user" ou "assistant"
    content: str


class ChatRequest(BaseModel):
    message: str
    history: Optional[List[Message]] = []


@router.post("/chat")
def chat(body: ChatRequest):
    # Reconstruire l'historique
    historique = [SystemMessage(content=SYSTEM_PROMPT)]

    for msg in body.history:
        if msg.role == "user":
            historique.append(HumanMessage(content=msg.content))
        else:
            historique.append(HumanMessage(content=msg.content))  # simplifié

    historique.append(HumanMessage(content=body.message))

    # Boucle agentic
    while True:
        response = llm_with_tools.invoke(historique)
        historique.append(response)

        if not response.tool_calls:
            break

        for tool_call in response.tool_calls:
            tool_fn = TOOLS_MAP.get(tool_call["name"])
            if tool_fn is None:
                resultat = {"erreur": f"Tool inconnu : {tool_call['name']}"}
            else:
                resultat = tool_fn.invoke(tool_call["args"])

            historique.append(
                ToolMessage(
                    content=json.dumps(resultat, ensure_ascii=False, default=str),
                    tool_call_id=tool_call["id"],
                )
            )

    texte = response.content
    if isinstance(texte, list):
        texte = " ".join([b["text"] for b in texte if isinstance(b, dict) and "text" in b])

    return {"response": texte}