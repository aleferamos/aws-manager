import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { I18nModule } from './shared/i18n/i18n.module';
import { LanguageMiddleware } from './shared/i18n/language.middleware';
import { CredentialModule } from './credential/credential.module';
import { AuthorityModule } from './authority/authority.module';
import { JwtAuthModule } from './shared/auth/jwt-auth.module';
import { AccessModule } from './access/access.module';
import { BillingModule } from './billing/billing.module';
import { Ec2Module } from './ec2/ec2.module';
import { SecurityGroupModule } from './security-group/security-group.module';
import { ConfigurationModule } from './configuration/configuration.module';
import { S3Module } from './s3/s3.module';
import { CloudFrontModule } from './cloud-front/cloud-front.module';
import { User } from './user/entities/user.entity';
import { Person } from './user/entities/person.entity';
import { Credential } from './credential/entities/credential.entity';
import { UserCredential } from './credential/entities/user-credential.entity';
import { UserCredentialAuthority } from './credential/entities/user-credential-authority.entity';
import { Authority } from './authority/entities/authority.entity';
import { UserAuthority } from './authority/entities/user-authority.entity';
import { AppConfiguration } from './configuration/entities/app-configuration.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../.env'],
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT ?? 4502),
      username: process.env.DB_USERNAME ?? 'aws_manager',
      password: process.env.DB_PASSWORD ?? 'aws_manager_dev',
      database: process.env.DB_DATABASE ?? 'aws_manager',
      retryAttempts: 10,
      retryDelay: 3000,
      entities: [
        User,
        Person,
        Credential,
        UserCredential,
        UserCredentialAuthority,
        Authority,
        UserAuthority,
        AppConfiguration,
      ],
      autoLoadEntities: true,
      synchronize: false,
    }),
    I18nModule,
    JwtAuthModule,
    UserModule,
    AuthModule,
    CredentialModule,
    AuthorityModule,
    AccessModule,
    BillingModule,
    Ec2Module,
    SecurityGroupModule,
    S3Module,
    CloudFrontModule,
    ConfigurationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LanguageMiddleware).forRoutes('*');
  }
}
