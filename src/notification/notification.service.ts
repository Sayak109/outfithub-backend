import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { PrismaService } from '@/prisma/prisma.service';
import { PreferenceDto } from './dto/notification-preference.dto';
import { SendNotificationDto } from './dto/send-notification.dto';
import { FirebaseAdminService } from '@/utils/firebase';
import { SendNotificationToAllDto } from './dto/send-notification-to-all.dto';
import { PaginationDto } from '@/customer/product/dto/pagination.dto';
import { MailerService } from '@nestjs-modules/mailer';
@Injectable()
export class NotificationService {
  constructor(
    private prisma: PrismaService,
    private FirebaseAdmin: FirebaseAdminService,
    private readonly mailer: MailerService,
  ) { }

  async notificationPreferenceService(userId: bigint, dto: PreferenceDto) {
    try {
      let checkAvailablePrefence = await this.prisma.notificationPreferenceCategory.count({
        where: {
          id: dto?.preference_id,
        }
      });

      if (checkAvailablePrefence > 0) {
        if (dto?.checked === false) {
          let checkOldPreferences = await this.prisma.notificationPreference.count({
            where: {
              user_id: userId,
              preference_category_id: dto?.preference_id
            }
          });

          if (checkOldPreferences) {
            await this.prisma.notificationPreference.deleteMany({
              where: {
                user_id: userId,
                preference_category_id: dto?.preference_id
              }
            });
          }
        } else {
          let checkOldPreferences = await this.prisma.notificationPreference.count({
            where: {
              user_id: userId,
              preference_category_id: dto?.preference_id
            }
          });

          if (!checkOldPreferences) {
            let res = await this.prisma.notificationPreference.create({
              data: {
                user_id: userId,
                preference_category_id: dto?.preference_id
              }
            });
          }
        }
      }
      return ""
    } catch (error) {
      throw new Error(`Failed to update notification preferences: ${error.message}`);
    }
  }

  async getNotificationPreferenceService(userId: any) {
    try {
      const categories = await this.prisma.notificationPreferenceCategory.findMany({
        where: {
          parent: null,
        },
        select: {
          id: true,
          name: true,
          key: true,
        },
      });

      const updatedCategories = await Promise.all(
        categories.map(async (category) => {
          const isSelected = await this.prisma.notificationPreference.count({
            where: {
              user_id: userId,
              preference_category_id: category.id,
            },
          });

          return {
            ...category,
            checked: Boolean(isSelected),
          };
        })
      );

      return updatedCategories;
    } catch (error) {
      throw new Error(`Failed to get notification preferences: ${error.message}`);
    }
  }

  async findAll(user_id: bigint) {
    try {
      const notifications = await this.prisma.inAppNotifications.findMany({
        where: {
          user_id
        },
        orderBy: {
          id: "desc"
        },
        select: {
          id: true,
          type: true,
          title: true,
          body: true,
          image: true,
          is_read: true,
          metadata: true,
          created_at: true
        }
      })
      const parsedNotifications = notifications.map(notification => {
        let parsedImage = null;

        if (notification.image) {
          try {
            parsedImage = JSON.parse(notification.image);
          } catch (err) {
            parsedImage = null;
          }
        }

        return {
          ...notification,
          image: parsedImage
        };
      });

      return parsedNotifications;
    } catch (error) {
      throw error
    }
  }

  async AddFCMToken(user_id: bigint, deviceToken: []) {
    try {
      let insertedTokens: string[] = [];
      if (deviceToken && deviceToken.length > 0) {
        for (let i = 0; i < deviceToken.length; i++) {
          let checkAvailableToken = await this.prisma.userFCMToken.count({
            where: {
              user_id: user_id,
              token: deviceToken[i]
            }
          });

          if (checkAvailableToken == 0) {
            let res = await this.prisma.userFCMToken.create({
              data: {
                user_id: user_id,
                token: deviceToken[i]
              }
            });

            if (res?.id) {
              insertedTokens.push(res?.token);
            }
          }
        }
        return { tokens: insertedTokens };
      } else {
        throw new BadRequestException("No token found.")
      }
    } catch (error) {
      throw error
    }
  }

