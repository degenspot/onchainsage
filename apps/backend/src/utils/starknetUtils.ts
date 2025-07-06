import { hash, ec } from 'starknet';

/**
 * Verifies a Starknet signature
 * @param {string} address - The Starknet wallet address
 * @param {string[]} signature - The signature to verify
 * @param {string} message - The original message that was signed
 * @returns {Promise<boolean>} - Whether the signature is valid
 */
export async function verifyStarknetSignature(
  address: string,
  signature: string[],
  message: string,
): Promise<boolean> {
  try {
    const messageHash = hash.starknetKeccak(message);

    // Convert messageHash to hex string format
    const messageHashHex = `0x${messageHash.toString(16)}`;

    // Convert signature components to BigInt
    const r = BigInt(signature[0]);
    const s = BigInt(signature[1]);

    // Create proper Signature instance
    const sig = new ec.starkCurve.Signature(r, s);

    return ec.starkCurve.verify(sig, messageHashHex, address);
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

/**
 * Generates a random challenge for the user to sign
 * @returns {string} - A random string to be signed
 */
export function generateChallenge() {
  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);
  return Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
