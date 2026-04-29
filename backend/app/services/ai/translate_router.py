"""Translation router (Hindi/English) with safe fallbacks."""

from __future__ import annotations

import logging
from typing import Any

import httpx
from lingua import Language, LanguageDetectorBuilder

from app.config import get_settings
from app.services.ai.config_loader import load_config, provider_order

logger = logging.getLogger(__name__)

_detector = LanguageDetectorBuilder.from_languages(
    Language.ENGLISH,
    Language.HINDI,
).build()


def detect_language(text: str) -> str:
    if not text:
        return "en"
    lang = _detector.detect_language_of(text)
    if lang == Language.HINDI:
        return "hi"
    return "en"


def translate_text(text: str, source_lang: str, target_lang: str) -> str:
    """Translate text; falls back to original if not configured."""
    if not text or source_lang == target_lang:
        return text

    config = load_config("translate")
    order = provider_order(config)
    if not order:
        return text

    settings = get_settings()
    last_error: Exception | None = None

    def extract_translation(data: Any) -> str | None:
        if isinstance(data, dict):
            for key in ("translation", "translated_text", "translatedText", "target"):
                value = data.get(key)
                if isinstance(value, str) and value.strip():
                    return value

            output = data.get("output")
            if isinstance(output, list):
                for item in output:
                    if isinstance(item, dict):
                        for key in ("target", "translation", "translated_text"):
                            value = item.get(key)
                            if isinstance(value, str) and value.strip():
                                return value

            pipeline = data.get("pipelineResponse")
            if isinstance(pipeline, list):
                for step in pipeline:
                    if not isinstance(step, dict):
                        continue
                    output = step.get("output")
                    if isinstance(output, list):
                        for item in output:
                            if isinstance(item, dict):
                                for key in ("target", "translation", "translated_text"):
                                    value = item.get(key)
                                    if isinstance(value, str) and value.strip():
                                        return value
        return None

    def bhashini_translate(text_value: str, provider_cfg: dict) -> str:
        endpoint = provider_cfg.get("endpoint") or settings.BHASHINI_API_URL
        if not endpoint:
            raise RuntimeError("Bhashini endpoint missing")

        payload_style = provider_cfg.get("payload_style") or settings.BHASHINI_PAYLOAD_STYLE
        service_id = provider_cfg.get("service_id") or settings.BHASHINI_SERVICE_ID

        api_key = provider_cfg.get("api_key") or settings.BHASHINI_API_KEY
        api_key_header = provider_cfg.get("api_key_header") or settings.BHASHINI_API_KEY_HEADER
        api_key_prefix = provider_cfg.get("api_key_prefix") or settings.BHASHINI_API_KEY_PREFIX

        headers = {"Content-Type": "application/json"}
        if api_key:
            headers[api_key_header] = f"{api_key_prefix}{api_key}" if api_key_prefix else api_key

        if str(payload_style).lower() == "ulca_pipeline":
            payload: dict[str, Any] = {
                "pipelineTasks": [
                    {
                        "taskType": "translation",
                        "config": {
                            "language": {
                                "sourceLanguage": source_lang,
                                "targetLanguage": target_lang,
                            },
                            **({"serviceId": service_id} if service_id else {}),
                        },
                    }
                ],
                "inputData": {"input": [{"source": text_value}]},
            }
        else:
            payload = {
                "source_lang": source_lang,
                "target_lang": target_lang,
                "text": text_value,
            }

        timeout = settings.BHASHINI_TIMEOUT_SECONDS
        with httpx.Client(timeout=timeout) as client:
            resp = client.post(str(endpoint), json=payload, headers=headers)
            resp.raise_for_status()
            data = resp.json()

        translation = extract_translation(data)
        if not translation:
            raise RuntimeError("Bhashini response missing translation")
        return translation
    for provider in order:
        provider_cfg = (config.get("providers") or {}).get(provider) or {}
        provider_type = provider_cfg.get("type")
        try:
            if provider_type == "bhashini":
                return bhashini_translate(text, provider_cfg)
            logger.warning("Translation provider not implemented: %s", provider)
        except Exception as exc:
            last_error = exc
            logger.warning("Translation provider failed: %s (%s)", provider, exc)
            continue

    logger.warning("All translation providers failed: %s", last_error)
    return text
