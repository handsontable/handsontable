/* eslint-disable no-bitwise */

/**
 * The SHA-512 round constants. Each 64-bit constant is stored as a pair
 * of 32-bit integers (high word first, low word second).
 *
 * @type {number[]}
 */
const K = [
  0x428a2f98, 0xd728ae22, 0x71374491, 0x23ef65cd,
  0xb5c0fbcf, 0xec4d3b2f, 0xe9b5dba5, 0x8189dbbc,
  0x3956c25b, 0xf348b538, 0x59f111f1, 0xb605d019,
  0x923f82a4, 0xaf194f9b, 0xab1c5ed5, 0xda6d8118,
  0xd807aa98, 0xa3030242, 0x12835b01, 0x45706fbe,
  0x243185be, 0x4ee4b28c, 0x550c7dc3, 0xd5ffb4e2,
  0x72be5d74, 0xf27b896f, 0x80deb1fe, 0x3b1696b1,
  0x9bdc06a7, 0x25c71235, 0xc19bf174, 0xcf692694,
  0xe49b69c1, 0x9ef14ad2, 0xefbe4786, 0x384f25e3,
  0x0fc19dc6, 0x8b8cd5b5, 0x240ca1cc, 0x77ac9c65,
  0x2de92c6f, 0x592b0275, 0x4a7484aa, 0x6ea6e483,
  0x5cb0a9dc, 0xbd41fbd4, 0x76f988da, 0x831153b5,
  0x983e5152, 0xee66dfab, 0xa831c66d, 0x2db43210,
  0xb00327c8, 0x98fb213f, 0xbf597fc7, 0xbeef0ee4,
  0xc6e00bf3, 0x3da88fc2, 0xd5a79147, 0x930aa725,
  0x06ca6351, 0xe003826f, 0x14292967, 0x0a0e6e70,
  0x27b70a85, 0x46d22ffc, 0x2e1b2138, 0x5c26c926,
  0x4d2c6dfc, 0x5ac42aed, 0x53380d13, 0x9d95b3df,
  0x650a7354, 0x8baf63de, 0x766a0abb, 0x3c77b2a8,
  0x81c2c92e, 0x47edaee6, 0x92722c85, 0x1482353b,
  0xa2bfe8a1, 0x4cf10364, 0xa81a664b, 0xbc423001,
  0xc24b8b70, 0xd0f89791, 0xc76c51a3, 0x0654be30,
  0xd192e819, 0xd6ef5218, 0xd6990624, 0x5565a910,
  0xf40e3585, 0x5771202a, 0x106aa070, 0x32bbd1b8,
  0x19a4c116, 0xb8d2d0c8, 0x1e376c08, 0x5141ab53,
  0x2748774c, 0xdf8eeb99, 0x34b0bcb5, 0xe19b48a8,
  0x391c0cb3, 0xc5c95a63, 0x4ed8aa4a, 0xe3418acb,
  0x5b9cca4f, 0x7763e373, 0x682e6ff3, 0xd6b2b8a3,
  0x748f82ee, 0x5defb2fc, 0x78a5636f, 0x43172f60,
  0x84c87814, 0xa1f0ab72, 0x8cc70208, 0x1a6439ec,
  0x90befffa, 0x23631e28, 0xa4506ceb, 0xde82bde9,
  0xbef9a3f7, 0xb2c67915, 0xc67178f2, 0xe372532b,
  0xca273ece, 0xea26619c, 0xd186b8c7, 0x21c0c207,
  0xeada7dd6, 0xcde0eb1e, 0xf57d4f7f, 0xee6ed178,
  0x06f067aa, 0x72176fba, 0x0a637dc5, 0xa2c898a6,
  0x113f9804, 0xbef90dae, 0x1b710b35, 0x131c471b,
  0x28db77f5, 0x23047d84, 0x32caab7b, 0x40c72493,
  0x3c9ebe0a, 0x15c9bebc, 0x431d67c4, 0x9c100d4c,
  0x4cc5d4be, 0xcb3e42b6, 0x597f299c, 0xfc657e2a,
  0x5fcb6fab, 0x3ad6faec, 0x6c44198c, 0x4a475817,
];

/**
 * Converts a 32-bit integer to a zero-padded 8-character hex string.
 *
 * @param {number} value The 32-bit integer value.
 * @returns {string}
 */
