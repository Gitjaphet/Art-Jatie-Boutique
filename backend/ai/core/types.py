# ai/core/types.py
"""Types partagés entre agents et orchestrateur."""
from typing import TypedDict, Union


class ProductDict(TypedDict, total=False):
    id: int
    name: str
    price: int
    stock: int
    couleur: str
    categorie: str
    genre: str
    image: str


class AlternativesResult(TypedDict):
    demande_initiale: list[ProductDict]
    alternatives_en_stock: list[ProductDict]


# Ce que execute_tool retourne et llm3_reformulateur reçoit
ToolResult = Union[list[ProductDict], AlternativesResult, dict]
