import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UpdateAppConfigurationDto } from './dto/update-app-configuration.dto';
import { AppConfiguration } from './entities/app-configuration.entity';

const CONFIGURATION_ID = 1;
const DEFAULT_SITE_URL = 'http://localhost:4501';

export interface AppConfigurationView {
  id: number;
  siteUrl: string;
  jsonConfig: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class ConfigurationService {
  private storageReady = false;

  constructor(
    @InjectRepository(AppConfiguration)
    private readonly repository: Repository<AppConfiguration>,
  ) {}

  async get(): Promise<AppConfigurationView> {
    await this.ensureStorage();

    const configuration = await this.repository.findOne({
      where: {
        id: CONFIGURATION_ID,
      },
    });

    if (configuration) {
      return this.toView(configuration);
    }

    const savedConfiguration = await this.repository.save(
      this.repository.create({
        id: CONFIGURATION_ID,
        jsonConfig: this.getDefaultJsonConfig(),
      }),
    );

    return this.toView(savedConfiguration);
  }

  async update(
    dto: UpdateAppConfigurationDto,
  ): Promise<AppConfigurationView> {
    await this.ensureStorage();

    const configuration = await this.repository.findOneOrFail({
      where: {
        id: CONFIGURATION_ID,
      },
    });
    const jsonConfig = {
      ...this.asJsonConfig(configuration.jsonConfig),
      ...this.asJsonConfig(dto.jsonConfig),
    };
    jsonConfig['site_url'] = this.normalizeSiteUrl(jsonConfig['site_url']);

    configuration.jsonConfig = jsonConfig;

    const savedConfiguration = await this.repository.save(configuration);

    return this.toView(savedConfiguration);
  }

  async getPasswordDefinitionUrlBase(): Promise<string> {
    const configuration = await this.get();

    return configuration.siteUrl;
  }

  private async ensureStorage(): Promise<void> {
    if (this.storageReady) {
      return;
    }

    await this.repository.query(`
      CREATE TABLE IF NOT EXISTS public.app_configuration (
        id smallint NOT NULL,
        json_config jsonb NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL,
        updated_at timestamp DEFAULT now() NOT NULL,
        CONSTRAINT app_configuration_pkey PRIMARY KEY (id)
      )
    `);

    await this.migrateSiteUrlColumn();

    await this.repository.query(
      `
        INSERT INTO public.app_configuration (id, json_config)
        VALUES ($1, $2::jsonb)
        ON CONFLICT (id) DO NOTHING
      `,
      [CONFIGURATION_ID, JSON.stringify(this.getDefaultJsonConfig())],
    );

    this.storageReady = true;
  }

  private async migrateSiteUrlColumn(): Promise<void> {
    await this.repository.query(`
      ALTER TABLE public.app_configuration
      ADD COLUMN IF NOT EXISTS json_config jsonb
    `);

    const hasSiteUrlColumn = await this.hasColumn('site_url');

    if (hasSiteUrlColumn) {
      await this.repository.query(
        `
          UPDATE public.app_configuration
          SET json_config = jsonb_build_object(
            'site_url',
            COALESCE(site_url, $1)
          )
          WHERE json_config IS NULL
        `,
        [process.env.FRONTEND_SITE_URL ?? DEFAULT_SITE_URL],
      );
    } else {
      await this.repository.query(
        `
          UPDATE public.app_configuration
          SET json_config = $1::jsonb
          WHERE json_config IS NULL
        `,
        [JSON.stringify(this.getDefaultJsonConfig())],
      );
    }

    await this.repository.query(`
      ALTER TABLE public.app_configuration
      ALTER COLUMN json_config SET NOT NULL
    `);
  }

  private async hasColumn(columnName: string): Promise<boolean> {
    const result = (await this.repository.query(
      `
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'app_configuration'
            AND column_name = $1
        ) AS exists
      `,
      [columnName],
    )) as Array<{ exists: boolean }>;

    return result[0]?.exists === true;
  }

  private toView(configuration: AppConfiguration): AppConfigurationView {
    const jsonConfig = this.asJsonConfig(configuration.jsonConfig);

    return {
      id: configuration.id,
      siteUrl: this.getSiteUrl(jsonConfig),
      jsonConfig,
      createdAt: configuration.createdAt,
      updatedAt: configuration.updatedAt,
    };
  }

  private getSiteUrl(jsonConfig: Record<string, unknown>): string {
    const siteUrl = jsonConfig['site_url'];

    return typeof siteUrl === 'string' && siteUrl.trim()
      ? siteUrl
      : this.getDefaultSiteUrl();
  }

  private getDefaultJsonConfig(): Record<string, unknown> {
    return {
      site_url: this.getDefaultSiteUrl(),
    };
  }

  private getDefaultSiteUrl(): string {
    return process.env.FRONTEND_SITE_URL ?? DEFAULT_SITE_URL;
  }

  private normalizeSiteUrl(value: unknown): string {
    if (typeof value !== 'string') {
      throw this.invalidSiteUrlException();
    }

    const siteUrl = value.trim().replace(/\/+$/, '');

    if (!siteUrl || siteUrl.length > 255) {
      throw this.invalidSiteUrlException();
    }

    try {
      const url = new URL(siteUrl);

      if (!['http:', 'https:'].includes(url.protocol)) {
        throw this.invalidSiteUrlException();
      }
    } catch {
      throw this.invalidSiteUrlException();
    }

    return siteUrl;
  }

  private invalidSiteUrlException(): BadRequestException {
    return new BadRequestException({
      code: 'CONFIGURATION_INVALID_SITE_URL',
      message: 'Invalid site URL.',
    });
  }

  private asJsonConfig(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  }
}
