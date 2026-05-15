import { timingSafeEqual } from "crypto";
import { getAccessCode } from "./dashboardSession";

export function verifyAccessCode(input: string): boolean {
  const expected = getAccessCode();
  if (!expected) return false;

  const provided = Buffer.from(input);
  const target = Buffer.from(expected);
  if (provided.length !== target.length) return false;
  return timingSafeEqual(provided, target);
}
