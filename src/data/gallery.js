// 갤러리 작품 목록. 직접 만든 AI 이미지/영상을 여기에 추가하세요.
//
// 1) 미디어 파일을  public/gallery/  폴더에 넣습니다. (예: public/gallery/my-image.jpg)
// 2) 아래 배열에 항목을 추가합니다:
//
//  {
//    no: 1001,                         // 작품 번호 (고유)
//    title: '작품 제목',
//    categories: ['인물/화보'],         // 필터에 쓰이는 카테고리 (여러 개 가능)
//    templateId: 'portrait-basic',      // (선택) 생성기 템플릿과 연결 → "이 패턴 작품 보기"
//    prompt: '이 작품을 만든 프롬프트 전문',
//    createdAt: '2026-05-27',           // 정렬(최신순)에 사용
//    media: [                           // 첫 번째가 표지. 이미지/영상 혼합 가능
//      { type: 'image', src: './gallery/my-image.jpg' },
//      { type: 'video', src: './gallery/my-clip.mp4' },
//    ],
//  }
//
// 경로는 './gallery/파일명' 형태(상대경로)로 쓰면 어디에 배포해도 동작합니다.

export const works = [
  {
    no: 1593,
    title: '누가 깨뜨렸죠?',
    categories: ['인물/화보', '캐릭터/코스프레'],
    templateId: 'portrait-basic',
    prompt:
      'Ultra-realistic vertical editorial portrait of a beautiful adult woman in a classic maid outfit, kneeling on a wooden floor surrounded by broken porcelain, warm interior lighting, cinematic and dramatic mood.',
    createdAt: '2026-05-26',
    media: [
      { type: 'image', src: './gallery/sample-1.svg' },
      { type: 'image', src: './gallery/sample-3.svg' },
    ],
  },
  {
    no: 1591,
    title: '따뜻한 햇살',
    categories: ['인물/화보'],
    templateId: 'beauty-closeup',
    prompt:
      'A young woman with long black hair tied with a red ribbon, sitting gracefully by a sunlit window, soft natural light, cozy interior, serene and warm atmosphere.',
    createdAt: '2026-05-24',
    media: [
      { type: 'image', src: './gallery/sample-4.svg' },
      { type: 'image', src: './gallery/sample-2.svg' },
      { type: 'image', src: './gallery/sample-1.svg' },
    ],
  },
  {
    no: 1589,
    title: '메이드 컨셉',
    categories: ['인물/화보', '캐릭터/코스프레'],
    templateId: 'fashion-editorial',
    prompt:
      'A young woman sits gracefully on a white bed in a warm, sunlit room, wearing a detailed black-and-white maid costume, soft window light, elegant and delicate mood.',
    createdAt: '2026-05-22',
    media: [{ type: 'image', src: './gallery/sample-2.svg' }],
  },
  {
    no: 1582,
    title: '골든 아워 풍경',
    categories: ['풍경'],
    templateId: 'cinematic-landscape',
    prompt:
      'A cinematic golden hour landscape of a snow-capped mountain range with rolling fog, a lone tree in the foreground, shot on anamorphic lens, teal and orange grade, epic and atmospheric.',
    createdAt: '2026-05-18',
    media: [
      { type: 'image', src: './gallery/sample-3.svg' },
      { type: 'image', src: './gallery/sample-4.svg' },
    ],
  },
]
