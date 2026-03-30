import {
    CanActivate,
    ExecutionContext,
    Injectable,
    ForbiddenException,
    BadRequestException,
    UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '../enums/role.enum';
import { ApiResponse } from 'src/common/dto/response.dto';
import { Account } from '../enums/account.enum';
import { ACCOUNT_KEY, APPROVAL_KEY } from '../decorators/status.decorator';
import { Approval } from '../enums/approval.enum';

@Injectable()
export class AccountStatusGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredStatus = this.reflector.getAllAndOverride<Account[]>(ACCOUNT_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredStatus) return true;

        const { user } = context.switchToHttp().getRequest();

        if (!requiredStatus.includes(user.account_status.title)) {
            throw new UnauthorizedException('You do not have access to this resource!');
        }

        return true;
    }
}

@Injectable()
export class ApprovalStatusGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredStatus = this.reflector.getAllAndOverride<Approval[]>(APPROVAL_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredStatus) return true;

        const { user } = context.switchToHttp().getRequest();

        if (!requiredStatus.includes(user.approval_status.title)) {
            throw new UnauthorizedException('You do not have access to this resource');
        }

        return true;
    }
}