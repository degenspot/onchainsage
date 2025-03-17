import { Injectable } from '@nestjs/common';
import { ec } from 'starknet';
import { randomBytes } from 'crypto';

@Injectable()
export class PrivateKeyProvider {
  private privateKey: string;
  private publicKey: string;

  constructor() {
    // Generate a seed phrase   
    const bip39 = require('bip39');
    // const mnemonic = 'surround crazy test license faint reject pole reunion pink region legal carry'
    // const seedPhrase = bip39.generateMnemonic();

    // Generate a random 32-byte private key
    this.privateKey = `0x${randomBytes(16).toString('hex')}`;

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