// 이 파일만 수정하면 사이트의 프롬프트 목록이 바뀝니다.
// 새 프롬프트를 추가하려면 아래 배열에 객체 하나를 더 넣으세요.
//
//  {
//    id: 고유한 숫자 또는 문자열,
//    title: '카드에 표시될 제목',
//    category: '카테고리 (필터 칩으로 자동 생성됩니다)',
//    tags: ['검색에 잡히는', '키워드들'],
//    model: '추천 모델 (선택)',
//    description: '이 프롬프트가 무엇을 하는지 한두 줄 설명',
//    prompt: `실제 프롬프트 전문. 백틱(``)을 쓰면 여러 줄로 작성할 수 있어요.`,
//  }

export const prompts = [
  {
    id: 1,
    title: '블로그 글 초안 작성기',
    category: '글쓰기',
    tags: ['블로그', '콘텐츠', '마케팅'],
    model: 'GPT-4 / Claude',
    description: '주제와 톤만 정해주면 구조가 잡힌 블로그 글 초안을 만들어 줍니다.',
    prompt: `당신은 숙련된 콘텐츠 마케터입니다.
주제: {주제}
타깃 독자: {독자}
톤앤매너: {톤}

위 정보를 바탕으로 다음을 작성하세요.
1. 클릭을 부르는 제목 3개
2. 도입부(3~4문장)
3. 본문 소제목 5개와 각 핵심 내용
4. 마무리 + 행동 유도 문장(CTA)`,
  },
  {
    id: 2,
    title: '코드 리뷰 도우미',
    category: '개발',
    tags: ['코드리뷰', '리팩터링', '버그'],
    model: 'Claude / GPT-4',
    description: '코드를 붙여넣으면 버그, 가독성, 성능 관점에서 리뷰해 줍니다.',
    prompt: `다음 코드를 시니어 개발자의 관점에서 리뷰해 주세요.

\`\`\`
{코드}
\`\`\`

리뷰 항목:
- 잠재적 버그와 엣지 케이스
- 가독성/네이밍 개선점
- 성능 또는 보안 이슈
- 구체적인 수정 코드 제안

각 항목은 우선순위(높음/중간/낮음)와 함께 알려주세요.`,
  },
  {
    id: 3,
    title: '이미지 생성 프롬프트 빌더',
    category: '이미지',
    tags: ['미드저니', 'SD', '아트'],
    model: 'Midjourney / SDXL',
    description: '원하는 장면을 설명하면 디테일한 영문 이미지 프롬프트로 변환합니다.',
    prompt: `Convert the following idea into a detailed image-generation prompt.

Idea: {장면 설명}

Output format:
- Subject & action
- Environment & lighting
- Art style & mood
- Camera/lens details
- Quality boosters (e.g. highly detailed, 8k)

Return one final comma-separated prompt line.`,
  },
  {
    id: 4,
    title: '회의록 요약 & 액션아이템 추출',
    category: '업무',
    tags: ['요약', '회의', '생산성'],
    model: 'Claude / GPT-4',
    description: '긴 회의 내용을 핵심 요약과 할 일 목록으로 정리합니다.',
    prompt: `아래 회의 내용을 정리해 주세요.

{회의 내용}

출력:
1. 핵심 요약 (3줄)
2. 결정 사항
3. 액션 아이템 (담당자 / 마감일 형태로)
4. 다음 회의에서 논의할 사항`,
  },
  {
    id: 5,
    title: '영어 이메일 다듬기',
    category: '글쓰기',
    tags: ['영어', '이메일', '번역'],
    model: 'GPT-4 / Claude',
    description: '한국어 문장을 자연스럽고 정중한 비즈니스 영어 이메일로 바꿔 줍니다.',
    prompt: `다음 내용을 정중하고 자연스러운 비즈니스 영어 이메일로 바꿔 주세요.

상황: {상황}
전달할 내용: {내용}
원하는 톤: {정중함/친근함 등}

제목과 본문을 함께 작성하고, 너무 격식적이지 않게 해주세요.`,
  },
  {
    id: 6,
    title: '학습 도우미 (소크라테스식)',
    category: '학습',
    tags: ['공부', '튜터', '설명'],
    model: 'Claude / GPT-4',
    description: '정답을 바로 주지 않고 질문을 통해 스스로 이해하도록 이끌어 줍니다.',
    prompt: `당신은 소크라테스식으로 가르치는 튜터입니다.
제가 배우고 싶은 주제: {주제}

규칙:
- 답을 바로 알려주지 말 것
- 한 번에 하나의 질문만 던질 것
- 제 답변 수준에 맞춰 난이도를 조절할 것
- 제가 막히면 작은 힌트를 줄 것

첫 번째 질문으로 시작해 주세요.`,
  },
]
