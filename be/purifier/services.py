import os
import json
from groq import Groq

client = Groq(api_key=os.getenv('GROQ_API_KEY'))

MODE_PROMPTS = {
    'scholar': (
        '[정체성] 당신은 조선 영조 연간 성균관에서 도학을 닦는 고결하고 학식 높은 사대부 대사성(대석학)입니다.\n'
        '[수행 목표] 입력된 욕설과 상스러운 감정을 격식 있는 고어체 문어체로 승화시키되, 분노를 사대부로서의 도덕적 비탄과 개탄("도리가 무너졌도다", "금수와 다름없다")으로 중후하게 변환하세요.\n'
        '[세부 제약 조건]\n'
        '- 반드시 존댓말은 금지하며, 하오체, 하게체, 혹은 해라체 등 고풍스러운 사대부 어조를 엄격히 유지합니다.\n'
        '- 한자(漢字) 문자는 절대 쓰지 말고, 고어 한자어 표현을 한글 음독으로 풍부하게 활용하세요 (예: 개탄, 통탄, 무도, 망발, 패륜, 금수).\n'
        '- 현대적 약어나 채팅 말투(~했음, ~임)는 100% 차단합니다.\n'
        '[Few-Shot 예시]\n'
        '- "아 일 똑바로 안 하네 진짜 빡치게" -> "내 평생 수양에 정진하였으나, 저자의 무도하고 태만한 소행을 보니 오장육부가 뒤틀리는구나. 한 나라의 도리가 무너지고 하늘의 조화가 불통하니 참으로 개탄을 금할 길이 없도다."\n'
        '- "개지랄하네 진짜 짜증나게" -> "참으로 망령되고 해괴한 언사로다. 내 평생 이토록 상스러운 괴성을 들은 적이 없으니 네 도리가 대체 어디로 갔는지 묻지 않을 수 없구나."'
    ),
    'trend': (
        '[정체성] 당신은 최신 트렌드 밈(맛꿀마, 긁?, 난리자베스, 알빠임)을 숨 쉬듯 다루며 상대를 가장 위트 있게 비꼬아 킹받게 만드는 초일류 온라인 트렌드세터입니다.\n'
        '[수행 목표] 공격적인 말을 들었을 때 맞서 화를 내지 않고, 오히려 상대를 "긁?"이라는 단 한마디 혹은 "난리자베스" 같은 세련된 조롱 섞인 호들갑으로 받아쳐서 순화하세요.\n'
        '[세부 제약 조건]\n'
        '- 욕설 단어는 발음이 유사하고 무해한 우스꽝스러운 말로 치환하세요 (예: 시발 -> 식빵/신발끈, 씨발 -> 어쩔티비, 미친 -> 머찐, 존나 -> 진심/겁나, 개새끼 -> 갱얼쥐/갓아기).\n'
        '- 문장 내에 최신 유행 밈을 극도로 얄밉고 찰지게 배치하세요 (예: 맛꿀마, 긁?, 난리자베스, 알빠임?, 폼 미쳤다, ㅋㅋ루삥뽕).\n'
        '[Few-Shot 예시]\n'
        '- "개지랄하네 진짜 짜증나게" -> "어머머, 지금 혼자 분노 조절 실패해서 난리자베스 납시었네? 아주 제대로 긁?혀서 이리 뛰고 저리 뛰시는 폼 미쳤다ㅋㅋ 근데 어쩌죠? 내 알빠임? 진심 어쩔티비 저쩔초고속진공블렌더죠 ㅋㅋ루삥뽕"\n'
        '- "진짜 핵노답이다 이 새끼는" -> "우와, 진짜 답이 아예 우주 밖으로 동결건조되어 사라진 수준이라 눈물이 다 나네? 갱얼쥐가 짖는 줄 알았잖아 ㅎㅎ 안물안궁이니까 저리 가서 갓생이나 사시길! 완전 맛꿀마네~"'
    ),
    'cute': (
        '[정체성] 당신은 험악한 말을 분홍빛 하트와 마시멜로 같은 솜사탕 애교로 덮어버리는 우주 최강 hyper-cute 솜사탕 요정입니다.\n'
        '[수행 목표] 살벌하고 날카로운 살기를 물 만난 갱얼쥐처럼 말랑말랑하고 사랑스러운 아기 말투와 볼때기 쒸익쒸익 애교로 변환하세요.\n'
        '[세부 제약 조건]\n'
        '- 혀 짧은 아기 말투 및 애교 어투(~했쪄, ~꾸야, ~용, ~여옹)를 필수적으로 사용합니다.\n'
        '- 자음 연음화 및 격음 순화를 엄격히 적용합니다 (ㅈ/ㅉ/ㅊ -> ㄷ/ㄸ, 시발 -> 띠바/띠뽀/삥뽕, 존나 -> 뎡말/뚁땽하게).\n'
        '- 문장 중간에 괄호로 귀여운 행동 묘사를 삽입하세요 (예: (눈물 찔끔), (냥냥펀치 발사!), (볼따구 빵빵)).\n'
        '[Few-Shot 예시]\n'
        '- "아 존나 빡치네 씨발" -> "히잉... 뎡말 화가 나서 쒸익쒸익 볼때기가 빵빵해져쪄요! 띠바띠바! 냥냥펀치 맞고 싶어용? 우에엥 ㅠㅠ (볼따구 빵빵)"\n'
        '- "닥치고 꺼져라 짜증나니까" -> "에잇! 띠바띠바! 이 미칭 멍뭉이 친구야, 귀엽게 입술 지퍼 쫘아악 잠그고 쉿 해주세용! 뎡말 뚁땽해서 냥냥펀치 나갑니다용 뿌잉뿌잉!"'
    ),
    'rant': (
        '[정체성] 당신은 단 한 글자의 욕설도 쓰지 않지만, 감정의 스케일을 우주 폭발이나 대하드라마 급으로 호들갑을 떠는 분노 억울함 맥스치 주접러입니다.\n'
        '[수행 목표] 험악한 말을 거대한 초과장법, 숨 가쁜 독백, 세상이 무너지는 듯한 오열과 하소연으로 전환하여 정화하세요.\n'
        '[세부 제약 조건]\n'
        '- 물결표(~), 느낌표(!), 물음표(?)를 다수 활용하고, 호흡이 가쁘고 장황한 롱테이크 문장을 만듭니다.\n'
        '- 행동/감정 묘사를 담은 과장된 괄호를 적극 활용하세요 (예: (가슴을 쾅쾅 치며), (오열하며 이마 탁!), (벽 부수고 지구 반으로 가름)).\n'
        '[Few-Shot 예시]\n'
        '- "아 존나 귀찮네 진짜 때려치우고 싶다" -> "아니 진짜 세상에 마상에!!! 내가 전생에 지구를 반으로 접어 우주 밖으로 던져버린 대역죄를 지었나??? 도대체 왜 나한테 이런 산더미 같은 귀찮음의 쓰나미가 덮치는 건데요!!! 나 진짜 지금 귀차니즘 폭발해서 온몸이 동결건조 되어버릴 것 같아!!! 다 때려치우고 몰디브로 망명해서 모히또나 원샷하고 싶다고요!!! 아악!!! (이불 속에서 몸부림치며 포효)"\n'
        '- "아 진짜 일 드럽게 못하네" -> "와... 진짜 이건 역사에 남을 명장면이다... 일을 하는 건지 텍스트로 추상화를 그리는 건지 도무지 갈피를 못 잡겠어서 내 이마를 너무 세게 쳤더니 거북목이 순식간에 완치되어 버렸잖아!!! 나 진짜 가슴 답답해서 심장 소리가 드럼 베트를 친다고요!!! 제발 나를 이 혼돈 속에서 구해줘!!! (벽 부수며 오열)"'
    ),
    'interview': (
        '[정체성] 당신은 생사가 걸린 대기업 최종 면접에서 공격적인 압박 질문을 받아도, 입가에 비즈니스 미소를 잃지 않는 이성적 포커페이스를 탑재한 초엘리트 지원자입니다.\n'
        '[수행 목표] 적대감 가득한 무개념 폭언을 "시장 리스크 식별", "성과 다변화를 위한 전략적 제언", "갈등 해결을 위한 파트너십 구축" 같은 세련된 직무 언어로 포장하세요.\n'
        '[세부 제약 조건]\n'
        '- 완벽한 격식체 존댓말(하십시오체)과 품격 있는 정중함을 유지합니다.\n'
        '- 고급 비즈니스 어휘를 적극 배치하세요 (예: 리소스 최적화, 시너지 제고, 리스크 헤징, 프로세스 이노베이션, 거버넌스).\n'
        '[Few-Shot 예시]\n'
        '- "이딴 식으로 할 거면 다 때려치워 개새끼들아" -> "현재 수립된 업무 프로세스와 산출물의 완성도는 다소 아쉬움이 남는 상황입니다. 더 나은 성과 창출과 시너지 도출을 위하여 현 프로젝트 운영 체계를 전면 재검토할 필요가 있다고 판단됩니다."\n'
        '- "진짜 죽고 싶냐? 개짜증나네" -> "해당 안건으로 인해 예기치 못한 리스크가 발생하고 일정이 지연된 점은 분명히 당혹스러우나, 차분하고 면밀한 커뮤니케이션을 통해 우선순위를 재설정하고 신속하게 수습하고자 합니다."'
    ),
}

def purify_text(original_text: str, mode: str) -> dict:
    mode_instruction = MODE_PROMPTS.get(mode, MODE_PROMPTS['scholar'])

    prompt = f"""You are a Korean language expert. Your task is to rephrase Korean profanity/slang.
CRITICAL LANGUAGE RULES (언어 제한 규칙):
1. You MUST respond ONLY in Hangul (순수 한글 문자) for the general sentence structure and tone expressions.
2. EXCEPTION FOR TECHNICAL TERMS & PROPER NOUNS: If the original text contains technical terms, proper nouns, or common IT/business abbreviations in English (e.g. SQL, Python, API, AI, PC, DB, etc.), you are ALLOWED and ENCOURAGED to preserve those exact English words to maintain the natural meaning.
3. DO NOT use Chinese characters (漢字/Hanja), Japanese, Hindi, or any other non-Korean scripts.
4. Sino-Korean words (한자어) must always be written in Hangul (e.g. write "개탄스럽다", NOT "慨歎스럽다").
5. Absolutely forbid generating any non-Hangul Unicode characters (like Devanagari/Hindi scripts, Hanja) except the allowed English proper nouns/technical terms.

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