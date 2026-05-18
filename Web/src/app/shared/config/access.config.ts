export type UserType = 'ROOT' | string;

export interface AccessRule {
  allowedTypes: readonly UserType[];
}

export const ACCESS_RULES = {
  adminArea: {
    allowedTypes: ['ROOT'],
  },
} as const satisfies Record<string, AccessRule>;

export function canAccessByType(userType: UserType | null | undefined, rule?: AccessRule): boolean {
  if (!rule) {
    return true;
  }

  if (!userType) {
    return false;
  }

  return rule.allowedTypes.includes(userType);
}
