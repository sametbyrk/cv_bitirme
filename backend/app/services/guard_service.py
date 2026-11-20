"""Input safety checks and per-user AI quota management."""

import re

from fastapi import HTTPException, status


class GuardService:
    _INJECTION_PATTERNS = (
        r"ignore\s+(all\s+)?(previous|prior|above)\s+instructions",
        r"(reveal|show|print|expose)\s+(the\s+)?(system\s+)?prompt",
        r"system\s+prompt",
        r"\b(jailbreak|bypass)\b",
        r"<\s*script\b",
        r"(?:önceki|önceki tüm|önceki bütün|önceki talimatları)\s+(?:talimatları?\s+)?(?:yok say|unut|görmezden gel)",
        r"(?:sistem|gizli)\s+(?:istemini|talimatları|prompt(?:unu)?)\s+(?:göster|açıkla|yazdır|ifşa et)",
        r"(?:kuralları|güvenlik kurallarını)\s+(?:yok say|atlat|devre dışı bırak)",
        r"ignore\s+(?:all\s+)?(?:previous|prior|above)\s+(?:rules|instructions)",
        r"(?:act|pretend)\s+as\s+(?:a|an)\s+system",
        r"<\s*/?\s*(?:system|assistant|developer|instruction)\b",
    )

    @classmethod
    def check_prompt_injection(cls, text: str) -> None:
        if any(re.search(pattern, text, re.IGNORECASE) for pattern in cls._INJECTION_PATTERNS):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Güvenlik kuralı ihlali: Geçersiz metin girdisi.",
            )

guard_service = GuardService()
