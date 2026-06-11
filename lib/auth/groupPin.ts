/** Shared PIN for the whole group (everyone uses the same PIN, unique name). */
export function getGroupPin(): string {
  return process.env.GROUP_PIN ?? "1991";
}

export function isValidGroupPin(pin: string): boolean {
  return pin === getGroupPin();
}
