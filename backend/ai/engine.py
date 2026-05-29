# ai/engine.py
from ai.prompts import JATIE_SYSTEM_PROMPT

def générer_réponse_agent(message_client: str) -> str:
    """
    Moteur de l'IA. Prend le message du client et retourne la réponse de l'agent.
    Pour l'instant, c'est une simulation pour valider l'architecture.
    """
    # Ici, plus tard, on connectera LangChain, notre LLM et notre RAG.
    # On pourra lire JATIE_SYSTEM_PROMPT pour guider l'IA.
    
    print(f"[IA Engine] Analyse du message client : '{message_client}'")
    print(f"[IA Engine] Instructions système utilisées : {JATIE_SYSTEM_PROMPT[:50]}...")
    
    # Simulation d'une réponse de Jatie
    réponse_simulée = f"Bonjour ! J'ai bien reçu votre message : '{message_client}'. Je suis Jatie, l'assistante d'Art Jatie. Je simule une réponse en attendant que mon développeur me connecte à mon vrai cerveau LLM ! 🇲🇬"
    
    return réponse_simulée