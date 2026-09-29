/** 기준 시각을 마감 시각 입력 칸 형식(YYYY-MM-DDTHH:mm:ss, 한국 시간)으로 적는다. */
export function kst(date: Date): string {
  return new Date(date.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 19);
}
