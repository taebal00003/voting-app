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

/** 한국 시간(UTC+9). 마감 시각 입력 해석과 표시가 함께 쓴다. */
export const KST_OFFSET_MS = 9 * HOUR;
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

/**
 * 마감 시각을 한국 시간 "10월 3일 (토) 18:00" 형태로 적는다. 실행 환경의 시간대와 무관하다.
 * 기준 시각과 한국 날짜로 해가 다르면 "2027년 1월 1일 (금) 00:30"처럼 연도를 붙인다.
 */
export function formatClosingTime(closesAt: Date, now: Date): string {
  const kst = new Date(closesAt.getTime() + KST_OFFSET_MS);
  const nowYear = new Date(now.getTime() + KST_OFFSET_MS).getUTCFullYear();
  const year = kst.getUTCFullYear() === nowYear ? "" : `${kst.getUTCFullYear()}년 `;
  const hh = String(kst.getUTCHours()).padStart(2, "0");
  const mm = String(kst.getUTCMinutes()).padStart(2, "0");
  return `${year}${kst.getUTCMonth() + 1}월 ${kst.getUTCDate()}일 (${WEEKDAYS[kst.getUTCDay()]}) ${hh}:${mm}`;
}

type Closing = { closesAt: Date | null; isClosed: boolean; checkedAt: Date };

export type ClosingState =
  | { kind: "none" }
  | { kind: "closed"; closesAt: Date }
  | { kind: "open"; closesAt: Date; label: string; urgent: boolean };

/**
 * 화면에 보여줄 마감 상태. 마감 여부는 DB 판정(isClosed)을 따르고,
 * 남은 시간도 같은 DB 시각(checkedAt)으로 계산해서 둘이 어긋나지 않게 한다.
 */
export function closingState({ closesAt, isClosed, checkedAt }: Closing): ClosingState {
  if (!closesAt) return { kind: "none" };
  if (isClosed) return { kind: "closed", closesAt };
  return { kind: "open", closesAt, ...remainingTime(closesAt, checkedAt) };
}
