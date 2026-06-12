# ai/core/prompts.py
"""Chargement unique des prompts depuis ai/prompts/*.txt"""
from pathlib import Path

_PROMPTS_DIR = Path(__file__).parent.parent / "prompts"

def _load(filename: str) -> str:
    return (_PROMPTS_DIR / filename).read_text(encoding="utf-8").strip()

CLASSIFIER  = _load("classifier.txt")
ROUTER      = _load("router.txt")
REFORMULATOR = _load("reformulator.txt")
ORDER_COLLECT = _load("order_collect.txt")
ORDER_CONFIRM = _load("order_confirm.txt")
FAQ         = _load("faq.txt")