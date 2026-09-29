// 서버와 브라우저 양쪽에서 쓰므로 Node 전용 모듈을 import하지 않는다.
export const LIMITS = {
  titleMax: 100,
  optionLabelMax: 50,
  optionsMin: 2,
  optionsMax: 10,
  voterNameMax: 20,
} as const;

export function normalizeVoterCode(input: string): string {
  return input.toUpperCase().replace(/[\s-]/g, "");
}

export type PollDraft = { title: string; options: string[] };

type Checked<T> = { ok: true; value: T } | { ok: false; error: string };

export function checkPollDraft(
  rawTitle: string,
  rawOptions: string[],
): Checked<PollDraft> {
  const title = rawTitle.trim();
  const options = rawOptions.map((o) => o.trim()).filter(Boolean);

  if (!title) return { ok: false, error: "제목을 입력해 주세요." };
  if (title.length > LIMITS.titleMax) {
    return { ok: false, error: `제목은 ${LIMITS.titleMax}자 이하로 입력해 주세요.` };
  }
  if (options.length < LIMITS.optionsMin) {
    return { ok: false, error: `선택지를 ${LIMITS.optionsMin}개 이상 입력해 주세요.` };
  }
  if (options.length > LIMITS.optionsMax) {
    return { ok: false, error: `선택지는 ${LIMITS.optionsMax}개까지 만들 수 있어요.` };
  }
  if (options.some((o) => o.length > LIMITS.optionLabelMax)) {
    return { ok: false, error: `선택지는 ${LIMITS.optionLabelMax}자 이하로 입력해 주세요.` };
  }
  if (new Set(options).size !== options.length) {
    return { ok: false, error: "같은 문구의 선택지가 있어요." };
  }
  return { ok: true, value: { title, options } };
}

export function checkRosterNames(text: string): Checked<string[]> {
  const names = text
    .split(/\r?\n/)
    .map((n) => n.trim())
    .filter(Boolean);

  if (names.length === 0) {
    return { ok: false, error: "등록할 이름을 한 줄에 하나씩 입력해 주세요." };
  }
  const tooLong = names.find((n) => n.length > LIMITS.voterNameMax);
  if (tooLong) {
    return {
      ok: false,
      error: `이름은 ${LIMITS.voterNameMax}자 이하로 입력해 주세요: ${tooLong}`,
    };
  }
  const duplicated = names.find((n, i) => names.indexOf(n) !== i);
  if (duplicated) {
    return { ok: false, error: `입력한 목록에 같은 이름이 두 번 있어요: ${duplicated}` };
  }
  return { ok: true, value: names };
}

const CLOSING_TIME_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;

/**
 * 마감 시각 입력 칸의 원시 값을 한국 시간(+09:00)으로 해석한다. 비어 있으면 마감 없음(null).
 * 초 단위도 받는다. 화면에서는 분까지만 입력하지만, 테스트에서 몇 초 뒤 마감을 만들 때 쓴다.
 */
export function checkClosingTime(raw: string, now: Date): Checked<Date | null> {
  const value = raw.trim();
  if (!value) return { ok: true, value: null };
  const match = CLOSING_TIME_PATTERN.exec(value);
  const closesAt = match && new Date(`${match.slice(1, 4).join("-")}T${match[4]}:${match[5]}:${match[6] ?? "00"}+09:00`);
  // 2월 30일처럼 없는 날짜는 Date가 다음 달로 넘겨버리므로, 한국 시간으로 되돌려 날짜가 같은지 확인한다.
  const sameDay =
    closesAt &&
    !Number.isNaN(closesAt.getTime()) &&
    new Date(closesAt.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10) ===
      match.slice(1, 4).join("-");
  if (!sameDay) {
    return { ok: false, error: "마감 시각을 날짜와 시간까지 입력해 주세요." };
  }
  if (closesAt.getTime() <= now.getTime()) {
    return { ok: false, error: "마감 시각은 지금 이후여야 해요." };
  }
  return { ok: true, value: closesAt };
}
