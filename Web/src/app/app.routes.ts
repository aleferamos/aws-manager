import { Routes } from '@angular/router';

import { SetPasswordAdminArea } from './page/set-password-admin-area/set-password-admin-area';
import { SetPassword } from './page/set-password/set-password';
import { Login } from './page/login/login';
import { Home } from './page/home/home';
import { UserQuery } from './page/admin-area/user/user-query/user-query';
import { CredentialQuery } from './page/admin-area/credential/credential-query/credential-query';
import { AuthorityQuery } from './page/admin-area/authority/authority-query/authority-query';
import { Ec2Query } from './page/ec2/ec2-query/ec2-query';
import { SecurityGroupsQuery } from './page/security-groups/security-groups-query/security-groups-query';
import { S3Query } from './page/s3/s3-query/s3-query';
import { Configuration } from './page/configuration/configuration';

import { AppLayout } from './layout/app-layout/app-layout';

import { ACCESS_RULES } from './shared/config/access.config';
import { accessGuard } from './shared/guards/access.guard';
import { adminHasPasswordGuard } from './shared/guards/admin-has-password.guard';
import { publicOnlyGuard } from './shared/guards/public-only.guard';
import { authGuard } from './shared/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'set-password-admin-area',
    component: SetPasswordAdminArea,
  },
  {
    path: 'set-password',
    component: SetPassword,
  },
  {
    path: 'login',
    component: Login,
    canActivate: [adminHasPasswordGuard, publicOnlyGuard],
  },
  {
    path: '',
    component: AppLayout,
    canActivate: [authGuard],
    children: [
      {
        path: 'home',
        component: Home,
      },
      {
        path: 'ec2',
        component: Ec2Query,
      },
      {
        path: 'security-groups',
        component: SecurityGroupsQuery,
      },
      {
        path: 's3',
        component: S3Query,
      },
      {
        path: 'configuration',
        component: Configuration,
        canActivate: [accessGuard],
        data: {
          accessRule: ACCESS_RULES.adminArea,
        },
      },
      {
        path: 'admin-area/user',
        component: UserQuery,
        canActivate: [accessGuard],
        data: {
          accessRule: ACCESS_RULES.adminArea,
        },
      },
      {
        path: 'admin-area/credential',
        component: CredentialQuery,
        canActivate: [accessGuard],
        data: {
          accessRule: ACCESS_RULES.adminArea,
        },
      },
      {
        path: 'admin-area/authority',
        component: AuthorityQuery,
        canActivate: [accessGuard],
        data: {
          accessRule: ACCESS_RULES.adminArea,
        },
      },
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'home',
  },
];
