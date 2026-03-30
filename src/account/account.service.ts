import { BadRequestException, Injectable } from '@nestjs/common';
import { AccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { createNotification, decryptData } from '@/common/helper/common.helper';
import { PrismaService } from '@/prisma/prisma.service';
import { OtpService } from '@/otp/otp.service';
import { PaginationDto } from '@/customer/product/dto/pagination.dto';
import { MailerService } from '@nestjs-modules/mailer';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AccountService {
  constructor(
    private readonly otpService: OtpService,
    private prisma: PrismaService,
    private readonly mailer: MailerService,
  ) { }

  async deleteAccount(accountDto: AccountDto) {
    try {
      const decryptedData = decryptData(accountDto.data);
      const { email, OTP } = decryptedData.data;
      if (!email || !OTP) {
        throw new BadRequestException("Email address and OTP are required");
      }
      const payload = {
        credential: email,
        otp: Number(OTP)
      }

      const verifyOtp = await this.otpService.verifyOtp(payload);
      const user = await this.prisma.user.findUnique({
        where: {
          email: email,
        }
      })
      if (!user) {
        throw new BadRequestException("User not found.")
      }
      if (user.is_deleted) {
        throw new BadRequestException("Account is already deleted.")
      }
      const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, '');
      const delUser = await this.prisma.user.update({
        where: {
          id: user?.id
        },
        data: {
          email: `${user.email}_${timestamp}`,
          is_deleted: true,
        }
      })
      await createNotification(
        BigInt(1),
        "ACCOUNT_DELETE",
        "Account delete",
        `${user?.first_name} ${user?.last_name} has deleted his account.`,
        {
          user_id: Number(user.id),
          name: `${user?.first_name} ${user?.last_name}`
        },
      )
      await this.prisma.userFCMToken.deleteMany({ where: { user_id: user?.id } });
      await this.prisma.userToken.deleteMany({ where: { user_id: user?.id } });
      return true
    } catch (error) {
      throw error
    }
  }

  async downloadRequest(accountDto: AccountDto) {
    try {
      const decryptedData = decryptData(accountDto.data);
      const { email, OTP } = decryptedData?.data;
      console.log("decryptedData", decryptedData);
      if (!email || !OTP) {
        throw new BadRequestException("Email address and OTP are required");
      }
      const payload = {
        credential: email,
        otp: Number(OTP)
      }
      const verifyOtp = await this.otpService.verifyOtp(payload);
      const user = await this.prisma.user.findUnique({
        where: {
          email: email,
        }
      })
      if (!user) {
        throw new BadRequestException("User not found.")
      }

      const existingRequest = await this.prisma.userDataRequest.findFirst({
        where: {
          user_id: user?.id,
          approval_status_id: 1
        }
      });

      if (existingRequest) {
        throw new BadRequestException({
          message: "Request already exists. Please wait for approval.",
          error: "Bad Request",
          statusCode: 400,
          exists: true
        });
      }
      else {
        const send_request = await this.prisma.userDataRequest.create({
          data: {
            user_id: user?.id,
            user_email: email,
            approval_status_id: 1
          }
        })
        await createNotification(
          BigInt(1),
          "DATA_REQUEST",
          "Account data request",
          `${user?.first_name} ${user?.last_name} has submitted a request to access their personal account data. Please review the request and respond accordingly.`,
          {
            user_id: Number(user.id),
            name: `${user?.first_name} ${user?.last_name}`
          },
        )
        return send_request;
      }
    } catch (error) {
      throw error
    }
  }

  async findAllDelUsers(paginationDto: PaginationDto) {
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
      let conditions: any[] = [];
      let searchWord = '';

      if (paginationDto?.search) {
        let str = (paginationDto?.search).trim();
        searchWord = str;
        conditions.push({
          OR: [
            { email: { contains: searchWord, mode: "insensitive" } },
          ]
        });
      }

      if (paginationDto?.status_id) {
        conditions.push({
          status_id: paginationDto?.status_id
        });
      }
      let request: any;
      if (paginationDto && paginationDto?.page && paginationDto?.rowsPerPage) {
        request = await prisma1.user.findMany({
          skip: (paginationDto?.page - 1) * paginationDto?.rowsPerPage,
          take: paginationDto?.rowsPerPage,
          where: {
            AND: conditions,
            is_deleted: true,
          },
          orderBy: {
            updated_at: 'desc'
          },
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            phone_no: true,
            role: {
              select: {
                id: true,
                title: true
              }
            },
            updated_at: true,
            image: true,
          }
        })
      } else {
        request = await prisma1.user.findMany({
          where: {
            is_deleted: true,
          },
          orderBy: {
            updated_at: 'desc'
          },
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            phone_no: true,
            role: {
              select: {
                id: true,
                title: true
              }
            },
            updated_at: true,
            image: true,
          }
        })
      }
      const totalCount = await this.prisma.user.count({
        where: {
          AND: conditions,
          is_deleted: true,
        },
      });

      return { Total: totalCount, DelUsers: request }
    } catch (error) {
      throw error
    }
  }

  async findAll(paginationDto: PaginationDto) {
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
      let conditions: any[] = [];
      let searchWord = '';

      if (paginationDto?.search) {
        let str = (paginationDto?.search).trim();
        searchWord = str;
        conditions.push({
          OR: [
            { user_email: { contains: searchWord, mode: "insensitive" } },
          ]
        });
      }

      if (paginationDto?.status_id) {
        conditions.push({
          status_id: paginationDto?.status_id
        });
      }
      let request: any;
      if (paginationDto && paginationDto?.page && paginationDto?.rowsPerPage) {
        request = await prisma1.userDataRequest.findMany({
          skip: (paginationDto?.page - 1) * paginationDto?.rowsPerPage,
          take: paginationDto?.rowsPerPage,
          where: {
            AND: conditions
          },
          orderBy: {
            id: 'desc'
          },
          select: {
            id: true,
            user_email: true,
            user: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                phone_no: true,
                role: {
                  select: {
                    id: true,
                    title: true
                  }
                },
                image: true,
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
        })
      } else {
        request = await prisma1.userDataRequest.findMany({
          orderBy: {
            id: 'desc'
          },
          select: {
            id: true,
            user_email: true,
            user: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                phone_no: true,
                role: {
                  select: {
                    id: true,
                    title: true
                  }
                },
                image: true,
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
        })
      }
      const totalCount = await this.prisma.userDataRequest.count({
        where: {
          AND: conditions,
        },
      });

      return { Total: totalCount, Requests: request }
    } catch (error) {
      throw error
    }
  }

  async updateDownloadRequest(request_id: bigint, paginationDto: PaginationDto) {
    try {
      type Term = {
        name: string;
      };

      type Attribute = {
        id: bigint | string | number;
        name: string;
        terms?: Term[];
      };
      const update = await this.prisma.userDataRequest.update({
        where: {
          id: request_id
        },
        data: {
          approval_status_id: paginationDto?.status_id
        }
      })
      const request = await this.prisma.userDataRequest.findUnique({
        where: {
          id: request_id
        },
        select: {
          id: true,
          user_email: true,
          user: {
            select: {
              id: true,
              email: true,
              role_id: true,
            }
          }
        }
      })
      if (paginationDto?.status_id === 2) {
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
            },
            reels: {
              reel: {
                needs: { seller_id: true, reel: true },
                compute(reels) {
                  if (reels.reel) {
                    return `${process.env.BASE_PATH}/${process.env.IMAGE_PATH}/${process.env.USER_REELS_PATH}/${reels.seller_id}/reel/${reels.reel}`;
                  }
                  else {
                    return ""
                  }
                },
              },
              thumbnail: {
                needs: { seller_id: true, thumbnail: true },
                compute(reels) {
                  if (reels.thumbnail) {
                    return `${process.env.BASE_PATH}/${process.env.IMAGE_PATH}/${process.env.USER_REELS_PATH}/${reels.seller_id}/thumbnail/${reels.thumbnail}`;
                  }
                  else {
                    return ""
                  }
                },
              },
            },
            productImage: {
              src: {
                needs: { product_id: true, src: true },
                compute(image) {
                  if (image.src) {
                    return `${process.env.BASE_PATH}/${process.env.IMAGE_PATH}/${process.env.PRODUCT_IMAGE_PATH}/${image.product_id}/${image.src}`;
                  }
                  else {
                    return ""
                  }
                },
              },
            },
            productCategory: {
              image: {
                needs: { id: true, image: true },
                compute(image) {
                  if (image.image != null && image.image != '' && image.image != undefined) {
                    return `${process.env.BASE_PATH}/${process.env.IMAGE_PATH}/${process.env.PRODUCT_CATEGORY_IMAGE_PATH}/${image.id}/${image.image}`
                  }
                  else {
                    return ""
                  }
                },
              },
            },
            customerFeedbackImage: {
              src: {
                needs: { id: true, src: true, feedback_id: true },
                compute(image) {
                  return image.src
                    ? `${process.env.BASE_PATH}/${process.env.IMAGE_PATH}/${process.env.CUSTOMER_FEEDBACK_IMAGE_PATH}/${image.feedback_id}/${image.src}`
                    : "";
                },
              },
            },
            orderCancelImage: {
              src: {
                needs: { id: true, src: true },
                compute(src) {
                  if (src.src != null && src.src != '' && src.src != undefined) {
                    return `${process.env.BASE_PATH}/${process.env.IMAGE_PATH}/${process.env.PRODUCT_IMAGE_PATH}/${src.id}/${src.src}`
                  } else {
                    return ""
                  }
                },
              },
            },
          },
        });
        if (request?.user.role_id === BigInt(3)) {
          const userData = await prisma1.user.findUnique({
            where: {
              id: request?.user.id
            },
            select: {
              first_name: true,
              last_name: true,
              phone_no: true,
              email: true,
              role: {
                select: {
                  title: true,
                }
              },
            }
          })
          const profileData = await prisma1.sellerProfile.findUnique({
            where: {
              user_id: request?.user.id
            },
            select: {
              id: true,
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
              user: {
                select: {
                  SellerKYC: {
                    select: {
                      id: true,
                      user_id: true,
                      id_proof: true,
                      GSTIN: true,
                      PAN: true,
                    }
                  },
                }
              }
            },
          })
          const pickupLocationData = await prisma1.pickupLocation.findMany({
            where: {
              sellerId: request?.user.id
            },
            select: {
              address: true,
              address_2: true,
              pickup_location: true,
              country: true,
              city: true,
              pin_code: true,
            }
          })
          const addressData = await prisma1.address.findMany({
            where: {
              user_id: request?.user.id
            },
            select: {
              id: true,
              address_type: true,
              metadata: true,
              default: true,
            }
          })

          const productData = await prisma1.product.findMany({
            where: {
              seller_id: request?.user.id
            },
            select: {
              id: true,
              name: true,
              description: true,
              slug: true,
              sku: true,
              mrp: true,
              tax: true,
              shipping: true,
              stock_quantity: true,
              average_rating: true,
              new_collection: true,
              out_of_stock: true,
              images: {
                select: {
                  src: true,
                }
              },
              approval_status: {
                select: {
                  title: true
                }
              },
              categories: {
                select: {
                  name: true,
                }
              },
              attributes: {
                select: {
                  id: true,
                  name: true,
                }
              },
            }
          })

          for (const product of productData) {
            if (product && product?.attributes) {
              let attributes = await Promise.all(product!.attributes.map(async (attr: any, j: any) => {

                let options = await this.prisma.productToProductTerm.findMany({
                  where: {
                    product_id: product!.id,
                    attribute_id: attr.id
                  },
                  select: {
                    attributeTerms: {
                      select: {
                        name: true,
                      }
                    }
                  }
                });

                let customOptions: { id: bigint; name: string; slug: string }[] = [];

                options.map((op: any) => {
                  customOptions.push({
                    id: op.attributeTerms.id,
                    name: op.attributeTerms.name,
                    slug: op.attributeTerms.slug
                  });
                })

                attr.terms = customOptions;
                return attr;
              }));
              product!.attributes = attributes;
            }
          }

          const orderPlaceData = await prisma1.order.findMany({
            where: {
              customer_id: request?.user.id
            },
            orderBy: {
              id: "desc"
            },
            select: {
              order_id: true,
              amount: true,
              order_date: true,
              rzp_order_id: true,
              rzp_transaction_id: true,
              payment_status: true,
              order_items: {
                select: {
                  item_metadata: true,
                  item_quantity: true,
                  order_status: {
                    select: {
                      title: true,
                    }
                  },
                }
              },
              orderCancel: {
                select: {
                  refund_id: true,
                  refund_status: true,
                  isRefunded: true,
                  isReturnAccepted: true,
                  note: true,
                }
              },
              order_details: {
                select: {
                  billing: true,
                  shipping: true,
                  coupon_metadata: true,
                  discount_amount: true,
                  total_shipping: true,
                  total_tax: true,
                  order_amount: true,
                  order_itm_qty: true,
                }
              }
            }
          })
          const orderedItemsData = await prisma1.orderItems.findMany({
            where: {
              seller_id: request?.user.id
            },
            orderBy: {
              order: {
                id: "desc"
              }
            },
            select: {
              order: {
                select: {
                  order_id: true,
                }
              },
              item_metadata: true,
              item_quantity: true,
              order_status: {
                select: {
                  title: true,
                }
              },
            }
          })
          const feedBackData = await prisma1.customerFeedback.findMany({
            where: {
              user_id: request?.user.id
            },
            select: {
              product: {
                select: {
                  name: true,
                }
              },
              description: true,
              ratings: true,
            }
          })
          const reelsData = await prisma1.reels.findMany({
            where: {
              seller_id: request?.user.id
            },
            select: {
              thumbnail: true,
              reel: true,
              desc: true,
              views: true,
              approval_status: {
                select: {
                  title: true
                }
              },
              likes: true,
              source: true,
              facebookLink: true,
              youtubeLink: true,
            }
          })


          let content = `===== DATA REPORT =====\n\n`;

          content += `-- User Info --\n`;
          content += `Name: ${userData?.first_name || ""} ${userData?.last_name || ""}\n`;
          content += `Email: ${userData?.email || ""}\n`;
          content += `Phone: ${userData?.phone_no || ""}\n`;
          content += `Role: ${userData?.role?.title || ""}\n\n`;

          content += `-- Profile Info --\n`;
          if (profileData) {
            content += `Business: ${profileData.business_name}\n`;
            content += `Tag: ${profileData.business_tag}\n`;
            content += `Address: ${profileData.address1}, ${profileData.city}, ${profileData.state}, ${profileData.country}, ${profileData.pincode}\n\n`;
          }

          content += `-- Pickup Locations --\n`;
          pickupLocationData.forEach((p, i) => {
            content += `${i + 1}. ${p.pickup_location}, ${p.address}, ${p.city}, ${p.country}, ${p.pin_code}\n`;
          });
          content += `\n`;

          content += `-- Address --\n`;
          addressData.forEach((p, i) => {
            let meta: any = {};
            try {
              meta = p.metadata ? JSON.parse(p.metadata) : {};
            } catch (e) {
              console.error('Invalid address metadata:', p.metadata);
            }
            content += `${i + 1}. ${p.address_type}:\n`;
            content += `   ${meta.first_name || ""} ${meta.last_name || ""}\n`;
            content += `   ${meta.address1 || ""}${meta.landmark ? `, Landmark: ${meta.landmark}` : ""}\n`;
            content += `   ${meta.city || ""}, ${meta.state || ""} - ${meta.pincode || ""}\n`;
            content += `   Mobile: ${meta.mobile_no || ""}\n`;
            content += `   Type: ${meta.type || ""}\n\n`;
          });


          content += `-- Products --\n`;
          productData.forEach((p, i) => {
            content += `${i + 1}. ${p.name} [${p.sku}] - Stock: ${p.stock_quantity}, Status: ${p.approval_status?.title}\n`;
            if (p.categories?.length) {
              content += `   Categories:\n`;
              p.categories.forEach(cat => {
                content += `   - ${cat.name}\n`;
              });
            }
            if (p.attributes?.length) {
              content += `   Attributes:\n`;
              (p.attributes as Attribute[])?.forEach(attr => {
                const termNames = attr.terms?.map(t => t.name).join(', ') || 'N/A';
                content += `   - ${attr.name}: ${termNames}\n`;
              });
            }
            content += "\n";
          });

          content += `-- Orders Placed --\n`;

          orderPlaceData.forEach((o, i) => {
            content += `${i + 1}. Order: ${o.order_id}, Amount: ${o.amount}${o?.payment_status === "paid" ? `, Payment ID: ${o?.rzp_transaction_id}` : ""}\n`;

            o.order_items.forEach((it, j) => {
              let meta: any = {};
              try {
                meta = it.item_metadata ? JSON.parse(it.item_metadata) : {};
              } catch (e) {
                console.error("Invalid item_metadata JSON:", it.item_metadata);
              }

              const name = meta?.name || "Unnamed Product";
              const categories = meta?.categories?.join(' | ') || "N/A";

              const attributes = meta?.attributes?.map(attr => {
                const values = attr.values?.join(', ') || "N/A";
                return `${attr.name}: ${values}`;
              }).join(' | ') || "N/A";

              content += `   Item ${j + 1}: ${name}\n`;
              content += `     - Qty: ${it.item_quantity}\n`;
              content += `     - Status: ${it.order_status?.title || "Unknown"}\n`;
              content += `     - Categories: ${categories}\n`;
              content += `     - Attributes: ${attributes}\n`;
            });
          });

          content += `\n`;

          content += `-- Ordered Items (as Seller) --\n`;
          orderedItemsData.forEach((o, i) => {
            let metadata: any = {};

            try {
              metadata = o.item_metadata ? JSON.parse(o.item_metadata) : {};
            } catch (e) {
              console.error('Invalid JSON in item_metadata:', o.item_metadata);
            }

            content += `${i + 1}. Order: ${o?.order?.order_id}, Item: ${metadata?.name || ""}, Qty: ${o.item_quantity}, Status: ${o.order_status?.title || 'N/A'}\n`;
          });
          content += `\n`;

          content += `-- Ratings & Reviews --\n`;
          feedBackData.forEach((f, i) => {
            content += `${i + 1}. ${f.product?.name} - Rating: ${f.ratings}\n ${f.description ? ` "${f.description}"\n` : ''}`;
          });
          content += `\n`;

          content += `-- Reels --\n`;
          reelsData.forEach((r, i) => {
            content += `${i + 1}. Description: ${r.desc || ""}, Views: ${r.views}, Likes: ${r.likes}, Status: ${r.approval_status?.title}\n`;
          });
          content += `\n\n===== END OF REPORT =====`;

          const targetDir = path.join(
            process.env.IMAGE_PATH!,
            process.env.DATA_REPORT_PATH!,
          );
          if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
          }
          const filePath = path.join(targetDir, 'data.txt');

          fs.writeFileSync(filePath, content, 'utf8');
          const fileBuffer = fs.readFileSync(filePath);
          let buffer: any;
          if (fileBuffer) {
            buffer = Buffer.from(fileBuffer.buffer, fileBuffer.byteOffset, fileBuffer.byteLength);
          }
          const userEmail = request?.user_email || userData?.email
          const subject = "Request Approved"
          const html_content = `<p>Hello ${userData?.first_name} ${userData?.last_name},</p>
                <p>Your data request has been approved. Please find your requested data attached in the text file.</p>
                <p>Best regards,</p>
                <p>Yumdut Shop</p>`;
          const mailOptions = {
            to: userEmail,
            subject,
            html: html_content,
            ...(buffer && {
              attachments: [
                {
                  filename: 'data.txt',
                  content: buffer,
                  contentType: 'application/txt',
                }
              ]
            })
          }
          setImmediate(async () => {
            try {
              const send = await this.mailer.sendMail(mailOptions);
              console.log("send", send);
              if (send) {
                fs.unlinkSync(filePath);
              }
            } catch (error) {
              console.error("Error sending reject email", error);
            }
          });
          return true;
        } else if (request?.user.role_id === BigInt(4)) {
          const userData = await prisma1.user.findUnique({
            where: {
              id: request?.user.id
            },
            select: {
              first_name: true,
              last_name: true,
              phone_no: true,
              email: true,
              role: {
                select: {
                  title: true,
                }
              },
            }
          })
          const addressData = await prisma1.address.findMany({
            where: {
              user_id: request?.user.id
            },
            select: {
              id: true,
              address_type: true,
              metadata: true,
              default: true,
            }
          })
          const orderPlaceData = await prisma1.order.findMany({
            where: {
              customer_id: request?.user.id
            },
            orderBy: {
              id: "desc"
            },
            select: {
              order_id: true,
              amount: true,
              order_date: true,
              rzp_order_id: true,
              rzp_transaction_id: true,
              payment_status: true,
              order_items: {
                select: {
                  item_metadata: true,
                  item_quantity: true,
                  order_status: {
                    select: {
                      title: true,
                    }
                  },
                }
              },
              orderCancel: {
                select: {
                  refund_id: true,
                  refund_status: true,
                  isRefunded: true,
                  isReturnAccepted: true,
                  note: true,
                }
              },
              order_details: {
                select: {
                  billing: true,
                  shipping: true,
                  coupon_metadata: true,
                  discount_amount: true,
                  total_shipping: true,
                  total_tax: true,
                  order_amount: true,
                  order_itm_qty: true,
                }
              }
            }
          })
          const feedBackData = await prisma1.customerFeedback.findMany({
            where: {
              user_id: request?.user.id
            },
            select: {
              product: {
                select: {
                  name: true,
                }
              },
              description: true,
              ratings: true,
            }
          })

          let content = `===== DATA REPORT =====\n\n`;

          content += `-- User Info --\n`;
          content += `Name: ${userData?.first_name || ""} ${userData?.last_name || ""}\n`;
          content += `Email: ${userData?.email || ""}\n`;
          content += `Phone: ${userData?.phone_no || ""}\n`;
          content += `Role: ${userData?.role?.title || ""}\n\n`;

          content += `-- Address --\n`;
          addressData.forEach((p, i) => {
            let meta: any = {};
            try {
              meta = p.metadata ? JSON.parse(p.metadata) : {};
            } catch (e) {
              console.error('Invalid address metadata:', p.metadata);
            }
            content += `${i + 1}. ${p.address_type}:\n`;
            content += `   ${meta.first_name || ""} ${meta.last_name || ""}\n`;
            content += `   ${meta.address1 || ""}${meta.landmark ? `, Landmark: ${meta.landmark}` : ""}\n`;
            content += `   ${meta.city || ""}, ${meta.state || ""} - ${meta.pincode || ""}\n`;
            content += `   Mobile: ${meta.mobile_no || ""}\n`;
            content += `   Type: ${meta.type || ""}\n\n`;
          });

          content += `-- Orders Placed --\n`;
          orderPlaceData.forEach((o, i) => {
            content += `${i + 1}. Order: ${o.order_id}, Amount: ${o.amount}${o?.payment_status === "paid" ? `, Payment ID: ${o?.rzp_transaction_id}` : ""}\n`;

            o.order_items.forEach((it, j) => {
              let meta: any = {};
              try {
                meta = it.item_metadata ? JSON.parse(it.item_metadata) : {};
              } catch (e) {
                console.error("Invalid item_metadata JSON:", it.item_metadata);
              }

              const name = meta?.name || "Unnamed Product";
              const categories = meta?.categories?.join(' | ') || "N/A";

              const attributes = meta?.attributes?.map(attr => {
                const values = attr.values?.join(', ') || "N/A";
                return `${attr.name}: ${values}`;
              }).join(' | ') || "N/A";

              content += `   Item ${j + 1}: ${name}\n`;
              content += `     - Qty: ${it.item_quantity}\n`;
              content += `     - Status: ${it.order_status?.title || "Unknown"}\n`;
              content += `     - Categories: ${categories}\n`;
              content += `     - Attributes: ${attributes}\n`;
            });
          });
          content += `\n`;

          content += `-- Ratings & Reviews  --\n`;
          feedBackData.forEach((f, i) => {
            content += `${i + 1}. ${f.product?.name} - Rating: ${f.ratings}\n ${f.description ? ` "${f.description}"\n` : ''}`;
          });
          content += `\n\n===== END OF REPORT =====`;

          const targetDir = path.join(
            process.env.IMAGE_PATH!,
            process.env.DATA_REPORT_PATH!,
          );
          if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
          }
          const filePath = path.join(targetDir, 'data.txt');

          fs.writeFileSync(filePath, content, 'utf8');
          const fileBuffer = fs.readFileSync(filePath);
          let buffer: any;
          if (fileBuffer) {
            buffer = Buffer.from(fileBuffer.buffer, fileBuffer.byteOffset, fileBuffer.byteLength);
          }
          const userEmail = request?.user_email || userData?.email
          const subject = "Request Approved"
          const html_content = `<p>Hello ${userData?.first_name} ${userData?.last_name},</p>
                <p>Your data request has been approved. Please find your requested data attached in the text file.</p>
                <p>Best regards,</p>
                <p>Yumdut Shop</p>`;
          const mailOptions = {
            to: userEmail,
            subject,
            html: html_content,
            ...(buffer && {
              attachments: [
                {
                  filename: 'data.txt',
                  content: buffer,
                  contentType: 'application/txt',
                }
              ]
            })
          }
          setImmediate(async () => {
            try {
              const send = await this.mailer.sendMail(mailOptions);
              console.log("send", send);
              if (send) {
                fs.unlinkSync(filePath);
              }
            } catch (error) {
              console.error("Error sending reject email", error);
            }
          });
          return true;
        }
      }
      else {
        const userEmail = request?.user_email ? request?.user_email : request?.user.email
        const subject = "Request Rejected";
        const html_content = `<p> We regret to inform you that your request has been declined by the admin. </p>
                <p>Best regards,</p>
                <p>Yumdut shop</p>`;
        const mailOptions = {
          to: userEmail,
          subject,
          html: html_content,
        }
        setImmediate(async () => {
          try {
            const send = await this.mailer.sendMail(mailOptions);
          } catch (error) {
            console.error("Error sending reject email", error);
          }
        });
        return true;
      }
      return
    } catch (error) {
      throw error
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} account`;
  }


  remove(id: number) {
    return `This action removes a #${id} account`;
  }
}
