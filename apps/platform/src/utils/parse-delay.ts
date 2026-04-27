const MAX_DELAY_SECONDS = 2_592_000; // 30 days

const UNIT_MAP: Record<string, number> = {
  d: 86_400,
  h: 3_600,
  m: 60,
  s: 1,
};

export function parseDelay(value: number | string | undefined | null): number {
  if (value === undefined || value === null) {
    return 0;
  }

  let seconds: number;

  if (typeof value === 'number') {
    if (value <= 0) {
      throw new Error('Delay must be a positive number of seconds');
    }
    seconds = Math.floor(value);
  } else {
    // Bare number string
    if (/^\d+$/.test(value)) {
      seconds = parseInt(value, 10);
      if (seconds <= 0) {
        throw new Error('Delay must be a positive number of seconds');
      }
    } else {
      // Parse human-readable: "1d2h30m15s"
      const regex = /^(\d+[dhms])+$/;
      if (!regex.test(value)) {
        throw new Error(`Invalid delay format: "${value}". Use a number (seconds) or a string like "15m", "2h30m", "1d".`);
      }
      seconds = 0;
      const tokens = value.matchAll(/(\d+)([dhms])/g);
      for (const [, amount, unit] of tokens) {
        seconds += parseInt(amount, 10) * UNIT_MAP[unit];
      }
      if (seconds <= 0) {
        throw new Error('Delay must be a positive number of seconds');
      }
    }
  }

  if (seconds > MAX_DELAY_SECONDS) {
    throw new Error(`Delay of ${seconds}s exceeds maximum of ${MAX_DELAY_SECONDS}s (30 days)`);
  }

  return seconds;
}
