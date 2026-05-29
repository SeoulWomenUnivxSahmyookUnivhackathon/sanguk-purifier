import os
import json
from groq import Groq

client = Groq(api_key=os.getenv('GROQ_API_KEY'))

MODE_PROMPTS = {
    'scholar':   '욕설을 완전히 제거하고 조선시대 선비처럼 순화해줘. 예시: "시발" → "이런, 참으로 곤란하구나", "씨발 짜증나" → "허허, 이런 상황이 다시는 없었으면 하는 바람이오"',
    'trend':     '욕설을 MZ 인터넷 밈으로 순화해줘. 예시: "시발" → "어쩔티비 ㅋㅋ", "씨발 짜증나" → "현타온다 진짜 ㄹㅇ 갓생살기 힘들다"',
    'cute':      '욕설을 귀여운 표현으로 순화해줘. 예시: "시발" → "뿌잉뿌잉 속상해~", "씨발 짜증나" → "흑흑 힝 너무해 엉엉 삐졌어"',
    'rant':      '욕은 빼되 화난 텐션은 살려서 주접스럽게 순화해줘. 예시: "시발" → "아 진짜 너무하는 거 아닙니까!!!! 제 마음이 갈기갈기 찢어지는 기분이에요!!!!"',
    'interview': '욕설을 면접용 표현으로 순화해줘. 예시: "시발" → "다소 당황스러운 상황이었습니다만", "씨발 짜증나" → "해당 상황에서 감정 조절의 중요성을 깊이 깨달았습니다"',
}

def purify_text(original_text: str, mode: str) -> dict:
    mode_instruction = MODE_PROMPTS.get(mode, MODE_PROMPTS['scholar'])

    prompt = f"""너는 한국어 욕설/비속어 순화 전문가야.

아래 텍스트를 다음 방식으로 순화해줘:
{mode_instruction}

원본 텍스트: "{original_text}"

반드시 아래 JSON 형식으로만 응답해 (다른 말 금지):
{{
  "purified_text": "순화된 텍스트",
  "severity_score": 욕설 심각도 점수 (1~10 정수, 10이 가장 심함)
}}"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=1000,
    )

    raw = response.choices[0].message.content.strip()
    clean = raw.removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    result = json.loads(clean)
    return result