function toHex32(value: number): string {
  return `00000000${(value >>> 0).toString(16)}`.slice(-8);
}

/**
 * Calculates the SHA-512 checksum of the passed bytes. The implementation is
 * a plain (pure JS) one on purpose. It does not depend on the Web Crypto API
 * (`crypto.subtle`), which browsers expose only on secure origins (https).
 * Thanks to that, the checksum can be verified on plain http:// pages,
 * for example, intranets of big companies.
 *
 * @param {number[]|Uint8Array} bytes The bytes to calculate the checksum from.
 * @returns {string} The checksum as a 128-character hex string.
 */
export function sha512(bytes: number[] | Uint8Array): string {
  const byteLength = bytes.length;
  // The message is padded with the 0x80 byte, zeros, and the 128-bit big-endian
  // bit length so the total length is a multiple of 128 bytes.
  const blockCount = Math.ceil((byteLength + 17) / 128);
  const buffer = new Uint8Array(blockCount * 128);

  buffer.set(bytes);
  buffer[byteLength] = 0x80;

  const bitLength = byteLength * 8;
  const bufferLength = buffer.length;

  // The supported message sizes fit well within 2^53 bits, so only the two
  // lowest 32-bit words of the 128-bit length field are ever non-zero.
  buffer[bufferLength - 7] = Math.floor(bitLength / 0x1000000000000) & 0xff; // bits 48-55
  buffer[bufferLength - 6] = Math.floor(bitLength / 0x10000000000) & 0xff; // bits 40-47
  buffer[bufferLength - 5] = Math.floor(bitLength / 0x100000000) & 0xff; // bits 32-39
  buffer[bufferLength - 4] = (bitLength >>> 24) & 0xff; // bits 24-31
  buffer[bufferLength - 3] = (bitLength >>> 16) & 0xff; // bits 16-23
  buffer[bufferLength - 2] = (bitLength >>> 8) & 0xff; // bits 8-15
  buffer[bufferLength - 1] = bitLength & 0xff; // bits 0-7

  // The initial hash values, stored as [high, low] 32-bit pairs.
  const H = [
    0x6a09e667, 0xf3bcc908, 0xbb67ae85, 0x84caa73b,
    0x3c6ef372, 0xfe94f82b, 0xa54ff53a, 0x5f1d36f1,
    0x510e527f, 0xade682d1, 0x9b05688c, 0x2b3e6c1f,
    0x1f83d9ab, 0xfb41bd6b, 0x5be0cd19, 0x137e2179,
  ];
  const wh: number[] = new Array<number>(80);
  const wl: number[] = new Array<number>(80);

  for (let block = 0; block < blockCount; block += 1) {
    const offset = block * 128;

    // Prepare the message schedule.
    for (let i = 0; i < 16; i += 1) {
      const o = offset + (i * 8);

      wh[i] = ((buffer[o] << 24) | (buffer[o + 1] << 16) | (buffer[o + 2] << 8) | buffer[o + 3]) >>> 0;
      wl[i] = ((buffer[o + 4] << 24) | (buffer[o + 5] << 16) | (buffer[o + 6] << 8) | buffer[o + 7]) >>> 0;
    }

    for (let i = 16; i < 80; i += 1) {
      const x2h = wh[i - 2];
      const x2l = wl[i - 2];
      const x15h = wh[i - 15];
      const x15l = wl[i - 15];
      // smallSigma1 = ROTR^19(x) XOR ROTR^61(x) XOR SHR^6(x)
      const s1h = ((x2h >>> 19) | (x2l << 13)) ^ ((x2l >>> 29) | (x2h << 3)) ^ (x2h >>> 6);
      const s1l = ((x2l >>> 19) | (x2h << 13)) ^ ((x2h >>> 29) | (x2l << 3)) ^ ((x2l >>> 6) | (x2h << 26));
      // smallSigma0 = ROTR^1(x) XOR ROTR^8(x) XOR SHR^7(x)
      const s0h = ((x15h >>> 1) | (x15l << 31)) ^ ((x15h >>> 8) | (x15l << 24)) ^ (x15h >>> 7);
      const s0l = ((x15l >>> 1) | (x15h << 31)) ^ ((x15l >>> 8) | (x15h << 24)) ^ ((x15l >>> 7) | (x15h << 25));

      const lowSum = (s1l >>> 0) + (wl[i - 7] >>> 0) + (s0l >>> 0) + (wl[i - 16] >>> 0);

      wl[i] = lowSum >>> 0;
      wh[i] = ((s1h >>> 0) + (wh[i - 7] >>> 0) + (s0h >>> 0) + (wh[i - 16] >>> 0)
        + Math.floor(lowSum / 0x100000000)) >>> 0;
    }

    let ah = H[0];
    let al = H[1];
    let bh = H[2];
    let bl = H[3];
    let ch = H[4];
    let cl = H[5];
    let dh = H[6];
    let dl = H[7];
    let eh = H[8];
    let el = H[9];
    let fh = H[10];
    let fl = H[11];
    let gh = H[12];
    let gl = H[13];
    let hh = H[14];
    let hl = H[15];

    for (let i = 0; i < 80; i += 1) {
      // bigSigma1 = ROTR^14(e) XOR ROTR^18(e) XOR ROTR^41(e)
      const bs1h = ((eh >>> 14) | (el << 18)) ^ ((eh >>> 18) | (el << 14)) ^ ((el >>> 9) | (eh << 23));
      const bs1l = ((el >>> 14) | (eh << 18)) ^ ((el >>> 18) | (eh << 14)) ^ ((eh >>> 9) | (el << 23));
      // bigSigma0 = ROTR^28(a) XOR ROTR^34(a) XOR ROTR^39(a)
      const bs0h = ((ah >>> 28) | (al << 4)) ^ ((al >>> 2) | (ah << 30)) ^ ((al >>> 7) | (ah << 25));
      const bs0l = ((al >>> 28) | (ah << 4)) ^ ((ah >>> 2) | (al << 30)) ^ ((ah >>> 7) | (al << 25));
      // ch = (e AND f) XOR (NOT e AND g)
      const chh = (eh & fh) ^ (~eh & gh);
      const chl = (el & fl) ^ (~el & gl);
      // maj = (a AND b) XOR (a AND c) XOR (b AND c)
      const majh = (ah & bh) ^ (ah & ch) ^ (bh & ch);
      const majl = (al & bl) ^ (al & cl) ^ (bl & cl);

      const t1LowSum = (hl >>> 0) + (bs1l >>> 0) + (chl >>> 0) + (K[(i * 2) + 1] >>> 0) + (wl[i] >>> 0);
      const t1l = t1LowSum >>> 0;
      const t1h = ((hh >>> 0) + (bs1h >>> 0) + (chh >>> 0) + (K[i * 2] >>> 0)
        + (wh[i] >>> 0) + Math.floor(t1LowSum / 0x100000000)) >>> 0;

      const t2LowSum = (bs0l >>> 0) + (majl >>> 0);
      const t2l = t2LowSum >>> 0;
      const t2h = ((bs0h >>> 0) + (majh >>> 0) + Math.floor(t2LowSum / 0x100000000)) >>> 0;

      hh = gh;
      hl = gl;
      gh = fh;
      gl = fl;
      fh = eh;
      fl = el;

      const eLowSum = (dl >>> 0) + t1l;

      el = eLowSum >>> 0;
      eh = ((dh >>> 0) + t1h + Math.floor(eLowSum / 0x100000000)) >>> 0;

      dh = ch;
      dl = cl;
      ch = bh;
      cl = bl;
      bh = ah;
      bl = al;

      const aLowSum = t1l + t2l;

      al = aLowSum >>> 0;
      ah = (t1h + t2h + Math.floor(aLowSum / 0x100000000)) >>> 0;
    }

    const stateWords = [ah, al, bh, bl, ch, cl, dh, dl, eh, el, fh, fl, gh, gl, hh, hl];

    for (let i = 0; i < 16; i += 2) {
      const stateLowSum = (H[i + 1] >>> 0) + (stateWords[i + 1] >>> 0);

      H[i + 1] = stateLowSum >>> 0;
      H[i] = ((H[i] >>> 0) + (stateWords[i] >>> 0) + Math.floor(stateLowSum / 0x100000000)) >>> 0;
    }
  }

  return H.map(toHex32).join('');
}
