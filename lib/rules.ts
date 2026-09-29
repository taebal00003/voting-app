import { randomInt } from "node:crypto";

export const LIMITS = {
  titleMax: 100,
  optionLabelMax: 50,
  optionsMin: 2,
  optionsMax: 10,
  voterNameMax: 20,
} as const;

// 헷갈리는 글자(0/O, 1/I/L)를 뺀 알파벳
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 8;

export function generateVoterCode(): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  }
  return code;
}

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
