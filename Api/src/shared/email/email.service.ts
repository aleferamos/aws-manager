import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Socket, connect } from 'node:net';
import { TLSSocket, connect as tlsConnect } from 'node:tls';
import { I18nService } from '../i18n/i18n.service';

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text: string;
}

type SmtpSocket = Socket | TLSSocket;

type PendingResponse = {
  resolve: (response: string) => void;
  reject: (error: Error) => void;
  timer: NodeJS.Timeout;
};

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly i18n: I18nService) {}

  private readonly host =
    process.env.EMAIL_HOST?.trim() || 'smtp-relay.brevo.com';
  private readonly port = Number(process.env.EMAIL_PORT ?? 587);

  private get user(): string {
    return this.getRequiredEnv('EMAIL_USER');
  }

  private get password(): string {
    return this.getRequiredEnv('EMAIL_APP_PASSWORD');
  }

  private readonly fromName =
    process.env.EMAIL_FROM_NAME?.trim() || 'AWS Manager';

  private get fromEmail(): string {
    return process.env.EMAIL_FROM_EMAIL?.trim() || this.user;
  }

  private readonly timeoutMs = Number(process.env.EMAIL_TIMEOUT_MS ?? 15000);

  async send(params: SendEmailParams): Promise<void> {
    this.validateEmailParams(params);
    this.validateEmailConfiguration();

    const client = new SmtpClient(this.host, this.port, this.timeoutMs);

    try {
      await client.connect();

      await client.command(`EHLO ${this.host}`, 250);

      await client.command('STARTTLS', 220);
      await client.upgradeToTls();

      await client.command(`EHLO ${this.host}`, 250);

      await client.command('AUTH LOGIN', 334);
      await client.command(this.encodeBase64(this.user), 334);
      await client.command(this.encodeBase64(this.password), 235);

      await client.command(`MAIL FROM:<${this.fromEmail}>`, 250);

      await client.command(`RCPT TO:<${params.to}>`, [250, 251]);

      await client.command('DATA', 354);

      await client.command(this.buildMessage(params), 250);

      await client.command('QUIT', 221);

      this.logger.log(`Email sent to ${params.to}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown SMTP error.';

      this.logger.error(
        `Failed to send email to ${params.to}: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );

      throw new InternalServerErrorException({
        code: 'EMAIL_SEND_FAILED',
        message: this.i18n.translate('email.sendFailed'),
        detail:
          process.env.NODE_ENV === 'production' ? undefined : errorMessage,
      });
    } finally {
      client.close();
    }
  }

  private buildMessage(params: SendEmailParams): string {
    const boundary = `aws-manager-${Date.now()}`;
    const from = `"${this.escapeHeaderValue(this.fromName)}" <${this.fromEmail}>`;

    const lines = [
      `From: ${from}`,
      `To: ${params.to}`,
      `Subject: ${this.encodeHeader(params.subject)}`,
      `Date: ${new Date().toUTCString()}`,
      `Message-ID: <${Date.now()}.${Math.random().toString(36).slice(2)}@aws-manager>`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/plain; charset="UTF-8"',
      'Content-Transfer-Encoding: 8bit',
      '',
      params.text,
      '',
      `--${boundary}`,
      'Content-Type: text/html; charset="UTF-8"',
      'Content-Transfer-Encoding: 8bit',
      '',
      params.html,
      '',
      `--${boundary}--`,
      '.',
    ];

    return lines.join('\r\n');
  }

  private validateEmailParams(params: SendEmailParams): void {
    if (!params.to?.trim()) {
      throw new InternalServerErrorException({
        code: 'EMAIL_TO_MISSING',
        message: this.i18n.translate('email.toMissing'),
      });
    }

    if (!params.subject?.trim()) {
      throw new InternalServerErrorException({
        code: 'EMAIL_SUBJECT_MISSING',
        message: this.i18n.translate('email.subjectMissing'),
      });
    }

    if (!params.html?.trim() && !params.text?.trim()) {
      throw new InternalServerErrorException({
        code: 'EMAIL_BODY_MISSING',
        message: this.i18n.translate('email.bodyMissing'),
      });
    }
  }

  private getRequiredEnv(name: string): string {
    const value = process.env[name]?.trim();

    if (!value) {
      throw new InternalServerErrorException({
        code: 'EMAIL_CONFIGURATION_MISSING',
        message: this.i18n.translate('email.configurationMissing'),
      });
    }

    return value;
  }

  private validateEmailConfiguration(): void {
    this.user;
    this.password;
    this.fromEmail;
  }

  private encodeBase64(value: string): string {
    return Buffer.from(value, 'utf8').toString('base64');
  }

  private encodeHeader(value: string): string {
    return `=?UTF-8?B?${this.encodeBase64(value)}?=`;
  }

  private escapeHeaderValue(value: string): string {
    return value.replace(/"/g, '\\"');
  }
}

