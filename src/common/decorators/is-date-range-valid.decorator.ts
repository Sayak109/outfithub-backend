import {
    registerDecorator,
    ValidationOptions,
    ValidatorConstraint,
    ValidatorConstraintInterface,
    ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'IsValidOptionalDateRange', async: false })
export class IsValidOptionalDateRangeConstraint implements ValidatorConstraintInterface {
    validate(_: any, args: ValidationArguments): boolean {
        const { start_date, end_date } = args.object as any;

        // If neither is provided: OK
        if (!start_date && !end_date) return true;

        // If only one is provided: invalid
        if ((start_date && !end_date) || (!start_date && end_date)) return false;

        // If both are provided: validate date order
        const start = new Date(start_date);
        const end = new Date(end_date);

        return !isNaN(start.getTime()) && !isNaN(end.getTime()) && start <= end;
    }

    defaultMessage(args: ValidationArguments): string {
        return 'Both start_date and end_date must be provided, and start_date must be before or equal to end_date';
    }
}

export function IsValidOptionalDateRange(validationOptions?: ValidationOptions) {
    return function (constructor: Function) {
        registerDecorator({
            name: 'IsValidOptionalDateRange',
            target: constructor,
            propertyName: undefined as any, // important: no specific property
            options: validationOptions,
            validator: IsValidOptionalDateRangeConstraint,
        });
    };
}