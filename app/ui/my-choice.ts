// "내 선택"은 투표한 브라우저에만 남는다. 서버는 누가 무엇을 골랐는지 모른다 (docs/adr/0002).
const key = (pollId: string) => `my-choice:${pollId}`;

export function saveMyChoice(pollId: string, optionId: string): void {
  try {
    localStorage.setItem(key(pollId), optionId);
  } catch {
    // 저장소를 쓸 수 없는 브라우저에서는 "내 선택" 표시만 빠진다.
  }
}

export function readMyChoice(pollId: string): string | null {
  try {
    return localStorage.getItem(key(pollId));
  } catch {
    return null;
  }
}