  async sendNotification(sendNotificationDto: SendNotificationDto) {
    try {
      const { deviceTokens, title, body, url } = sendNotificationDto
      const message = {
        notification: {
          title,
          body,
        },
        data: { url: url || '' },
        tokens: deviceTokens,
      };

      const response = await this.FirebaseAdmin.messaging().sendEachForMulticast(message);
      const results = response.responses.map((res: any, index: any) => ({
        token: deviceTokens[index],
        success: res.success,
        error: res.error?.message,
      }));

      return results
    } catch (error) {
      throw error
    }
  }

  async sendOrderPlaceNotification(order_id: bigint, user_id: bigint) {
    try {
      const userFCMTokens = await this.prisma.userFCMToken.findMany({
        where: { id: user_id },
        select: { token: true }
      });

      const fcm_tokens = userFCMTokens.map(u => u.token).filter(Boolean);

      if (fcm_tokens.length !== 0) {
        const orderData = await this.prisma.order.findUnique({
          where: { id: order_id }
        });

        const title = "Order Placed Successfully.";
        const body = `Your order #${orderData?.order_id} worth ₹${orderData?.amount} has been placed successfully.`;

        const message = {
          notification: {
            title,
            body,
          },
          tokens: fcm_tokens,
        };

        const response = await this.FirebaseAdmin.messaging().sendEachForMulticast(message);
        const results = response.responses.map((res: any, index: any) => ({
          token: fcm_tokens[index],
          success: res.success,
          error: res.error?.message,
        }));

        return results;
      } else {
        return false
      }
    } catch (error) {
      throw error;
    }
  }

  async sendNotificationToAll(notificationDto: SendNotificationToAllDto, file) {
    try {
      const imageFileName = file?.filename ?? '';
      let notification_image: any;
      if (imageFileName === "null") {
        notification_image = null;
      } else if (imageFileName !== '') {
        notification_image = `${imageFileName}`;
      }

      let fetchAllDeviceTokens: any = await this.fetchAllDeviceTokensService();
      console.log("fetchAllDeviceTokens", fetchAllDeviceTokens);

      if (!fetchAllDeviceTokens) {
        throw new BadRequestException("No device token found")
      }
      const notification = await this.prisma.pushNotification.create({
        data: {
          title: notificationDto.title,
          body: notificationDto.body,
          url: notificationDto?.url,
          type: "PUSH"
        },
      });
      const image = await this.prisma.pushNotificationImage.create({
        data: {
          notification_id: notification.id,
          src: notification_image,
        }
      })
      const message = {
        notification: {
          title: notificationDto?.title,
          body: notificationDto?.body,
          image: `${process.env.IMAGE_PATH!},
          ${process.env.IMAGE_TEMP_PATH!},
          ${process.env.NOTIFICATION_IMAGE_PATH!},
          ${notification_image!}`

        },
        data: { url: notificationDto.url || '' },
        tokens: fetchAllDeviceTokens,
      }
      const response = await this.FirebaseAdmin.messaging().sendEachForMulticast(message);
      console.log(response);

      return { notification, image }
    } catch (error) {
      console.log("error", error);
      throw error
    }
  }

  async fetchAllDeviceTokensService() {
    try {
      let deviceTokens: string[] = [];

      let deviceTokenData = await this.prisma.userFCMToken.findMany({
        select: {
          token: true,
        }
      });

      if (deviceTokenData && deviceTokenData?.length > 0) {
        deviceTokenData.forEach((device) => {
          deviceTokens.push(device.token);
        })
      };
      return ([...new Set(deviceTokens)]);
    } catch (error) {
      throw error
    }
  }

