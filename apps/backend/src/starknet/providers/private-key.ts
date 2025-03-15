import { Injectable } from '@nestjs/common';
import { ec } from 'starknet';
import { randomBytes } from 'crypto';
import bip39 from 'bip39';

@Injectable()
export class PrivateKeyProvider {
  private privateKey: string;
  private publicKey: string;

  constructor() {
    // Generate a seed phrase
    const seedPhrase = bip39.generateMnemonic();
    console.log("Generated Seed Phrase:", seedPhrase);

    // Generate a random 32-byte private key
    this.privateKey = `0x${randomBytes(32).toString('hex')}`;

    // Compute the public key from the private key
    this.publicKey = ec.starkCurve.getStarkKey(this.privateKey);

    console.log("Private Key:", this.privateKey);
    console.log("Public Key:", this.publicKey);
  }

  getKeys() {
    return {
      privateKey: this.privateKey,
      publicKey: this.publicKey,
    };
  }
}