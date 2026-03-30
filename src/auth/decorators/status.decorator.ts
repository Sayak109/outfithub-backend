import { SetMetadata } from '@nestjs/common';
import { Account } from '../enums/account.enum';
import { Approval } from '../enums/approval.enum';

export const ACCOUNT_KEY = 'account';
export const APPROVAL_KEY = 'approval';
export const AccountStatus = (...account: Account[]) => SetMetadata(ACCOUNT_KEY, account);
export const ApprovalStatus = (...approval: Approval[]) => SetMetadata(APPROVAL_KEY, approval);