  async notificationList(dto: PaginationDto) {
    try {
      const prisma1 = await this.prisma.$extends({
        result: {
          pushNotificationImage: {
            src: {
              needs: { notification_id: true, src: true },
              compute(src) {
                if (src.src) {
                  return `${process.env.BASE_PATH}/${process.env.IMAGE_PATH}/${process.env.NOTIFICATION_IMAGE_PATH}/${src.notification_id}/${src.src}`;
                }
                else {
                  return ""
                }
              },
            },
          },
        },
      });
      let conditions: any[] = [];
      let searchWord = '';
      if (dto?.search) {
        let str = (dto?.search).trim();
        searchWord = str;
        conditions.push({
          OR: [
            { body: { contains: searchWord, mode: "insensitive" } },
            { title: { contains: searchWord, mode: "insensitive" } },
          ]
        });
      }

      if (dto?.type) {
        conditions.push({
          type: dto?.type
        })
      }

      let notification: any;
      if (dto && dto.page && dto.rowsPerPage) {
        notification = await prisma1.pushNotification.findMany({
          skip: (dto?.page - 1) * dto?.rowsPerPage,
          take: dto?.rowsPerPage,
          where: {
            AND: conditions
          },
          orderBy: {
            id: 'desc'
          },
          select: {
            id: true,
            title: true,
            body: true,
            type: true,
            url: true,
            images: {
              select: {
                src: true,
              }
            },
            created_at: true,
          }
        });
      } else {
        notification = await prisma1.pushNotification.findMany({
          where: {
            AND: conditions
          },
          orderBy: {
            id: 'desc'
          },
          select: {
            id: true,
            title: true,
            body: true,
            type: true,
            url: true,
            images: {
              select: {
                src: true,
              }
            },
            created_at: true,
          }
        });
      }
      const transformedNotifications = (notification || []).map(n => ({
        ...n,
        image: n.images?.[0]?.src || null,
        images: undefined
      }));

      const totalCount = await this.prisma.pushNotification.count({
        where: {
          AND: conditions
        },
      });
      return { Total: totalCount, Notifications: transformedNotifications || [] };
    } catch (error) {
      throw error
    }
  }

  async sendEmailNotificationToAll(notificationDto: SendNotificationToAllDto) {
    try {
      const notification = await this.prisma.pushNotification.create({
        data: {
          title: notificationDto.title,
          body: notificationDto.body,
          url: notificationDto?.url,
          type: "EMAIL"
        },
      });
      return notification;
    } catch (error) {
      throw error
    }
  }

  async fetchAllEmail() {
    try {
      let email_address: string[] = [];

      let users = await this.prisma.user.findMany({
        where: {
          role_id: {
            in: [3, 4]
          }
        },
        select: {
          email: true
        }
      });

      if (users && users?.length > 0) {
        users.forEach((user) => {
          email_address.push(user.email);
        })
      };
      return ([...new Set(email_address)]);
    } catch (error) {
      throw error
    }
  }

  async updateImage(notification_id: bigint, file) {
    try {
      const imageFileName = file?.filename ?? '';
      console.log("imageFileName", imageFileName);

      let dataToUpdate: any = {}
      if (imageFileName === "null") {
        dataToUpdate.images = null;
      } else if (imageFileName !== '') {
        dataToUpdate.images = `${imageFileName}`;
      }

      const notification = await this.prisma.pushNotificationImage.create({
        data: {
          src: imageFileName,
          notification_id: notification_id,
        }
      });

      return notification;
    } catch (error) {
      throw error
    }
  }

  async sendEmail(notification_id: bigint, notificationDto: SendNotificationToAllDto) {
    try {
      const prisma1 = await this.prisma.$extends({
        result: {
          pushNotificationImage: {
            src: {
              needs: { notification_id: true, src: true },
              compute(src) {
                if (src.src) {
                  return `${process.env.BASE_PATH}/${process.env.IMAGE_PATH}/${process.env.NOTIFICATION_IMAGE_PATH}/${src.notification_id}/${src.src}`;
                }
                else {
                  return ""
                }
              },
            },
          },
        },
      });
      let fetchAllEmail: any = await this.fetchAllEmail();
      const attechments = await prisma1.pushNotificationImage.findMany({
        where: {
          notification_id
        },
        select: {
          src: true,
        }
      })
      setImmediate(async () => {
        try {
          const mailOptions = {
            bcc: fetchAllEmail,
            subject: notificationDto.title,
            html: notificationDto.body,
            attachments: attechments?.map((attachment, index) => ({
              filename: `attachment-${index + 1}${attachment.src.substring(attachment.src.lastIndexOf('.'))}`,
              path: attachment.src,
            }))
          }
          const send = await this.mailer.sendMail(mailOptions);
          console.log("send", send);

          return;
        } catch (error) {
          console.error("Error sending reject email", error);
        }
      });
    } catch (error) {
      throw error
    }
  }

  update(id: number, updateNotificationDto: UpdateNotificationDto) {
    return `This action updates a #${id} notification`;
  }

  remove(id: number) {
    return `This action removes a #${id} notification`;
  }
}
