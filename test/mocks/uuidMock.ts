/**
 * Deterministic mock for UUID v7:
 * - Uses a fixed base timestamp (milliseconds) and increments it by 1 per call.
 * - Derives the 12 random bits of rand_a plus the remaining random bits using a simple reproducible LCG.
 * - Produces a valid v7 UUID per RFC 9562 layout (version 7, RFC4122 variant / 0b10xxxxxx in variant bits).
 *
 * Note: This mock is for tests only and does not provide real randomness.
 *
 * First 5 generated UUIDs (given current seed & base timestamp):
 * 1: 018bcfe5-6800-7777-8d30-5e6a25dbfac1
 * 2: 018bcfe5-6801-752c-84de-0e9be2aa733e
 * 3: 018bcfe5-6802-7185-b2d0-8520a63075ff
 * 4: 018bcfe5-6803-7b52-a07d-b28967549a54
 * 5: 018bcfe5-6804-71a3-b400-3aa6b20611cd
 * (If this list changes unexpectedly, the mock logic or seed likely changed.)
 */

// Base timestamp (Unix ms) – adjustable but constant for reproducible tests.
// Example value: 2023-11-14T22:13:20.000Z (arbitrary)
const BASE_TIMESTAMP_MS = 1700000000000; // Fits in 48 bits
let currentTs = BASE_TIMESTAMP_MS;

// Linear Congruential Generator (LCG) for reproducible pseudo-random values
// Formula: state = (a * state + c) mod 2^32
let prngState = 0x12345678; // Seed (constant for deterministic behavior)
function next32(): number {
  prngState = (1664525 * prngState + 1013904223) >>> 0; // Numerical Recipes parameters
  return prngState;
}

/**
 * Returns the lowest n bits from a 32-bit pseudo-random number.
 * @param n Number of bits to extract (1 <= n <= 32; typically n <= 24).
 * @returns A number containing the n low-order bits.
 */
function nextBits(n: number): number {
  const mask = n === 32 ? 0xffffffff : (1 << n) - 1;
  return next32() & mask;
}

/**
 * Generates a deterministic mock UUID v7 string for testing purposes.
 * - Uses a fixed base timestamp and increments it per call for reproducibility.
 * - Random bits are generated using a seeded LCG for deterministic output.
 * - Returns a valid UUID v7 string per RFC 9562, but not suitable for production use.
 * @returns {string} Deterministic UUID v7 string
 */
export const v7 = (): string => {
  const ts = currentTs++; // 48-bit timestamp (we assume this will not overflow in tests)

  const buf = Buffer.alloc(16);

  // 48-bit timestamp big-endian into bytes 0..5
  let rem = ts;
  for (let i = 5; i >= 0; i--) {
    buf[i] = rem & 0xff;
    rem = Math.floor(rem / 256);
  }

  // 12 random bits for rand_a
  const randA = nextBits(12); // Range 0..4095

  // Byte 6: high nibble = version (0x7), low nibble = high 4 bits of randA
  buf[6] = 0x70 /* Version 7 */ | (randA >> 8);
  // Byte 7: remaining 8 bits of randA
  buf[7] = randA & 0xff;

  // Variant + rand_b (62 bits) -> we fill 64 bits and then enforce correct variant bits
  for (let i = 8; i < 16; i += 4) {
    const val = next32();
    buf[i] = (val >>> 24) & 0xff;
    buf[i + 1] = (val >>> 16) & 0xff;
    buf[i + 2] = (val >>> 8) & 0xff;
    buf[i + 3] = val & 0xff;
  }

  // Variant bits in byte 8: 0b10xxxxxx
  buf[8] = (buf[8] & 0x3f) | 0x80;

  // Format into UUID string (8-4-4-4-12 hex)
  const hex = buf.toString("hex");
  const uuid = `${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20)}`;
  return uuid;
};

export const NIL = "00000000-0000-0000-0000-000000000000";

// Test utility: reset internal counters so each test can start from a clean deterministic state.
export function __resetUuidMock(): void {
  currentTs = BASE_TIMESTAMP_MS;
  prngState = 0x12345678;
}

export default { v7, NIL, __resetUuidMock };
