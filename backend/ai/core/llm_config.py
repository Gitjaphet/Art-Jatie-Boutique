# ai/core/llm_config.py
"""Fournisseurs LLM et chaînes de bascule par rôle (gratuit d'abord, payant en dernier)."""

# Tous ces fournisseurs parlent le même format "chat/completions" (compatible OpenAI).
PROVIDERS = {
    "groq": {
        "url": "https://api.groq.com/openai/v1/chat/completions",
        "key_env": "GROQ_API_KEY",
    },
    "gemini": {
        "url": "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
        "key_env": "GOOGLE_API_KEY",
    },
    "openrouter": {
        "url": "https://openrouter.ai/api/v1/chat/completions",
        "key_env": "OPENROUTER_API_KEY",
        "headers": {"HTTP-Referer": "https://artjatie.com"},
    },
}

# Un maillon = (fournisseur, modèle, paramètres en plus dans la requête).
# "effort: low" limite la réflexion cachée des modèles gpt-oss (moins de tokens, moins de réponses vides).
_GROQ_20B  = ("groq", "openai/gpt-oss-20b", {"reasoning_effort": "low"})
_GROQ_120B = ("groq", "openai/gpt-oss-120b", {"reasoning_effort": "low"})
_GEMINI    = ("gemini", "gemini-3.5-flash-lite", {})
_OR_120B   = ("openrouter", "openai/gpt-oss-120b", {"reasoning": {"effort": "low"}})

# Pour chaque rôle : modèles essayés dans l'ordre, le dernier est le payant garanti.
CHAINES = {
    "classifier":    [_GROQ_20B, _GEMINI, _OR_120B],
    "faq":           [_GROQ_20B, _GEMINI, _OR_120B],
    "router":        [_GROQ_120B, _OR_120B],
    "reformulateur": [_GROQ_120B, _GEMINI, _OR_120B],
    "commande":      [_OR_120B],  # données personnelles : payant uniquement, jamais de palier gratuit
}
