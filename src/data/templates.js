// 프롬프트 템플릿 목록.
// 새 템플릿을 추가하려면 아래 배열에 객체를 하나 더 넣으세요.
//
//  {
//    id: '고유-id',                 // 갤러리 연결에 사용됩니다
//    title: '카드 제목',
//    level: '초급' | '중급' | '고급',
//    description: '이 패턴이 무엇을 하는지 설명',
//    template: '{VARIABLE} 를 포함한 프롬프트 원문',
//    variables: { VARIABLE: ['예시1', '예시2', ...] }  // 랜덤 채우기에 사용
//  }

export const templates = [
  {
    id: 'portrait-basic',
    title: '기본 인물 포트레이트',
    level: '초급',
    description:
      '자연스러운 인물 사진을 위한 기본 구조. 주체, 의상, 배경, 조명 순서로 구성합니다.',
    template:
      '{SHOT_TYPE} portrait of a {AGE}-year-old {NATIONALITY} woman with {HAIR_DESCRIPTION}, wearing {OUTFIT_DESCRIPTION}. {BACKGROUND_DESCRIPTION}. {LIGHTING_DESCRIPTION}, {MOOD_KEYWORDS}.',
    variables: {
      SHOT_TYPE: ['close-up', 'medium shot', 'full body shot', 'headshot'],
      AGE: ['20', '25', '28', '32'],
      NATIONALITY: ['Korean', 'Japanese', 'French', 'Scandinavian'],
      HAIR_DESCRIPTION: [
        'long wavy black hair',
        'a short bob cut',
        'a tied-up ponytail',
        'soft brown curls',
      ],
      OUTFIT_DESCRIPTION: [
        'a beige trench coat',
        'a white linen dress',
        'a casual denim jacket',
        'a knitted sweater',
      ],
      BACKGROUND_DESCRIPTION: [
        'A quiet city street at golden hour',
        'A minimalist studio backdrop',
        'A blooming spring garden',
        'A cozy cafe interior',
      ],
      LIGHTING_DESCRIPTION: [
        'soft natural light',
        'cinematic rim lighting',
        'warm sunset glow',
        'gentle window light',
      ],
      MOOD_KEYWORDS: [
        'serene and elegant',
        'bright and cheerful',
        'moody and dramatic',
        'warm and intimate',
      ],
    },
  },
  {
    id: 'fashion-editorial',
    title: '패션 에디토리얼',
    level: '중급',
    description:
      '하이엔드 패션 매거진 스타일의 프롬프트. 의상 디테일과 포즈를 강조합니다.',
    template:
      'Professional fashion magazine {SHOT_TYPE} of a {SUBJECT_DESCRIPTION}. She wears {DETAILED_OUTFIT}. {POSE_DESCRIPTION}. {BACKGROUND}. Shot with {CAMERA_STYLE}, {LIGHTING}, {COLOR_GRADE}.',
    variables: {
      SHOT_TYPE: ['full body shot', 'three-quarter shot', 'dramatic low-angle shot'],
      SUBJECT_DESCRIPTION: [
        'tall model with sharp features',
        'androgynous model with striking eyes',
        'elegant model with long limbs',
      ],
      DETAILED_OUTFIT: [
        'an avant-garde structured blazer and wide trousers',
        'a flowing silk gown with metallic accents',
        'a leather ensemble with bold geometric cuts',
      ],
      POSE_DESCRIPTION: [
        'Confident pose with one hand on hip',
        'Dynamic walking pose mid-stride',
        'Editorial pose looking over the shoulder',
      ],
      BACKGROUND: [
        'Brutalist concrete architecture',
        'A seamless vibrant color backdrop',
        'An industrial warehouse setting',
      ],
      CAMERA_STYLE: ['85mm lens, shallow depth of field', '50mm prime lens', 'medium format camera'],
      LIGHTING: ['dramatic studio strobe', 'high-key soft lighting', 'hard directional light'],
      COLOR_GRADE: ['muted earthy tones', 'high-contrast monochrome', 'rich saturated colors'],
    },
  },
  {
    id: 'beauty-closeup',
    title: '뷰티 클로즈업',
    level: '중급',
    description: '피부 질감과 메이크업 디테일을 강조하는 극접사 뷰티 샷.',
    template:
      'Extreme close-up beauty shot of a {SUBJECT}. Focus on {MAKEUP_DETAIL} and flawless {SKIN_TEXTURE}. {LIGHTING}. {COLOR_PALETTE}, ultra-detailed, high resolution.',
    variables: {
      SUBJECT: [
        "model's face with freckles",
        'glowing dewy complexion',
        'striking pair of eyes',
      ],
      MAKEUP_DETAIL: [
        'glossy red lips',
        'shimmering gold eyeshadow',
        'sharp winged eyeliner',
        'natural nude makeup',
      ],
      SKIN_TEXTURE: ['radiant skin', 'matte porcelain skin', 'sun-kissed skin'],
      LIGHTING: ['soft beauty dish lighting', 'butterfly lighting', 'iridescent neon glow'],
      COLOR_PALETTE: ['warm peach tones', 'cool pastel palette', 'bold jewel tones'],
    },
  },
  {
    id: 'cinematic-landscape',
    title: '시네마틱 풍경',
    level: '초급',
    description: '영화 한 장면 같은 분위기의 풍경 이미지를 위한 구조.',
    template:
      'A cinematic {TIME_OF_DAY} landscape of {LOCATION}, {WEATHER}. {FOREGROUND_ELEMENT} in the foreground. Shot on {FILM_STYLE}, {COLOR_GRADE}, epic and atmospheric.',
    variables: {
      TIME_OF_DAY: ['golden hour', 'blue hour', 'misty dawn', 'starry night'],
      LOCATION: [
        'a snow-capped mountain range',
        'a vast desert with dunes',
        'a coastal cliff over the ocean',
        'a dense pine forest',
      ],
      WEATHER: ['with rolling fog', 'under dramatic storm clouds', 'on a clear crisp day'],
      FOREGROUND_ELEMENT: ['a lone tree', 'a winding river', 'a small wooden cabin'],
      FILM_STYLE: ['anamorphic lens', '35mm film', 'IMAX format'],
      COLOR_GRADE: ['teal and orange grade', 'desaturated moody tones', 'vivid natural colors'],
    },
  },
  {
    id: 'product-hero',
    title: '제품 광고 컷',
    level: '고급',
    description: '광고에 쓰는 고급 제품 히어로 샷. 재질감과 라이팅을 정교하게 지정합니다.',
    template:
      'Commercial hero shot of {PRODUCT} made of {MATERIAL}, placed on {SURFACE}. {LIGHTING_SETUP}. {BACKGROUND}, {COMPOSITION}, photorealistic, studio quality, 8k.',
    variables: {
      PRODUCT: ['a luxury perfume bottle', 'a sleek smartwatch', 'a glass cosmetic jar', 'premium headphones'],
      MATERIAL: ['brushed aluminum and glass', 'matte ceramic', 'polished chrome', 'frosted acrylic'],
      SURFACE: ['a wet reflective black surface', 'a marble slab', 'floating in mid-air', 'soft draped silk'],
      LIGHTING_SETUP: [
        'soft gradient studio lighting',
        'dramatic single-source spotlight',
        'bright high-key lighting',
      ],
      BACKGROUND: ['a clean gradient backdrop', 'a dark moody background', 'a complementary color sweep'],
      COMPOSITION: ['centered symmetrical composition', 'rule-of-thirds with negative space', 'dynamic diagonal angle'],
    },
  },
]

// 템플릿 문자열에서 {VARIABLE} 들을 순서대로 뽑아냅니다.
export function extractVars(template) {
  const found = []
  const re = /\{([A-Z0-9_]+)\}/g
  let m
  while ((m = re.exec(template))) {
    if (!found.includes(m[1])) found.push(m[1])
  }
  return found
}

// 변수 값으로 템플릿을 채웁니다. 비어 있으면 {VARIABLE} 그대로 둡니다.
export function fillTemplate(template, values) {
  return template.replace(/\{([A-Z0-9_]+)\}/g, (whole, key) => {
    const v = values[key]
    return v && v.trim() ? v.trim() : whole
  })
}
