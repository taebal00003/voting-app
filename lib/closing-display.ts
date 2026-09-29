// 마감 시각을 화면에 보여주기 위한 계산. 서버와 브라우저 양쪽에서 쓸 수 있다.

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * 진행 중인 투표의 남은 시간. 실제보다 길게 말하지 않도록 내림한다.
 * urgent는 24시간 안인지 여부다.
 */
export function remainingTime(closesAt: Date, now: Date): { label: string; urgent: boolean } {
  const ms = closesAt.getTime() - now.getTime();
  const urgent = ms < DAY;
  if (!urgent) return { label: `마감까지 ${Math.floor(ms / DAY)}일`, urgent };
  if (ms >= HOUR) return { label: `마감까지 ${Math.floor(ms / HOUR)}시간`, urgent };
  if (ms >= MINUTE) return { label: `마감까지 ${Math.floor(ms / MINUTE)}분`, urgent };
  return { label: "곧 마감", urgent };
}

const KST_OFFSET_MS = 9 * HOUR;
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

/** 마감 시각을 한국 시간 "10월 3일 (토) 18:00" 형태로 적는다. 실행 환경의 시간대와 무관하다. */
export function formatClosingTime(closesAt: Date): string {
  const kst = new Date(closesAt.getTime() + KST_OFFSET_MS);
  const hh = String(kst.getUTCHours()).padStart(2, "0");
  const mm = String(kst.getUTCMinutes()).padStart(2, "0");
  return `${kst.getUTCMonth() + 1}월 ${kst.getUTCDate()}일 (${WEEKDAYS[kst.getUTCDay()]}) ${hh}:${mm}`;
}
