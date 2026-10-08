import { normalizeName } from './rules'

/** 죽 이름에서 재료를 찾을 때 쓰는 자주 쓰는 이유식 재료 이름 */
export const COMMON_INGREDIENTS = [
  // 곡물
  '쌀', '찹쌀', '현미', '오트밀', '귀리', '보리', '수수', '기장', '퀴노아', '밀가루',
  // 고기·생선·달걀
  '소고기', '쇠고기', '한우', '닭고기', '닭안심', '닭가슴살', '돼지고기', '대구', '광어', '가자미', '도미',
  '연어', '흰살생선', '새우', '멸치', '달걀', '노른자', '흰자',
  // 콩
  '두부', '검은콩', '완두콩', '렌틸콩', '병아리콩', '강낭콩', '팥', '콩',
  // 채소
  '양배추', '배추', '알배추', '브로콜리', '콜리플라워', '당근', '감자', '고구마', '단호박', '애호박', '호박',
  '시금치', '청경채', '근대', '케일', '비타민', '양파', '대파', '파', '무', '콜라비', '비트', '오이', '가지',
  '파프리카', '피망', '토마토', '방울토마토', '버섯', '표고버섯', '양송이', '느타리', '팽이버섯', '연근', '우엉',
  '콩나물', '숙주', '아스파라거스', '옥수수', '미역', '김', '부추', '깻잎', '아욱', '비타민채', '적채',
  // 과일·기타
  '사과', '배', '바나나', '아보카도', '블루베리', '딸기', '키위', '자두', '복숭아', '수박', '참외', '귤', '망고',
  '대추', '밤', '잣', '치즈', '아기치즈', '요거트', '우유', '참기름', '들기름', '올리브유',
]

/**
 * 죽 이름(예: 양배추당근감자소고기죽)에서 재료 이름을 찾는다.
 * 앞에서부터 가장 긴 이름을 먼저 맞춰서 '양배추'가 '배'로 잘못 잡히지 않게 한다.
 * extra 에는 아기가 먹어본 재료 등 앱에서 쓰던 이름을 넣는다.
 */
export function ingredientsFromTitle(title: string, extra: string[] = []): string[] {
  const dict = new Map<string, string>()
  for (const name of [...COMMON_INGREDIENTS, ...extra]) {
    const key = normalizeName(name)
    if (key && !dict.has(key)) dict.set(key, name.trim())
  }
  const keys = [...dict.keys()].sort((a, b) => b.length - a.length)
  const text = normalizeName(title).replace(/(죽|미음|진밥|무른밥|리조또)$/, '')
  const found: string[] = []
  let i = 0
  while (i < text.length) {
    const key = keys.find((k) => text.startsWith(k, i))
    if (key) {
      const name = dict.get(key)!
      if (!found.includes(name)) found.push(name)
      i += key.length
    } else i++
  }
  return found
}
