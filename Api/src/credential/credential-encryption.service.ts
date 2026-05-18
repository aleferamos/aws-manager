import { Injectable } from '@nestjs/common';
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'node:crypto';

import { JWT_SECRET } from '../shared/auth/jwt-auth.constants';

interface CredentialSecrets {
  accessKeyId: string;
  secretKeyId: string;
}

interface EncryptedCredentialFile {
  version: 1;
  algorithm: 'aes-256-gcm';
  iv: string;
  tag: string;
  data: string;
}

@Injectable()
export class CredentialEncryptionService {
  private readonly algorithm = 'aes-256-gcm';

  encrypt(secrets: CredentialSecrets): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv(this.algorithm, this.getKey(), iv);
    const payload = JSON.stringify(secrets);
    const encrypted = Buffer.concat([
      cipher.update(payload, 'utf8'),
      cipher.final(),
    ]);

    const encryptedFile: EncryptedCredentialFile = {
      version: 1,
      algorithm: this.algorithm,
      iv: iv.toString('base64'),
      tag: cipher.getAuthTag().toString('base64'),
      data: encrypted.toString('base64'),
    };

    return JSON.stringify(encryptedFile);
  }

  decrypt(encryptedFile: string): CredentialSecrets {
    const parsed = JSON.parse(encryptedFile) as EncryptedCredentialFile;
    const decipher = createDecipheriv(
      parsed.algorithm,
      this.getKey(),
      Buffer.from(parsed.iv, 'base64'),
    );

    decipher.setAuthTag(Buffer.from(parsed.tag, 'base64'));

    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(parsed.data, 'base64')),
      decipher.final(),
    ]);

    return JSON.parse(decrypted.toString('utf8')) as CredentialSecrets;
  }

  private getKey(): Buffer {
    return createHash('sha256')
      .update(process.env.CREDENTIAL_ENCRYPTION_KEY ?? JWT_SECRET)
      .digest();
  }
}
