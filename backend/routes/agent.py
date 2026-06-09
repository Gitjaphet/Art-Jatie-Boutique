import json
import os
import time
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
from langchain_core.messages import HumanMessage, SystemMessage, ToolMessage
import logging

from ai.agent import llm_with_tools, TOOLS_MAP, SYSTEM_PROMPT

router = APIRouter()

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[Message]] = []

@router.post("/chat")
def chat(body: ChatRequest):
    t0 = time.time()
    logging.info(f"[AGENT] ── Début requête : '{body.message}'")

    # Reconstruire l'historique
    historique = [SystemMessage(content=SYSTEM_PROMPT)]
    for msg in body.history:
        historique.append(HumanMessage(content=msg.content))
    historique.append(HumanMessage(content=body.message))

    logging.info(f"[AGENT] Historique construit — {len(historique)} messages — {time.time()-t0:.2f}s")

    tour = 0
    while True:
        tour += 1
        t_llm = time.time()
        logging.info(f"[AGENT] Tour {tour} — Appel LLM...")
        response = llm_with_tools.invoke(historique)
        logging.info(f"[AGENT] Tour {tour} — LLM répondu en {time.time()-t_llm:.2f}s")
        historique.append(response)

        if not response.tool_calls:
            logging.info(f"[AGENT] Pas de tool call — fin boucle")
            break

        for tool_call in response.tool_calls:
            t_tool = time.time()
            tool_name = tool_call["name"]
            tool_args = tool_call["args"]
            logging.info(f"[AGENT] Tool : {tool_name} | Args : {tool_args}")

            tool_fn = TOOLS_MAP.get(tool_name)
            if tool_fn is None:
                resultat = {"erreur": f"Tool inconnu : {tool_name}"}
            else:
                try:
                    resultat = tool_fn.invoke(tool_args)
                except Exception as e:
                    resultat = {"erreur": str(e)}

            logging.info(f"[AGENT] Tool {tool_name} exécuté en {time.time()-t_tool:.2f}s")

            historique.append(
                ToolMessage(
                    content=json.dumps(resultat, ensure_ascii=False, default=str),
                    tool_call_id=tool_call["id"],
                )
            )

    texte = response.content
    if isinstance(texte, list):
        texte = " ".join([b["text"] for b in texte if isinstance(b, dict) and "text" in b])

    logging.info(f"[AGENT] ── Total requête : {time.time()-t0:.2f}s")
    return {"response": texte}