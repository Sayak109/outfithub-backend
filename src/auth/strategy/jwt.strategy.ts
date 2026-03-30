import { Injectable, Req } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { Request } from "express";
import { ExtractJwt, Strategy } from "passport-jwt";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(config: ConfigService, private prisma: PrismaService) {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                (req: Request) => {
                    return req?.cookies.token;
                }
            ]),
            // ignoreExpiration: true,
            secretOrKey: config.get<string>('JWT_SECRET')!,
            passReqToCallback: true
        });
    }

    async validate(req: Request, payload: {
        sub: number;
        email: string;
    }) {
        const usr = await this.prisma.user.findUnique({
            where: {
                id: payload?.sub
            },
            select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
                password: true,
                phone_no: true,
                provider: true,
                role: {
                    select: {
                        id: true,
                        title: true,
                    }
                },
                account_status: {
                    select: {
                        id: true,
                        title: true,
                    }
                },
                approval_status: {
                    select: {
                        id: true,
                        title: true,
                    }
                },
                image: true,
                // reset_token: true,
                // reset_token_exp: true,
                // provider_id: true,
                // fcm_token: true,
                is_temporary: true,
                created_at: true,
                updated_at: true,
            }
        });

        if (!usr) {
            return false;
        }

        if (usr.account_status.id === BigInt(3)) {
            return false;
        }

        const token = req?.cookies['token'] || '';
        const tokenRecord = await this.prisma.userToken.findUnique({ where: { token, user_id: usr.id } });

        if (!tokenRecord || tokenRecord.is_revoked || tokenRecord.expires_at < new Date()) {
            return false;
        }

        const { password, ...user } = usr;
        if (user.image) {
            user.image = `${process.env.BASE_PATH}/${process.env.IMAGE_PATH}/${process.env.USER_PROFILE_IMAGE_PATH}/${user.id}/${user.image}`;
        } else {
            user.image = ""
        }
        return user;
    }
}
