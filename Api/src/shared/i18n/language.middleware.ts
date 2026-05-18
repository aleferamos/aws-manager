import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

import { I18nService } from './i18n.service';
import { LanguageContextService } from './language-context.service';

@Injectable()
export class LanguageMiddleware implements NestMiddleware {
  constructor(
    private readonly i18n: I18nService,
    private readonly languageContext: LanguageContextService,
  ) {}

  use(request: Request, response: Response, next: NextFunction): void {
    const acceptLanguage = request.headers['accept-language'];

    const language = this.i18n.normalizeLanguage(
      Array.isArray(acceptLanguage) ? acceptLanguage[0] : acceptLanguage,
    );

    this.languageContext.run(language, () => {
      next();
    });
  }
}
