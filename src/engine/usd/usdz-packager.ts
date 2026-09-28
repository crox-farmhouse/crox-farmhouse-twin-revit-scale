/**
 * Pure TypeScript Pixar-compliant `.usdz` Uncompressed 64-Byte-Aligned Archive Packager.
 *
 * Per the OpenUSD USDZ Specification:
 * 1. The archive must be a standard PKZIP file with compression method `0` (STORE / uncompressed).
 * 2. The very first file entry must be the default/root stage layer (`.usda` or `.usdc`).
 * 3. The data payload of every entry must begin on a 64-byte boundary (`dataOffset % 64 === 0`),
 *    padded via the Local File Header's `extra` field (`0x1986` USDZ alignment tag).
 */

export interface UsdzArchiveEntry {
  /** Relative POSIX path inside the `.usdz` archive (no leading `./` or `/`). */
  readonly path: string;
  /** Raw file contents (`Uint8Array` or UTF-8 string). */
  readonly data: Uint8Array | string;
}

const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC32_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function toUtf8Bytes(input: Uint8Array | string): Uint8Array {
  if (typeof input === 'string') {
    return new TextEncoder().encode(input);
  }
  return input;
}

/**
 * Packs an ordered list of `UsdzArchiveEntry` files into a 64-byte-aligned `.usdz` binary buffer.
 */
export function buildUsdzArchive(entries: readonly UsdzArchiveEntry[]): Uint8Array {
  const textEncoder = new TextEncoder();
  const localChunks: Uint8Array[] = [];
  const centralChunks: Uint8Array[] = [];

  let offset = 0;

  for (const entry of entries) {
    const cleanPath = entry.path.replace(/^\.?\/+/, '');
    const nameBytes = textEncoder.encode(cleanPath);
    const payload = toUtf8Bytes(entry.data);
    const crc = crc32(payload);

    // Local file header is 30 bytes + nameBytes.length + extraBytes.length
    const baseHeaderEnd = offset + 30 + nameBytes.length;
    const remainder = baseHeaderEnd % 64;
    let extraLen = remainder === 0 ? 0 : 64 - remainder;
    // An extra field header requires at least 4 bytes (2-byte ID + 2-byte size)
    if (extraLen > 0 && extraLen < 4) {
      extraLen += 64;
    }

    const extraBytes = new Uint8Array(extraLen);
    if (extraLen >= 4) {
      const extraView = new DataView(extraBytes.buffer);
      // 0x1986 is the official Pixar USDZ alignment extra field signature
      extraView.setUint16(0, 0x1986, true);
      extraView.setUint16(2, extraLen - 4, true);
    }

    const localHeader = new Uint8Array(30 + nameBytes.length + extraLen);
    const lv = new DataView(localHeader.buffer);
    lv.setUint32(0, 0x04034b50, true); // Local file header signature
    lv.setUint16(4, 20, true); // Version needed to extract (2.0)
    lv.setUint16(6, 0, true); // General purpose bit flag
    lv.setUint16(8, 0, true); // Compression method: 0 (STORE / uncompressed)
    lv.setUint16(10, 0, true); // Last mod file time
    lv.setUint16(12, 0x5421, true); // Last mod file date
    lv.setUint32(14, crc, true); // CRC-32
    lv.setUint32(18, payload.length, true); // Compressed size
    lv.setUint32(22, payload.length, true); // Uncompressed size
    lv.setUint16(26, nameBytes.length, true); // File name length
    lv.setUint16(28, extraLen, true); // Extra field length
    localHeader.set(nameBytes, 30);
    localHeader.set(extraBytes, 30 + nameBytes.length);

    const localHeaderOffset = offset;
    localChunks.push(localHeader, payload);
    offset += localHeader.length + payload.length;

    // Central directory header (46 bytes + nameBytes.length)
    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(centralHeader.buffer);
    cv.setUint32(0, 0x02014b50, true); // Central directory file header signature
    cv.setUint16(4, 20, true); // Version made by
    cv.setUint16(6, 20, true); // Version needed to extract
    cv.setUint16(8, 0, true); // General purpose bit flag
    cv.setUint16(10, 0, true); // Compression method: 0 (STORE)
    cv.setUint16(12, 0, true); // Last mod time
    cv.setUint16(14, 0x5421, true); // Last mod date
    cv.setUint32(16, crc, true); // CRC-32
    cv.setUint32(20, payload.length, true); // Compressed size
    cv.setUint32(24, payload.length, true); // Uncompressed size
    cv.setUint16(28, nameBytes.length, true); // File name length
    cv.setUint16(30, 0, true); // Extra field length
    cv.setUint16(32, 0, true); // File comment length
    cv.setUint16(34, 0, true); // Disk number start
    cv.setUint16(36, 0, true); // Internal file attributes
    cv.setUint32(38, 0, true); // External file attributes
    cv.setUint32(42, localHeaderOffset, true); // Relative offset of local header
    centralHeader.set(nameBytes, 46);
    centralChunks.push(centralHeader);
  }

  const centralDirOffset = offset;
  let centralDirSize = 0;
  for (const chunk of centralChunks) {
    centralDirSize += chunk.length;
  }

  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true); // End of central directory signature
  ev.setUint16(4, 0, true); // Number of this disk
  ev.setUint16(6, 0, true); // Disk where central directory starts
  ev.setUint16(8, entries.length, true); // Total entries on this disk
  ev.setUint16(10, entries.length, true); // Total entries in central directory
  ev.setUint32(12, centralDirSize, true); // Size of central directory
  ev.setUint32(16, centralDirOffset, true); // Offset of central directory
  ev.setUint16(20, 0, true); // Comment length

  const totalSize = centralDirOffset + centralDirSize + eocd.length;
  const out = new Uint8Array(totalSize);
  let writePos = 0;
  for (const chunk of localChunks) {
    out.set(chunk, writePos);
    writePos += chunk.length;
  }
  for (const chunk of centralChunks) {
    out.set(chunk, writePos);
    writePos += chunk.length;
  }
  out.set(eocd, writePos);
  return out;
}