class SmtpClient {
  private socket?: SmtpSocket;
  private buffer = '';
  private pendingResponses: PendingResponse[] = [];

  constructor(
    private readonly host: string,
    private readonly port: number,
    private readonly timeoutMs: number,
  ) {}

  async connect(): Promise<void> {
    this.socket = connect(this.port, this.host);
    this.listen();

    await this.waitForResponse(220);
  }

  async upgradeToTls(): Promise<void> {
    if (!this.socket) {
      throw new Error('SMTP socket is not connected.');
    }

    this.socket.removeAllListeners('data');
    this.socket.removeAllListeners('error');
    this.socket.removeAllListeners('timeout');

    this.buffer = '';

    await new Promise<void>((resolve, reject) => {
      const tlsSocket = tlsConnect({
        socket: this.socket,
        servername: this.host,
      });

      const timer = setTimeout(() => {
        tlsSocket.destroy();
        reject(new Error('SMTP TLS upgrade timed out.'));
      }, this.timeoutMs);

      const cleanup = () => {
        clearTimeout(timer);
        tlsSocket.removeListener('secureConnect', onSecureConnect);
        tlsSocket.removeListener('error', onError);
      };

      const onSecureConnect = () => {
        cleanup();
        this.socket = tlsSocket;
        this.listen();
        resolve();
      };

      const onError = (error: Error) => {
        cleanup();
        reject(error);
      };

      tlsSocket.once('secureConnect', onSecureConnect);
      tlsSocket.once('error', onError);
    });
  }

  async command(
    command: string,
    expectedStatus: number | number[],
  ): Promise<string> {
    if (!this.socket) {
      throw new Error('SMTP socket is not connected.');
    }

    this.socket.write(`${command}\r\n`);

    return this.waitForResponse(expectedStatus);
  }

  close(): void {
    this.socket?.end();
    this.socket?.destroy();
  }

  private listen(): void {
    if (!this.socket) {
      return;
    }

    this.socket.setTimeout(this.timeoutMs);

    this.socket.on('data', (chunk: Buffer) => {
      this.buffer += chunk.toString('utf8');
      this.flushCompleteResponses();
    });

    this.socket.on('error', (error: Error) => {
      this.rejectPendingResponses(error);
    });

    this.socket.on('timeout', () => {
      this.rejectPendingResponses(new Error('SMTP command timed out.'));
      this.socket?.destroy();
    });
  }

  private waitForResponse(expectedStatus: number | number[]): Promise<string> {
    const expectedStatuses = Array.isArray(expectedStatus)
      ? expectedStatus
      : [expectedStatus];

    return new Promise((resolve, reject) => {
      const pendingResponse: PendingResponse = {
        resolve: (response: string) => {
          clearTimeout(pendingResponse.timer);

          const status = Number(response.slice(0, 3));

          if (expectedStatuses.includes(status)) {
            resolve(response);
            return;
          }

          reject(new Error(`Unexpected SMTP response: ${response}`));
        },
        reject: (error: Error) => {
          clearTimeout(pendingResponse.timer);
          reject(error);
        },
        timer: setTimeout(() => {
          this.pendingResponses = this.pendingResponses.filter(
            (item) => item !== pendingResponse,
          );

          reject(new Error('SMTP response timed out.'));
        }, this.timeoutMs),
      };

      this.pendingResponses.push(pendingResponse);
      this.flushCompleteResponses();
    });
  }

  private flushCompleteResponses(): void {
    let response = this.readCompleteResponse();

    while (response) {
      const pendingResponse = this.pendingResponses.shift();
      pendingResponse?.resolve(response);

      response = this.readCompleteResponse();
    }
  }

  private rejectPendingResponses(error: Error): void {
    const pendingResponses = [...this.pendingResponses];
    this.pendingResponses = [];

    for (const pendingResponse of pendingResponses) {
      clearTimeout(pendingResponse.timer);
      pendingResponse.reject(error);
    }
  }

  private readCompleteResponse(): string | null {
    const lines = this.buffer.split(/\r?\n/);

    if (!this.buffer.endsWith('\n')) {
      lines.pop();
    }

    if (!lines.length) {
      return null;
    }

    const completeLineIndex = lines.findIndex((line) => /^\d{3} /.test(line));

    if (completeLineIndex === -1) {
      return null;
    }

    const responseLines = lines.slice(0, completeLineIndex + 1);
    const remainingLines = lines.slice(completeLineIndex + 1);

    this.buffer = remainingLines.join('\r\n');

    return responseLines.join('\n');
  }
}
