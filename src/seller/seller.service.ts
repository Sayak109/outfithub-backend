import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateSellerDto } from './dto/create-seller.dto';
import { UpdateSellerDto } from './dto/update-seller.dto';
import { PrismaService } from '@/prisma/prisma.service';
import { SociallinksDto } from './dto/social-links.dto';
import { PreferenceDto } from '../notification/dto/notification-preference.dto';
import { StoreFrontDto } from './dto/store-front.dto';
import { DeliveryService } from '@/delivery/delivery.service';
import { SellerPickupLocationDto } from './dto/seller-pickup-location.dto';
import axios from 'axios';
import { CreateShiprocketDto } from './dto/create-shiprocket-order.dto';
import { createMetaData, createNotification } from '@/common/helper/common.helper';
import { metadata } from 'reflect-metadata/no-conflict';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SellerService {
  constructor(
    private prisma: PrismaService,
    private deliveryService: DeliveryService
  ) { }
  async create(seller_id: bigint, createSellerDto: CreateSellerDto,
    files: {
      profile?: { filename: string, path: string },
      logo?: { filename: string, path: string },
      id_proof?: { filename: string, path: string }
    }) {
    try {
      const sellerExits = await this.prisma.sellerProfile.findUnique({
        where: {
          user_id: seller_id
        }
      })
      if (sellerExits) {
        throw new BadRequestException('Seller profile already exists.');
      }
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

      let id_proof: any
      if (idProofFileName && idProofFileName !== 'null') {
        id_proof = idProofFileName;
      }
      else if (idProofFileName === "null") {
        id_proof = null;
      }
      const profile_image = await this.prisma.user.update({
        where: {
          id: seller_id
        },
        data: {
          role_id: 3,
          approval_status_id: 1,
          image: profile
        }
      })
      const id1 = crypto.randomBytes(6).toString('base64url').slice(0, 8);
      const id2 = uuidv4().replace(/-/g, '').slice(0, 8);
      const id3 = crypto.createHash('sha256').update(Date.now().toString() + Math.random().toString()).digest('hex').slice(0, 8);

      const allIds = [id1, id2, id3];
      const randomId = allIds[Math.floor(Math.random() * allIds.length)];
      const seller = await this.prisma.sellerProfile.create({
        data: {
          user_id: seller_id,
          slug: randomId,
          mobile_number: createSellerDto.mobile_number,
          gender: createSellerDto.gender,
          address1: createSellerDto.address1,
          landmark: createSellerDto.landmark || "",
          city: createSellerDto.city,
          state: createSellerDto.state,
          country: createSellerDto.country,
          pincode: createSellerDto.pincode,
          business_name: createSellerDto.business_name,
          business_logo: logo,
          business_tag: createSellerDto.business_tag,
          bank_business_name: createSellerDto.bank_business_name,
          bank_name: createSellerDto.bank_name,
          account_number: createSellerDto.account_number,
          branch_name: createSellerDto.branch_name,
          ifsc_code: createSellerDto.ifsc_code,
        }
      })
      const kyc = await this.prisma.sellerKYC.create({
        data: {
          user_id: seller_id,
          id_proof: id_proof,
          GSTIN: createSellerDto.GSTIN,
          PAN: createSellerDto.PAN
        }
      })
      await createNotification(
        BigInt(1),
        "SELLER_ACCOUNT",
        "Seller Account Created",
        `${seller.business_name} has successfully registered as a seller. Review the profile and approve if needed.`,
        {
          seller_id: Number(seller_id),
          business_name: seller.business_name,
        },
      )
      return { Profile: seller, KYC: kyc };
    } catch (error: any) {
      throw error;
    }
  }

  findAll() {
    return `This action returns all seller`;
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
              compute(image) {
                if (image.business_logo != null && image.business_logo != '' && image.business_logo != undefined) {
                  return `${process.env.BASE_PATH}/${process.env.IMAGE_PATH}/${process.env.USER_BUSINESS_IMAGE_PATH}/${image.user_id}/${image.business_logo}`
                }
                else {
                  return "";
                }
              },
            }
          },
          sellerKYC: {
            id_proof: {
              needs: { user_id: true, id_proof: true },
              compute(image) {
                if (image.id_proof != null && image.id_proof != '' && image.id_proof != undefined) {
                  return `${process.env.BASE_PATH}/${process.env.IMAGE_PATH}/${process.env.USER_KYC_IMAGE_PATH}/${image.user_id}/${image.id_proof}`
                }
                else {
                  return "";
                }
              },
            }
          }
        },
      })
      const seller = await prisma1.user.findUnique({
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
          role: {
            select: {
              id: true,
              title: true
            }
          },
          approval_status: {
            select: {
              id: true,
              title: true
            }
          },
          account_status: {
            select: {
              id: true,
              title: true
            }
          },
          created_at: true,
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
              id_proof: true,
              GSTIN: true,
              PAN: true,
              created_at: true
            }
          },
          pickupLocation: {
            select: {
              id: true,
              address: true,
              address_2: true,
              city: true,
              country: true,
              pin_code: true,
              state: true,
              pickup_location: true,
              isDefault: true,
              createdAt: true
            }
          },
          SocialLinks: {
            select: {
              id: true,
              metadata: true,
              created_at: true
            }
          },
          sellerStoreFront: {
            select: {
              id: true,
              font: true,
              primary_colour: true,
              secondary_colour: true,
              link: true,
              created_at: true,
            }
          }
        }
      });
      const meta = await this.prisma.metaData.findFirst({
        where: {
          table_id: seller?.id,
          table_name: "sellerfront",
          key: "_sellerfront_meta",
        }
      });

      const metadata = meta?.value ? JSON.parse(meta?.value) : null;
      if (metadata !== null) {
        (seller as any).meta_data = meta?.value ? { ...metadata, other_meta: JSON.parse(metadata.other_meta) } : null
      }



      return seller;
    } catch (error: any) {
      throw error
    }
  }

  async update(user_id: bigint, updateSellerDto: UpdateSellerDto,
    files: {
      profile?: { filename: string, path: string },
      logo?: { filename: string, path: string },
      id_proof?: { filename: string, path: string }
    }) {
    try {
      const user = await this.prisma.user.findUnique({
        where: {
          id: user_id
        }
      })
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
      const seller = await this.prisma.sellerProfile.update({
        where: {
          user_id: user_id,
        },
        data: {
          mobile_number: updateSellerDto.mobile_number,
          gender: updateSellerDto.gender,
          address1: updateSellerDto.address1,
          landmark: updateSellerDto.landmark || "",
          city: updateSellerDto.city,
          state: updateSellerDto.state,
          country: updateSellerDto.country,
          pincode: updateSellerDto.pincode,
          business_name: updateSellerDto.business_name,
          business_tag: updateSellerDto.business_tag,
          business_logo: logo,
          bank_business_name: updateSellerDto.bank_business_name,
          bank_name: updateSellerDto.bank_name,
          account_number: updateSellerDto.account_number,
          branch_name: updateSellerDto.branch_name,
          ifsc_code: updateSellerDto.ifsc_code,
        }
      })

      const KYC = await this.prisma.sellerKYC.update({
        where: {
          user_id: user_id,
        },
        data: {
          user_id: user_id,
          id_proof: id_proof,
          GSTIN: updateSellerDto.GSTIN,
          PAN: updateSellerDto.PAN
        }
      })
      await createNotification(
        BigInt(1),
        "SELLER_ACCOUNT",
        "Seller Account Updated",
        `${seller.business_name} updated his seller profile. Review the profile and approve if needed.`,
        {
          seller_id: Number(user_id),
          business_name: seller.business_name,
        },
      )
      return seller;
    } catch (error: any) {
      throw new Error(`Failed to update seller profile: ${error.message}`);
    }
  }

  async updateSocialLinks(seller_id: bigint, sociallinksDto: SociallinksDto) {
    try {
      const find = await this.prisma.socialLinks.findUnique({
        where: {
          seller_id: seller_id
        }
      })
      let data: any;
      if (find) {
        data = await this.prisma.socialLinks.update({
          where: {
            seller_id: seller_id
          },
          data: {
            metadata: sociallinksDto.metadata
          }
        })
      } else {
        data = await this.prisma.socialLinks.create({
          data: {
            seller_id: seller_id,
            metadata: sociallinksDto.metadata
          }
        })
      }
      return data;
    } catch (error) {
      throw new Error(`Failed to create seller social links: ${error.message}`);
    }
  }

  async updateStoreFront(seller_id: bigint, dto: StoreFrontDto) {
    try {
      const find = await this.prisma.sellerStoreFront.findUnique({
        where: {
          user_id: seller_id
        }
      })
      let data: any;
      if (find) {
        data = await this.prisma.sellerStoreFront.update({
          where: {
            user_id: seller_id
          },
          data: {
            primary_colour: dto.primary_colour,
            secondary_colour: dto.secondary_colour,
            font: dto.font,
            link: dto.link
          }
        })
      } else {
        data = await this.prisma.sellerStoreFront.create({
          data: {
            user_id: seller_id,
            primary_colour: dto.primary_colour,
            secondary_colour: dto.secondary_colour,
            font: dto.font,
            link: dto.link
          }
        })
      }

      const isMetaAvailable = await this.prisma.metaData.findFirst({
        where: {
          table_id: seller_id,
          table_name: 'sellerfront',
          key: '_sellerfront_meta'
        }
      });

      let metaDetails = {
        meta_title: dto?.meta_title,
        meta_description: dto?.meta_description,
        meta_keyword: dto?.meta_keyword,
        other_meta: dto.other_meta
      };

      if (isMetaAvailable) {
        await this.prisma.metaData.update({
          where: {
            id: isMetaAvailable?.id
          },
          data: {
            table_id: seller_id,
            table_name: "sellerfront",
            key: "_sellerfront_meta",
            value: JSON.stringify(metaDetails)
          }
        });
      } else {
        await createMetaData(
          seller_id,
          "sellerfront",
          "_sellerfront_meta",
          JSON.stringify(metaDetails)
        )
      }


      return data;
    } catch (error) {
      throw new Error(`Failed to create seller social links: ${error.message}`);
    }
  }



  async findAllCategories() {
    try {
      const prisma1 = await this.prisma.$extends({
        result: {
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
          }
        },
      })

      const res = await prisma1.productCategory.findMany({
        where: {
          status_id: 1,
          parent_category: null
        },
        orderBy: {
          id: 'desc'
        },
        select: {
          id: true,
          name: true,
          slug: true,
          status: {
            select: {
              id: true,
              title: true
            }
          },
          image: true,
          description: true,
          display_rank: true,
          sub_categories: {
            where: {
              status_id: 1,
            },
            select: {
              id: true,
              name: true,
              slug: true,
              image: true,
              status: {
                select: {
                  id: true,
                  title: true
                }
              },
              description: true,
              parent_category: true,
              display_rank: true,
              _count: {
                select: {
                  products: true
                }
              }
            }
          },
          _count: {
            select: {
              products: true
            }
          }
        }
      });
      const totalCount = await this.prisma.productCategory.count({
        where: {
          status_id: 1,
          parent_category: null
        },
      });
      return { Total: totalCount, Categories: res };
    } catch (error) {
      return error
    }
  }

  async findAllAttributes() {
    try {
      const attributes = await this.prisma.productAttribute.findMany({
        where: {
          status_id: 1
        },
        orderBy: {
          id: 'desc'
        },
        select: {
          id: true,
          name: true,
          slug: true,
          status: {
            select: {
              id: true,
              title: true
            }
          },
          attributeTerms: {
            orderBy: {
              id: 'desc'
            },
            select: {
              id: true,
              name: true,
              slug: true,
              status: {
                select: {
                  id: true,
                  title: true
                }
              }
            }
          },
          created_at: true,
          updated_at: true
        }
      })

      // const totalCount = await this.prisma.coupon.count({
      //   where: {
      //     AND: conditions,
      //   },
      // });
      return { Attributes: attributes };
    } catch (error) {
      throw new Error(`Failed to find attribute: ${error.message}`);
    }
  }



  async createSellerPickupLocationService(userId: bigint, pickLocationDto: SellerPickupLocationDto) {
    try {
      const token = await this.deliveryService.login();
      const user: any = await this.prisma.user.findUnique({
        where: {
          id: userId
        },
        select: {
          first_name: true,
          last_name: true,
          email: true,
          phone_no: true,
        }
      });
      console.log('token: ', token);

      const existPickUplocation = await this.prisma.pickupLocation.findFirst({
        where: {
          address: pickLocationDto.address,
          pickup_location: pickLocationDto.pickup_location
        }
      });

      if (existPickUplocation) {
        throw new BadRequestException("Pickup location already exist")
      }


      // console.log("pickLocationDto", pickLocationDto);
      if (token && user) {
        try {
          const shiprocketPickupLoationRes = await axios.post(`https://apiv2.shiprocket.in/v1/external/settings/company/addpickup`, {
            "pickup_location": pickLocationDto.pickup_location,
            "name": user.first_name + " " + user.last_name,
            "email": user.email,
            "phone": pickLocationDto.phone,
            // "phone": +(user.phone_no),
            "address": pickLocationDto.address,
            "address_2": pickLocationDto.address_2,
            "city": pickLocationDto.city,
            "state": pickLocationDto.state,
            "country": pickLocationDto.country,
            "pin_code": pickLocationDto.pin_code
          }, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });
          console.log("shiprocketPickupLoationRes", shiprocketPickupLoationRes?.data?.pickup_id);
          if (shiprocketPickupLoationRes?.data?.success) {
            const res = await this.prisma.pickupLocation.create({
              data: {
                sellerId: userId,
                address: pickLocationDto.address,
                city: pickLocationDto.city,
                state: pickLocationDto.state,
                pin_code: pickLocationDto.pin_code,
                country: pickLocationDto.country,
                address_2: pickLocationDto.address_2,
                shiprocketCode: +(shiprocketPickupLoationRes?.data?.pickup_id),
                pickup_location: pickLocationDto.pickup_location
              }
            })
            if (!user.phone_no) {
              await this.prisma.user.update({
                where: {
                  id: userId
                },
                data: {
                  phone_no: (pickLocationDto.phone).toString()
                }
              })
            }
            console.log("ressfrertrete5t3", res);
            return res;
          }
        } catch (error) {
          console.log('errorsdfsdfsdfsdsfwerrtwrw: ', error.response.data.message);
          throw new BadRequestException(error.response.data.message);
        }
      }

    } catch (error) {
      throw error
    };
  };


  // async getPickUpLocationService(userId: bigint) {
  //   try {
  //     const res = await this.prisma.pickupLocation.findMany({
  //       where: {
  //         sellerId: userId
  //       }
  //     })
  //     return res;
  //   } catch (error) {
  //     throw error
  //   }
  // }


  async getPickUpLocationService(userId: bigint, search?: string) {
    try {
      const res = await this.prisma.pickupLocation.findMany({
        where: {
          sellerId: userId,
          ...(search
            ? {
              OR: [
                { address: { contains: search, mode: 'insensitive' } },
                { city: { contains: search, mode: 'insensitive' } },
                { state: { contains: search, mode: 'insensitive' } },
                { pickup_location: { contains: search, mode: 'insensitive' } },
                { address: { contains: search, mode: 'insensitive' } },
              ],
            }
            : {}),
        },
      });
      return res;
    } catch (error) {
      throw error;
    }
  }



  async createShipRocketOrderService(orderCreateDto: CreateShiprocketDto) {
    try {
      const token = await this.deliveryService.getToken();
      if (token) {
        try {
          // const shiprocketOrderRes = await axios.post(`https://apiv2.shiprocket.in/v1/external/orders/create/adhoc`, data, {
          //   headers: {
          //     'Content-Type': 'application/json',
          //     'Authorization': `Bearer ${token}`
          //   }
          // });
          // return shiprocketOrderRes;
        } catch (error) {
          throw new BadRequestException(error.response.data.message);
        }
      }
    } catch (error) {
      throw error
    }
  };




  remove(id: number) {
    return `This action removes a #${id} seller`;
  }
}
