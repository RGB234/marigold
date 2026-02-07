const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

// Crockford's Base32 mapping for decoding
const DECODE_MAP: Record<string, bigint> = {};

// Build decode map
for (let i = 0; i < ALPHABET.length; i++) {
    DECODE_MAP[ALPHABET[i]] = BigInt(i);
}
// Handle aliases according to Crockford's Base32
DECODE_MAP['O'] = BigInt(0);
DECODE_MAP['I'] = BigInt(1);
DECODE_MAP['L'] = BigInt(1);

/**
 * Converts a TSID string (Crockford's Base32) to a BigInt (Long).
 * 
 * @param tsid TSID string (case-insensitive)
 * @returns BigInt representation of the TSID
 * @throws Error if the string contains invalid characters
 */
export const tsidToLong = (tsid: string): bigint => {
    if (!tsid) return BigInt(0);
    
    let result = BigInt(0);
    const chars = tsid.toUpperCase();
    const base = BigInt(32);
    
    for (let i = 0; i < chars.length; i++) {
        const char = chars[i];
        if (char === '-') continue; // Ignore hyphens
        
        const val = DECODE_MAP[char];
        if (val === undefined) {
            throw new Error(`Invalid TSID character: ${char}`);
        }
        result = result * base + val;
    }
    return result;
};

/**
 * Converts a BigInt (Long) to a TSID string (Crockford's Base32).
 * 
 * @param id BigInt, string, or number representation of the TSID
 * @returns TSID string (13 characters, padded with 0)
 */
export const longToTsid = (id: bigint | string | number): string => {
    let value: bigint;
    try {
        value = BigInt(id);
    } catch (e) {
        throw new Error('Invalid input for TSID Long conversion');
    }

    if (value === BigInt(0)) return '0'.padStart(13, '0');
    
    let result = '';
    const base = BigInt(32);
    
    while (value > BigInt(0)) {
        const remainder = Number(value % base);
        result = ALPHABET[remainder] + result;
        value = value / base;
    }
    
    // TSID is typically 13 chars long for 64-bit integers
    return result.padStart(13, '0');
};
