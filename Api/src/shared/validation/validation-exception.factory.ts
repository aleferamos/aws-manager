import { BadRequestException } from '@nestjs/common';
import type { ValidationError } from 'class-validator';

import { I18nService } from '../i18n/i18n.service';
import { TranslationKey } from '../i18n/backend.translations';

interface ValidationErrorResponse {
  field: string;
  code: string;
  message: string;
}

export function createValidationExceptionFactory(i18n: I18nService) {
  return (validationErrors: ValidationError[]) => {
    const errors = flattenValidationErrors(validationErrors, i18n);

    return new BadRequestException({
      code: 'VALIDATION_ERROR',
      message: i18n.translate('validation.invalidPayload'),
      errors,
    });
  };
}

function flattenValidationErrors(
  validationErrors: ValidationError[],
  i18n: I18nService,
  parentPath = '',
): ValidationErrorResponse[] {
  const errors: ValidationErrorResponse[] = [];

  for (const validationError of validationErrors) {
    const propertyPath = parentPath
      ? `${parentPath}.${validationError.property}`
      : validationError.property;

    if (validationError.constraints) {
      for (const constraintName of Object.keys(validationError.constraints)) {
        errors.push({
          field: propertyPath,
          code: constraintName,
          message: translateConstraint(
            constraintName,
            propertyPath,
            validationError,
            i18n,
          ),
        });
      }
    }

    if (validationError.children?.length) {
      errors.push(
        ...flattenValidationErrors(
          validationError.children,
          i18n,
          propertyPath,
        ),
      );
    }
  }

  return errors;
}

function translateConstraint(
  constraintName: string,
  property: string,
  validationError: ValidationError,
  i18n: I18nService,
): string {
  const contexts = validationError.contexts ?? {};
  const context = contexts[constraintName] ?? {};

  const params = {
    property,
    ...context,
  };

  const constraintMap: Record<string, TranslationKey> = {
    isNotEmpty: 'validation.required',
    isString: 'validation.string',
    isNumber: 'validation.number',
    isBoolean: 'validation.boolean',
    isEmail: 'validation.email',
    minLength: 'validation.minLength',
    maxLength: 'validation.maxLength',
    min: 'validation.min',
    max: 'validation.max',
    isDateString: 'validation.dateString',
  };

  const translationKey = constraintMap[constraintName] ?? 'validation.unknown';

  return i18n.translate(translationKey, params);
}
