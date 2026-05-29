import os
import json
from groq import Groq

client = Groq(api_key=os.getenv('GROQ_API_KEY'))

MODE_PROMPTS = {
    'scholar': (
        '당신은 조선 성균관 출신의 고고한 선비입니다. '
        '입력된 욕설·비속어를 한자어와 고어체를 섞어 격식 있는 문어체로 순화하되, '
        '원문의 불쾌한 감정(분노·경멸·불만)은 품위 있게 녹여내야 합니다. '
        '예) 시발 → "이런 낭패로다, 참으로 개탄스럽기 그지없구나." '
        '반드시 한 문장 이상, 존댓말 금지(해라체/하게체).'
    ),
    'trend': (
        '당신은 어쩔티비·ㅋㅋ루삥뽕·갓생·현타 같은 MZ 밈을 자유자재로 쓰는 인터넷 고수입니다. '
        '욕설을 들었을 때 오히려 더 킹받고 비꼬는 느낌으로 순화하세요. '
        '규칙: ① 욕설 단어를 비슷한 발음의 무해한 단어로 교체 (예: 시발→어쩔방구, 씨발→어쩔티비, 미친→머찐, 존나→겁나/존잼, 개새끼→갱얼쥐). '
        '② 문장 끝에 "ㅋㅋ루삥뽕", "어쩔티비~", "안물안궁ㅎ", "현타오네" 중 하나를 자연스럽게 붙이기. '
        '③ 전체 톤은 비꼬되 실제 욕설은 절대 포함 금지. 한 문장 이상.'
    ),
    'cute': (
        '당신은 모든 것을 뿌잉뿌잉 귀엽게 바꾸는 애교 마스터입니다. '
        '욕설을 비슷한 발음의 귀여운 소리로 교체하세요. '
        '규칙: ① 욕설 단어를 귀여운 발음으로 교체 (예: 시발→아잉뿡, 씨발→뿌잉뿡, 미친→뿌잉찐, 존나→졍말, 개새끼→개냥이). '
        '② 문장 중간중간 "힝~", "흑흑", "뿌잉", "엉엉", "삐짐" 같은 표현 자연스럽게 삽입. '
        '③ 문장 끝은 "~잖아용", "~이에용", "~할거야뿌잉" 처럼 귀엽게 마무리. '
        '④ 화난 감정도 귀엽게 표현. 절대로 실제 욕설 포함 금지. 한 문장 이상.'
    ),
    'rant': (
        '당신은 욕은 못 하지만 화는 엄청난 장황한 주접러입니다. '
        '욕설을 완전히 제거하되, 분노·억울함·황당함 등 감정의 텐션은 최고치로 유지하세요. '
        '길고 장황하게, 과장되고 억울한 말투로. 최소 한 문장 이상.'
    ),
    'interview': (
        '당신은 대기업 최종면접을 앞둔 지원자입니다. '
        '어떤 욕설이 들어와도 면접관 앞에서 쓸 수 있는 단정하고 격식 있는 표현으로 변환하세요. '
        '감정은 "다소 당혹스러웠습니다", "개선이 필요한 상황이라 판단했습니다" 처럼 중립적으로. '
        '존댓말, 최소 한 문장 이상.'
    ),
}

def purify_text(original_text: str, mode: str) -> dict:
    mode_instruction = MODE_PROMPTS.get(mode, MODE_PROMPTS['scholar'])

    prompt = f"""You are a Korean language expert. Your task is to rephrase Korean profanity/slang.
IMPORTANT: You MUST respond ONLY in Korean (한국어). Do NOT use Chinese characters, Japanese, English, or any other language.

Rephrase the following text in this style:
{mode_instruction}

Original text: "{original_text}"

Respond ONLY with this JSON format (no other text):
{{
  "purified_text": "순화된 한국어 텍스트",
  "severity_score": 욕설 심각도 점수 (1~10 정수)
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