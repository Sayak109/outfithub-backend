import { BadRequestException, ForbiddenException, Injectable, Req } from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { comparePassword, generateRandomID, hashPassword } from 'src/common/utils/common';
import { loginDto } from './dto/login-auth.dto';
import { Request, Response } from 'express';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { v4 as uuidv4 } from 'uuid';
import { addMinutes } from 'date-fns';
import * as bcrypt from 'bcrypt';
import { MailService } from 'src/mail/mail.service';
import { CreateSidebarDto } from './dto/create-sidebar.dto';
import { UpdateSidebarDto } from './dto/update-sidebar.dto';
import { UpdateSidebarRankDto } from './dto/update-sidebar-rank.dto';
import { ApiResponse } from '@/common/dto/response.dto';
import { generateOTP } from '@/common/helper/common.helper';
import * as crypto from 'crypto';
@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private mailService: MailService
  ) { }
  async signup(dto: CreateAuthDto, expiresAt: Date, userAgent: string, ip_address?: string) {
    try {
      let isUserAvailable = await this.prisma.user.count({
        where: {
          email: {
            equals: `${dto.email}`.toLowerCase(),
            mode: "insensitive"
          }
        }
      });

      if (isUserAvailable) {
        throw new BadRequestException(new ApiResponse(null, 'Email Id already exists!', false))
      } else {
        const hashedPassword = dto.password ? await hashPassword(dto.password) : null;
        let user: any = '';
        user = await this.prisma.user.create({
          data: {
            first_name: dto.first_name,
            last_name: dto.last_name,
            email: dto.email,
            password: hashedPassword,
            role_id: dto.role_id,
            account_status_id: 1,
            approval_status_id: dto.role_id === 3 ? 1 : 2,
            provider: "EMAIL",
          }
        });
        if (dto.guest_id) {
          await this.mergeGuestCart(BigInt(dto.guest_id), BigInt(user.id));
        }
        if (user && user.id) {
          const categories = await this.prisma.notificationPreferenceCategory.findMany({
            select: { id: true }
          });

          const data = categories.map(category => ({
            user_id: user.id,
            preference_category_id: category.id
          }));

          await this.prisma.notificationPreference.createMany({
            data,
            skipDuplicates: true,
          });
        }

        let token = await this.signToken(Number(user.id), user.email);

        if (user && user.id) {
          await this.prisma.userToken.create({
            data: {
              user_id: user.id,
              token: token.access_token,
              expires_at: expiresAt,
              user_agent: userAgent,
              ip_address: ip_address,
            }
          })
        }
        return token;
      }

    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error?.message);
    }
  }

  async signin(dto: loginDto, expiresAt: Date, userAgent: string, ip_address?: string) {
    // find the user by email
    try {
      const user =
        await this.prisma.user.findFirst({
          where: {
            email: {
              equals: dto.email,
              mode: 'insensitive',
            },
          },
        });

      if (user?.account_status_id === BigInt(2)) {
        throw new BadRequestException('Sorry, your account is Suspended.');
      }

      if (user?.account_status_id === BigInt(3)) {
        throw new BadRequestException('Sorry, your account is Deactivated.');
      }
      // if user does not exist throw exception
      if (!user) {
        if (dto.auth_type != "EMAIL") {
          if (dto.auth_type === "GOOGLE" || dto.auth_type === "APPLE") {
            if (dto.provider_id == null || dto.provider_id == '' || dto.provider_id == undefined) {
              throw new BadRequestException(
                'Provider Id is required!',
              );
            }

            const hashedProviderId = await hashPassword(dto.provider_id);

            let user = await this.prisma.user.create({
              data: {
                first_name: dto.first_name,
                last_name: dto.last_name,
                email: dto.email,
                provider: dto.auth_type,
                role_id: 4,
                account_status_id: 1,
                approval_status_id: 2,
                provider_id: hashedProviderId
              }
            });

            let token = await this.signToken(Number(user.id), user.email);

            if (user && user.id) {
              await this.prisma.userToken.create({
                data: {
                  user_id: user.id,
                  token: token.access_token,
                  expires_at: expiresAt,
                  user_agent: userAgent,
                  ip_address: ip_address
                }
              })
            }

            return token;
          } else {
            throw new ForbiddenException(
              'Incorrect email or password.',
            );
          }

        } else {
          throw new ForbiddenException(
            'Incorrect email or password.',
          );
        }
      }

      if (dto.auth_type !== user.provider) {
        throw new BadRequestException(`Please login using ${user.provider === "EMAIL" ? "Email and Password" : user.provider === "GOOGLE" ? "'Continue with Google'" : "'Continue with Apple'"}`);
        // throw new BadRequestException(`Account already exists with ${user.provider.toLowerCase()} ${user.provider === "EMAIL" ? ' and password' : ''} signin!`);
      }

      if (dto.auth_type === "EMAIL") {
        if (dto.password && user.password) {
          const pwMatches = await comparePassword(
            dto.password,
            user.password
          );

          if (!pwMatches)
            throw new ForbiddenException(
              'Incorrect email or password.',
            );
        } else {
          throw new ForbiddenException(
            'Incorrect email or password.',
          );
        }
      } else if (dto.auth_type === "GOOGLE" || dto.auth_type === "APPLE") {
        if (dto.provider_id == null || dto.provider_id == '' || dto.provider_id == undefined) {
          throw new BadRequestException(
            'Provider Id is required!',
          );
        }

        if (user.provider_id) {
          const providerIdMatches = await comparePassword(
            dto.provider_id,
            user.provider_id
          );

          if (!providerIdMatches)
            throw new BadRequestException(
              'Credentials incorrect',
            );
        } else {
          throw new BadRequestException(
            'Credentials incorrect',
          );
        }
      }

      let token = await this.signToken(Number(user.id), user.email);

      if (user && user.id) {
        await this.prisma.userToken.create({
          data: {
            user_id: user.id,
            token: token.access_token,
            expires_at: expiresAt,
            user_agent: userAgent,
            ip_address: ip_address
          }
        })
        if (dto.guest_id) {
          await this.mergeGuestCart(BigInt(dto.guest_id), BigInt(user.id));
        }
      }
      if (user.role_id === BigInt(1) || user.role_id === BigInt(2)) {
        await this.prisma.adminActivityLog.create({
          data: {
            action: 'LOGIN',
            description: `User (email: ${user.email}) logged in.`,
            ip: ip_address,
            userAgent: userAgent,
          },
        });
      }
      const data = {
        success: true,
        access_token: token.access_token
      }
      return data;
    } catch (error: any) {
      throw new BadRequestException(error?.message);
    }
  }

  async createGuestUser(expiresAt: Date, userAgent: string, ip_address?: string) {
    try {
      const guestEmail = await this.generateGuestEmail();
      const user = await this.prisma.user.create({
        data: {
          first_name: 'Guest',
          last_name: 'User',
          email: guestEmail,
          password: null,
          role_id: 5,
          account_status_id: 1,
          approval_status_id: 2,
          provider: "EMAIL",
          is_temporary: true
        }
      });

      const token = await this.signToken(Number(user.id), user.email);

      if (user && user.id) {
        await this.prisma.userToken.create({
          data: {
            user_id: user.id,
            token: token.access_token,
            expires_at: expiresAt,
            user_agent: userAgent,
            ip_address: ip_address,
          }
        });
      }

      return token;
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error?.message);
    }
  }

  async generateGuestEmail() {
    const id1 = crypto.randomBytes(9).toString('base64url');
    // const id2 = nanoid(12);
    const id3 = uuidv4().replace(/-/g, '').slice(0, 12);

    const allIds = [id1, id3];
    const randomId = allIds[Math.floor(Math.random() * allIds.length)];

    return `guest-${randomId}@example.com`;
  }

  async mergeGuestCart(guest_id: bigint, real_user_id: bigint) {
    try {
      await this.prisma.cart.updateMany({
        where: { customer_id: guest_id },
        data: { customer_id: real_user_id }
      });

      const carts = await this.prisma.cart.findMany({
        where: { customer_id: real_user_id },
        include: { cartAttributes: true }
      });

      const cartMap = new Map<string, bigint>();
      for (const cart of carts) {
        const key = `${cart.product_id}-${cart.cartAttributes
          .map(attr => attr.attribute_term_id)
          .sort()
          .join('-')}`;

        if (cartMap.has(key)) {
          const existingId = cartMap.get(key)!;
          await this.prisma.cart.update({
            where: { id: existingId },
            data: { quantity: { increment: cart.quantity } }
          });
          await this.prisma.cartAttributeTerm.deleteMany({ where: { cart_id: cart.id } });
          await this.prisma.cart.delete({ where: { id: cart.id } });
        } else {
          cartMap.set(key, cart.id);
        }
      }

      await this.prisma.userFCMToken.deleteMany({ where: { user_id: guest_id } });
      await this.prisma.userToken.deleteMany({ where: { user_id: guest_id } });
      await this.prisma.user.delete({ where: { id: guest_id } });

    } catch (error) {
      console.error('Error merging guest cart:', error);
    }
  }


  async signToken(
    userId: number,
    email: string,
  ): Promise<{ access_token: string }> {
    const payload = {
      sub: userId,
      email,
    };
    const secret = this.config.get('JWT_SECRET');
    const expireAt = this.config.get('JWT_EXPIRATION_TIME');

    const token = await this.jwt.signAsync(
      payload,
      {
        expiresIn: expireAt,
        secret: secret,
      },
    );

    return {
      access_token: token,
    };
  }

  async logout(user_id: bigint, token: string = '', req: Request, res: Response) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: user_id
      }
    })
    await this.prisma.userToken.updateMany({
      where: { token },
      data: { is_revoked: true },
    });
    if (user?.role_id === BigInt(1) || user?.role_id === BigInt(2)) {
      await this.prisma.adminActivityLog.create({
        data: {
          action: 'LOGIN',
          description: `User (email: "${user.email}") logged out.`,
          ip: req.ip,
          userAgent: req.headers['user-agent'] || '',
        },
      });
    }
    res.clearCookie('token');
    return true;
  }

  async logoutAll(userId: bigint, req: Request, res: Response) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId
      }
    })
    await this.prisma.userToken.updateMany({
      where: {
        user_id: userId,
        is_revoked: false,
        expires_at: { gt: new Date() },
      },
      data: { is_revoked: true },
    });

    if (user?.role_id === BigInt(1) || user?.role_id === BigInt(2)) {
      await this.prisma.adminActivityLog.create({
        data: {
          action: 'LOGIN',
          description: `User (email: "${user.email}") logged out from all device.`,
          ip: req.ip,
          userAgent: req.headers['user-agent'] || '',
        },
      });
    }
    res.clearCookie('token');
    return true;
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        email: {
          equals: dto.email,
          mode: 'insensitive',
        },
      },
    });
    if (!user) {
      throw new BadRequestException(`Email address not found.`)
    }
    else {
      if (user?.provider !== 'EMAIL') {
        if (user?.provider === "APPLE") {
          throw new BadRequestException(`Account created with 'Continue with Apple'`)
        } else if (user?.provider === "GOOGLE") {
          throw new BadRequestException(`Account created with 'Continue with Google'`)
        }
      }

      const token = await generateRandomID(12);
      const expiry = addMinutes(new Date(), 5);

      await this.prisma.user.update({
        where: {
          id: user.id,
        },
        data: { reset_token: token, reset_token_exp: expiry },
      });

      const resetLink = `${this.config.get('FRONT_BASE_URL')}/admin/forgot-password?token=${token}`;
      setImmediate(async () => {
        try {
          await this.mailService.sendResetPasswordEmail(user.email, resetLink, token, dto.is_mobile);
        } catch (error) {
          console.error("Error sending OTP", error);
        }
      });
      return true;
    }
  }


  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        reset_token: dto.token,
        reset_token_exp: { gt: new Date() },
      }
    });

    if (!user) {
      return false;
    }

    const hashed = await bcrypt.hash(dto.new_password, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashed,
        reset_token: null,
        reset_token_exp: null,
      },
    });

    return true;
  }
}
