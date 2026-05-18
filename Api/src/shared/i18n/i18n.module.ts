import { Global, Module } from '@nestjs/common';

import { I18nService } from './i18n.service';
import { LanguageContextService } from './language-context.service';

@Global()
@Module({
  providers: [I18nService, LanguageContextService],
  exports: [I18nService, LanguageContextService],
})
export class I18nModule {}
