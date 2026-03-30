import { BadRequestException, ForbiddenException, Injectable, NotFoundException, UseGuards } from '@nestjs/common';
import { CreateUsersDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { GetUsersDto } from './dto/get-admin.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { comparePassword, hashPassword } from '@/common/utils/common';
import { CreateUsersProfileDto } from './dto/create-userprofile.dto';
import { LogReportDto } from './dto/admin-log.dto';
import { MailService } from '@/mail/mail.service';
import { createNotification } from '@/common/helper/common.helper';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AdminService {
  constructor(
    private jwt: JwtService,
    private prisma: PrismaService,
    private config: ConfigService,
    private mailService: MailService
  ) { }

  async create(createUsersDto: CreateUsersDto) {
    try {
      let isUserAvailable = await this.prisma.user.count({
        where: {
          email: {
            equals: `${createUsersDto.email}`.toLowerCase(),
            mode: "insensitive"
          }
        }
      });
      if (!createUsersDto.email) {
        throw new BadRequestException('Email address required!')
      }
      if (isUserAvailable) {
        throw new BadRequestException('Email address already exists!')
      }
      const hashedPassword = createUsersDto.password ? await hashPassword(createUsersDto.password) : null;
      const user = await this.prisma.user.create({
        data: {
          first_name: createUsersDto.first_name,
          last_name: createUsersDto.last_name,
          email: createUsersDto.email,
          phone_no: createUsersDto.phone_no,
          password: hashedPassword,
          provider: "EMAIL",
          role_id: createUsersDto.role_id,
          account_status_id: createUsersDto.account_status_id,
          approval_status_id: createUsersDto.approval_status_id
        }
      })
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
      return user
    } catch (error) {
      throw error
    }
  }

  async createProfile(user_id: bigint, createUsersProfileDto: CreateUsersProfileDto, files: {
    profile?: { filename: string, path: string },
    logo?: { filename: string, path: string },
    id_proof?: { filename: string, path: string }
  }) {
    try {
      const imageFileName = files?.profile?.filename ?? '';
      const logoFileName = files?.logo?.filename ?? '';
      const idProofFileName = files?.id_proof?.filename ?? '';

      let profile: any;
      if (imageFileName && imageFileName !== '') {
        profile = imageFileName;
      } else if (imageFileName === "null") {
        profile = null;
      }

      let logo: any;
      if (logoFileName && logoFileName !== 'null') {
        logo = logoFileName;
      }
      else if (logoFileName === "null") {
        logo = null;
      }

      let id_proof: any;
      if (idProofFileName && idProofFileName !== 'null') {
        id_proof = idProofFileName;
      }
      else if (imageFileName === "null") {
        id_proof = null;
      }

      const profile_image = await this.prisma.user.update({
        where: {
          id: user_id
        },
        data: {
          image: profile
        }
      })

      const findProfile = await this.prisma.sellerProfile.findUnique({
        where: {
          user_id: user_id
        }
      })
      const findKyc = await this.prisma.sellerKYC.findUnique({
        where: {
          user_id: user_id
        }
      })
      const id1 = crypto.randomBytes(6).toString('base64url').slice(0, 8);
      const id2 = uuidv4().replace(/-/g, '').slice(0, 8);
      const id3 = crypto.createHash('sha256').update(Date.now().toString() + Math.random().toString()).digest('hex').slice(0, 8);

      const allIds = [id1, id2, id3];
      const randomId = allIds[Math.floor(Math.random() * allIds.length)];

      const profileData = {
        user_id: user_id!,
        slug: randomId,
        mobile_number: createUsersProfileDto.mobile_number,
        gender: createUsersProfileDto.gender!,
        address1: createUsersProfileDto.address1!,
        landmark: createUsersProfileDto.landmark || "",
        city: createUsersProfileDto.city!,
        state: createUsersProfileDto.state!,
        country: createUsersProfileDto.country!,
        pincode: createUsersProfileDto.pincode!,
        business_name: createUsersProfileDto.business_name!,
        business_tag: createUsersProfileDto.business_tag!,
        business_logo: logo,
        bank_business_name: createUsersProfileDto.bank_business_name!,
        bank_name: createUsersProfileDto.bank_name!,
        account_number: createUsersProfileDto.account_number!,
        branch_name: createUsersProfileDto.branch_name!,
        ifsc_code: createUsersProfileDto.ifsc_code!,
        fake_seller: createUsersProfileDto.fake_seller || false,
      };

      let seller: any;
      if (findProfile) {
        seller = await this.prisma.sellerProfile.update({
          where: {
            user_id
          },
          data: profileData
        });
      } else {
        seller = await this.prisma.sellerProfile.create({
          data: profileData
        });
      }

      const kycData = {
        user_id: user_id,
        id_proof: id_proof || "",
        GSTIN: createUsersProfileDto.GSTIN || "",
        PAN: createUsersProfileDto.PAN || ""
      }
      if (findKyc) {
        const KYC = await this.prisma.sellerKYC.update({
          where: {
            user_id: user_id,
          },
          data: kycData
        })
      } else {
        const KYC = await this.prisma.sellerKYC.create({
          data: kycData
        })
      }

      return seller;
    }
    catch (error) {
      throw error
    }
  }

  async findAll(getUseresDto: GetUsersDto) {
    try {
      const prisma1 = await this.prisma.$extends({
        result: {
          user: {
            image: {
              needs: { id: true, image: true },
              compute(image) {
                if (image.image != null && image.image != '' && image.image != undefined) {
                  return `${process.env.BASE_PATH}/${process.env.IMAGE_PATH}/${process.env.USER_PROFILE_IMAGE_PATH}/${image.id}/${image.image}`
                }
                else {
                  return "";
                }
              },
            },
          },
          sellerProfile: {
            business_logo: {
              needs: { user_id: true, business_logo: true },
              compute(id_proof) {
                if (id_proof.business_logo) {
                  return `${process.env.BASE_PATH}/${process.env.IMAGE_PATH}/${process.env.USER_BUSINESS_IMAGE_PATH}/${id_proof.user_id}/${id_proof.business_logo}`;
                } else {
                  return "";
                }
              }
            }
          },
        },
      })
      const skip = (getUseresDto.page - 1) * getUseresDto.rowsPerPage;
      const take = getUseresDto?.rowsPerPage

      let conditions: any = [];
      let searchWord: string = '';
      if (getUseresDto?.search) {
        var str = (getUseresDto?.search).trim();
        searchWord = str;
        conditions.push({
          OR: [
            { email: { contains: searchWord, mode: "insensitive" } },
            { phone_no: { contains: searchWord, mode: "insensitive" } },
            { first_name: { contains: searchWord, mode: "insensitive" } },
            { last_name: { contains: searchWord, mode: "insensitive" } },
            {
              AND: [
                { first_name: { contains: searchWord.split(" ")[0], mode: "insensitive" } },
                { last_name: { contains: searchWord.split(" ")[1] ?? "", mode: "insensitive" } }
              ]
            },
            { sellerProfile: { mobile_number: { contains: searchWord, mode: "insensitive" } } },
            { sellerProfile: { city: { contains: searchWord, mode: "insensitive" } } }
          ]
        });
      }

      if (getUseresDto.role_id) {
        conditions.push({
          role: {
            id: getUseresDto.role_id
          }
        })
      }

      if (getUseresDto.account_status_id) {
        conditions.push({
          account_status: {
            id: getUseresDto.account_status_id
          }
        })
      }

      if (getUseresDto.approval_status_id) {
        conditions.push({
          approval_status: {
            id: getUseresDto.approval_status_id
          }
        })
      }

      let orderBy: any[] = [];
      if (getUseresDto.role_id === 3) {
        orderBy.push({
          sellerProfile: {
            created_at: 'desc'
          }
        });
      } else {
        orderBy.push({ id: 'desc' });
      }

      const usersRaw = await prisma1.user.findMany({
        skip: skip,
        take: take,
        orderBy,
        where: {
          AND: conditions
        },
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
          phone_no: true,
          image: true,
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
          sellerProfile: {
            select: {
              slug: true,
              mobile_number: true,
              business_name: true,
              business_logo: true,
              fake_seller: true,
              created_at: true,
            }
          },
          Order: {
            select: {
              order_items: {
                select: {
                  id: true,
                  order_status_id: true,
                },
              },
            },
          },
          created_at: true
        }
      });

      const users = usersRaw.map((user) => {
        let totalOrders = 0;
        let returnOrders = 0;

        user.Order.forEach((order) => {
          const items = order.order_items;
          totalOrders += items.length;

          returnOrders += items.filter((item) =>
            [10, 11, 13, 14].includes(Number(item.order_status_id))
          ).length;
        });

        const { Order, ...rest } = user;
        return {
          ...rest,
          totalOrders,
          returnOrders,
        };
      });
      const totalCount = await prisma1.user.count({
        where: {
          AND: conditions,
        },
      });
      return { Total: totalCount, Users: users };
    } catch (error) {
      throw error
    }
  }

  async findAllSellers() {
    try {
      const prisma1 = await this.prisma.$extends({
        result: {
          user: {
            image: {
              needs: { id: true, image: true },
              compute(image) {
                if (image.image != null && image.image != '' && image.image != undefined) {
                  return `${process.env.BASE_PATH}/${process.env.IMAGE_PATH}/${process.env.USER_PROFILE_IMAGE_PATH}/${image.id}/${image.image}`
                }
                else {
                  return "";
                }
              },
            },
          }
        },
      })

      const user = await prisma1.user.findMany({
        orderBy: {
          id: 'desc'
        },
        where: {
          role_id: 3,
          approval_status_id: 2,
          account_status_id: {
            in: [1, 4]
          }
        },
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
          phone_no: true,
          image: true,
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
          created_at: true
        }
      });
      const totalCount = await prisma1.user.count({
        where: {
          role_id: 3,
          approval_status_id: 2,
          account_status_id: {
            in: [1, 4]
          }
        },
      });
      return { Total: totalCount, Sellers: user };
    } catch (error) {
      throw error
    }
  }

  async findOne(user_id: bigint) {
    try {
      const prisma1 = await this.prisma.$extends({
        result: {
          user: {
            image: {
              needs: { id: true, image: true },
              compute(image) {
                if (image.image != null && image.image != '' && image.image != undefined) {
                  return `${process.env.BASE_PATH}/${process.env.IMAGE_PATH}/${process.env.USER_PROFILE_IMAGE_PATH}/${image.id}/${image.image}`
                }
                else {
                  return "";
                }
              },
            },
          },
          sellerProfile: {
            business_logo: {
              needs: { user_id: true, business_logo: true },
              compute(id_proof) {
                if (id_proof.business_logo) {
                  return `${process.env.BASE_PATH}/${process.env.IMAGE_PATH}/${process.env.USER_BUSINESS_IMAGE_PATH}/${id_proof.user_id}/${id_proof.business_logo}`;
                } else {
                  return "";
                }
              }
            }
          },
          sellerKYC: {
            id_proof: {
              needs: { user_id: true, id_proof: true },
              compute(id_proof) {
                if (id_proof.id_proof) {
                  return `${process.env.BASE_PATH}/${process.env.IMAGE_PATH}/${process.env.USER_KYC_IMAGE_PATH}/${id_proof.user_id}/${id_proof.id_proof}`;
                } else {
                  return "";
                }
              }
            }
          }

        },
      })
      const user = await prisma1.user.findUnique({
        where: {
          id: user_id
        },
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
          phone_no: true,
          image: true,
          provider: true,
          created_at: true,
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
          sellerProfile: {
            select: {
              id: true,
              slug: true,
              mobile_number: true,
              gender: true,
              address1: true,
              landmark: true,
              city: true,
              state: true,
              country: true,
              pincode: true,
              business_name: true,
              business_tag: true,
              business_logo: true,
              bank_business_name: true,
              bank_name: true,
              account_number: true,
              branch_name: true,
              ifsc_code: true,
              fake_seller: true,
              created_at: true,
            }
          },
          SellerKYC: {
            select: {
              id: true,
              user_id: true,
              id_proof: true,
              GSTIN: true,
              PAN: true,
              created_at: true,
            }
          },
          SocialLinks: {
            select: {
              id: true,
              metadata: true
            }
          }
        }
      })
      return user
    } catch (error) {
      throw error
    }
  }

  async update(user_id: bigint, updateAdminDto: UpdateAdminDto) {
    try {
      let isUserAvailable = await this.prisma.user.count({
        where: {
          email: {
            equals: `${updateAdminDto?.email}`.toLowerCase(),
            mode: "insensitive"
          }
        }
      });
      if (isUserAvailable) {
        throw new BadRequestException('Email address already exists!')
      }
      const pass = await this.prisma.user.findUnique({
        where: {
          id: user_id
        }
      })
      if (updateAdminDto.old_password && pass?.password) {
        const pwMatches = await comparePassword(
          updateAdminDto.old_password,
          pass?.password
        );

        if (!pwMatches) throw new BadRequestException('Wrong current password.');
      }

      let hashedPassword = pass?.password
      if (updateAdminDto.password) {
        hashedPassword = await hashPassword(updateAdminDto?.password);
      }
      const user = await this.prisma.user.update({
        where: {
          id: user_id
        },
        data: {
          first_name: updateAdminDto?.first_name,
          last_name: updateAdminDto?.last_name,
          email: updateAdminDto?.email,
          phone_no: updateAdminDto?.phone_no,
          password: hashedPassword,
          role_id: updateAdminDto?.role_id,
          account_status_id: updateAdminDto?.account_status_id,
          approval_status_id: updateAdminDto?.approval_status_id // Have to send Email/Whatsapp notification
        },
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
          approval_status_id: true,
          approval_status: {
            select: {
              title: true,
            }
          }
        }
      })
      const sellerName = `${user.first_name} ${user.last_name}`
      const sellerInfo = await this.prisma.sellerProfile.findUnique({
        where: {
          user_id: user.id
        }
      })

      if (updateAdminDto.approval_status_id === 2) {
        setImmediate(async () => {
          try {
            await this.mailService.sendSellerApprovalEmail(user.email, sellerName, sellerInfo?.business_name!);
          } catch (error) {
            console.error("Error sending approval email", error);
          }
        });
      } else if (updateAdminDto.approval_status_id === 3) {
        setImmediate(async () => {
          try {
            await this.mailService.sendSellerRejectEmail(user.email, sellerName);
          } catch (error) {
            console.error("Error sending reject email", error);
          }
        });
      }
      await createNotification(
        user.id,
        "ACCOUNT_UPDATE",
        "Seller Account Update",
        `Your seller account "${sellerInfo?.business_name}" has been ${user.approval_status.title}.`,
        {
          user_email: user.email,
          business_name: sellerInfo?.business_name,
        },
      );
      return user
    } catch (error) {
      throw error
    }
  }

  async remove(id: bigint) {
    try {
      const user = await this.prisma.user.findUnique({
        where: {
          id
        }
      })
      const hasOrders = await this.prisma.order.count({
        where: { customer_id: id },
      });

      if (hasOrders) {
        throw new BadRequestException("Cannot be deleted. User have placed an order.");
      }

      if (user?.role_id === BigInt(3)) {
        await this.prisma.sellerProfile.deleteMany({ where: { user_id: id } });
        await this.prisma.sellerKYC.deleteMany({ where: { user_id: id } });
        await this.prisma.sellerStoreFront.deleteMany({ where: { user_id: id } });
        const locations = await this.prisma.pickupLocation.findMany({ where: { sellerId: id }, select: { id: true } });
        const pickupLocationIds = locations.map(loc => loc.id);
        await this.prisma.shiprocketOrder.deleteMany({ where: { pickup_location_id: { in: pickupLocationIds } } });
        await this.prisma.pickupLocation.deleteMany({ where: { sellerId: id } });
        await this.prisma.notificationPreference.deleteMany({ where: { user_id: id } });
        const cart = await this.prisma.cart.findFirst({ where: { customer_id: id } })
        await this.prisma.cartAttributeTerm.deleteMany({ where: { cart_id: cart?.id } });
        await this.prisma.cart.deleteMany({ where: { customer_id: id } });
        await this.prisma.cartHoldingItems.deleteMany({ where: { user_id: id } });
        const reels = await this.prisma.reels.findMany({ where: { seller_id: id }, select: { id: true }, });
        const reelsIds = reels.map(reel => reel.id);
        await this.prisma.likedReels.deleteMany({ where: { reel_id: { in: reelsIds } } });
        await this.prisma.reels.deleteMany({ where: { seller_id: id } });
        await this.prisma.live.deleteMany({ where: { seller_id: id } });
        await this.prisma.wishList.deleteMany({ where: { user_id: id } });

        const update = await this.prisma.user.update({
          where: {
            id
          },
          data: {
            role_id: 4
          }
        })
        return user
      } else {
        await this.prisma.userToken.deleteMany({ where: { user_id: id } });
        await this.prisma.notificationPreference.deleteMany({ where: { user_id: id } });
        const cart = await this.prisma.cart.findFirst({ where: { customer_id: id } })
        await this.prisma.cartAttributeTerm.deleteMany({ where: { cart_id: cart?.id } });
        await this.prisma.cart.deleteMany({ where: { customer_id: id } });
        await this.prisma.cartHoldingItems.deleteMany({ where: { user_id: id } });
        await this.prisma.likedReels.deleteMany({ where: { user_id: id } });
        await this.prisma.wishList.deleteMany({ where: { user_id: id } });
        await this.prisma.userFCMToken.deleteMany({ where: { user_id: id } });
        await this.prisma.inAppNotifications.deleteMany({ where: { user_id: id } });
        const del = await this.prisma.user.delete({
          where: {
            id
          }
        })
        return del
      }
    } catch (error) {
      throw error;
    }
  }

  async findAllReport(logDto: LogReportDto) {
    try {
      const prisma1 = await this.prisma.$extends({
        result: {
          user: {
            image: {
              needs: { id: true, image: true },
              compute(image) {
                if (image.image != null && image.image != '' && image.image != undefined) {
                  return `${process.env.BASE_PATH}/${process.env.IMAGE_PATH}/${process.env.USER_PROFILE_IMAGE_PATH}/${image.id}/${image.image}`
                }
                else {
                  return "";
                }
              },
            },
          }
        },
      })
      const skip = (logDto.page - 1) * logDto.rowsPerPage;
      const take = logDto?.rowsPerPage

      let conditions: any = [];
      let searchWord: string = '';
      if (logDto?.search) {
        var str = (logDto?.search).trim();
        searchWord = str;
        conditions.push({
          OR: [
            { action: { contains: searchWord, mode: "insensitive" } },
            { description: { contains: searchWord, mode: "insensitive" } },
          ]
        });
      }

      const logs = await prisma1.adminActivityLog.findMany({
        skip: skip,
        take: take,
        orderBy: {
          id: 'desc'
        },
        where: {
          AND: conditions
        },
        select: {
          id: true,
          description: true,
          table: true,
          action: true,
          ip: true,
          userAgent: true,
          created_at: true
        }
      });
      const totalCount = await prisma1.adminActivityLog.count({
        where: {
          AND: conditions,
        },
      });
      return { Total: totalCount, Logs: logs };
    } catch (error) {
      throw error
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

}
