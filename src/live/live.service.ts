import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateLiveDto } from './dto/create-live.dto';
import { UpdateLiveDto } from './dto/update-live.dto';
import { PrismaService } from '@/prisma/prisma.service';
import { GetLivesDto } from './dto/get-lives.dto';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LiveService {
  constructor(
    private prisma: PrismaService,
  ) { }
  async create(user_id: bigint, createLiveDto: CreateLiveDto) {
    try {
      const delLive = await this.prisma.live.deleteMany({
        where: {
          seller_id: user_id
        }
      })
      const validProducts = await this.prisma.product.findMany({
        where: {
          id: { in: createLiveDto.product_ids },
          seller_id: user_id
        },
        select: { id: true }
      });
      const validProductIds = validProducts.map(p => p.id);

      const invalidIds = createLiveDto.product_ids.filter(
        id => !validProductIds.includes(BigInt(id))
      );

      if (invalidIds.length > 0) {
        const invalidProducts = await this.prisma.product.findMany({
          where: { id: { in: invalidIds } },
          select: { name: true }
        });
        const invalidNames = invalidProducts.map(p => p.name);
        throw new BadRequestException(`Product(s) Not found: ${invalidNames.join(', ')}`);
      }
      const id1 = crypto.randomBytes(6).toString('base64url').slice(0, 8);
      const id2 = uuidv4().replace(/-/g, '').slice(0, 8);
      const id3 = crypto.createHash('sha256').update(Date.now().toString() + Math.random().toString()).digest('hex').slice(0, 8);

      const allIds = [id1, id2, id3];
      const randomId = allIds[Math.floor(Math.random() * allIds.length)];

      const lives = await this.prisma.live.create({
        data: {
          slug: randomId,
          seller_id: user_id,
          isLive: true,
          views: 0,
          source: createLiveDto.source,
          product_ids: createLiveDto.product_ids,
          facebookLink: createLiveDto.facebookLink,
          youtubeLink: createLiveDto.youtubeLink,
          roomId: createLiveDto.roomId,
          hostId: createLiveDto.hostId,
          streamId: createLiveDto.streamId,
          hostname: createLiveDto.hostname
        }
      })

      return lives;
    } catch (error) {
      throw error
    }
  }

  async findAllBySeller(user_id: bigint, getLivesDto: GetLivesDto) {
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

      if (getLivesDto?.search) {
        var str = (getLivesDto?.search).trim();
        searchWord = str;
        conditions.push({
          OR: [
            { seller: { email: { contains: searchWord, mode: "insensitive" } } },
            { seller: { first_name: { contains: searchWord, mode: "insensitive" } } },
            { seller: { last_name: { contains: searchWord, mode: "insensitive" } } },
            {
              AND: [
                { seller: { first_name: { contains: searchWord.split(" ")[0], mode: "insensitive" } } },
                { seller: { last_name: { contains: searchWord.split(" ")[1] ?? "", mode: "insensitive" } } }
              ]
            },
          ]
        });
      }

      if (getLivesDto?.approval_status_id) {
        conditions.push({
          approval_status_id: getLivesDto?.approval_status_id
        });
      }

      let lives: any;
      if (getLivesDto && getLivesDto.page && getLivesDto.rowsPerPage) {
        lives = await prisma1.live.findMany({
          skip: (getLivesDto?.page - 1) * getLivesDto?.rowsPerPage,
          take: getLivesDto?.rowsPerPage,
          where: {
            seller_id: user_id,
            AND: conditions
          },
          orderBy: {
            id: 'desc'
          },
          select: {
            id: true,
            isLive: true,
            views: true,
            source: true,
            facebookLink: true,
            youtubeLink: true,
            roomId: true,
            hostId: true,
            streamId: true,
            hostname: true,
            product_ids: true,
            seller: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
                phone_no: true,
                image: true,
              }
            },
            approval_status: {
              select: {
                id: true,
                title: true
              }
            },
            created_at: true,
            updated_at: true
          }
        })
      } else {
        lives = await prisma1.live.findMany({
          where: {
            seller_id: user_id,
            AND: conditions
          },
          orderBy: {
            id: 'desc'
          },
          select: {
            id: true,
            isLive: true,
            views: true,
            source: true,
            facebookLink: true,
            youtubeLink: true,
            roomId: true,
            hostId: true,
            streamId: true,
            hostname: true,
            product_ids: true,
            seller: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
                phone_no: true,
                image: true,
              }
            },
            approval_status: {
              select: {
                id: true,
                title: true
              }
            },
            created_at: true,
            updated_at: true
          }
        })
      }
      const totalCount = await prisma1.live.count({
        where: {
          seller_id: user_id,
          AND: conditions,
        },
      });
      if (lives && lives.length) {
        const enrichedReels = await Promise.all(
          lives.map(async (live) => {
            const products = await prisma1.product.findMany({
              where: {
                seller_id: user_id,
                id: { in: live.product_ids },
              },
              select: {
                id: true,
                name: true,
              },
            });

            return {
              ...live,
              products,
              product_ids: undefined,
            };
          })
        );
        return { Total: totalCount, Lives: enrichedReels };
      }
      return { Total: totalCount, Lives: lives };
    } catch (error) {
      throw error
    }
  }

  async findOneBySeller(live_id: bigint, user_id: bigint) {
    try {
      const live = await this.prisma.live.findUnique({
        where: {
          id: live_id,
          seller_id: user_id
        },
        select: {
          id: true,
          isLive: true,
          views: true,
          source: true,
          facebookLink: true,
          youtubeLink: true,
          roomId: true,
          hostId: true,
          streamId: true,
          hostname: true,
          product_ids: true,
          seller: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
              phone_no: true,
            }
          },
          approval_status: {
            select: {
              id: true,
              title: true
            }
          },
          created_at: true,
          updated_at: true
        }
      });

      if (!live) {
        throw new BadRequestException("Live not found.");
      }

      const products = await this.prisma.product.findMany({
        where: {
          id: {
            in: live.product_ids,
          },
          seller_id: user_id
        },
        select: {
          id: true,
          name: true,
          description: true,
          sku: true,
          mrp: true,
          images: {
            select: {
              src: true,
            },
          },
          shipping: true,
          out_of_stock: true,
          new_collection: true
        },
      });
      return {
        ...live,
        products,
        product_ids: undefined,
      };

    } catch (error) {
      throw error
    }
  }

  async update(live_id: bigint, user_id: bigint, updateLiveDto: UpdateLiveDto) {
    try {
      const find = await this.prisma.live.findUnique({
        where: {
          id: live_id,
          seller_id: user_id
        }
      })
      if (!find) {
        throw new BadRequestException("No live found.")
      }
      const update = await this.prisma.live.update({
        where: {
          id: live_id,
          seller_id: user_id
        },
        data: {
          isLive: updateLiveDto.isLive
        }
      })
      return update
    } catch (error) {
      throw error
    }
  }

  remove(id: number) {
    return `This action removes a #${id} live`;
  }

  // For admin part

  async findAll(getLivesDto: GetLivesDto) {
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

      if (getLivesDto?.search) {
        var str = (getLivesDto?.search).trim();
        searchWord = str;
        conditions.push({
          OR: [
            { seller: { email: { contains: searchWord, mode: "insensitive" } } },
            { seller: { first_name: { contains: searchWord, mode: "insensitive" } } },
            { seller: { last_name: { contains: searchWord, mode: "insensitive" } } },
            {
              AND: [
                { seller: { first_name: { contains: searchWord.split(" ")[0], mode: "insensitive" } } },
                { seller: { last_name: { contains: searchWord.split(" ")[1] ?? "", mode: "insensitive" } } }
              ]
            },
          ]
        });
      }

      if (getLivesDto?.approval_status_id) {
        conditions.push({
          approval_status_id: getLivesDto?.approval_status_id
        });
      }

      let lives: any;
      if (getLivesDto && getLivesDto.page && getLivesDto.rowsPerPage) {
        lives = await prisma1.live.findMany({
          skip: (getLivesDto?.page - 1) * getLivesDto?.rowsPerPage,
          take: getLivesDto?.rowsPerPage,
          where: {
            AND: conditions
          },
          orderBy: {
            id: 'desc'
          },
          select: {
            id: true,
            isLive: true,
            views: true,
            source: true,
            facebookLink: true,
            youtubeLink: true,
            roomId: true,
            hostId: true,
            streamId: true,
            hostname: true,
            product_ids: true,
            seller: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
                phone_no: true,
                image: true,
                sellerProfile: {
                  select: {
                    business_name: true,
                    business_tag: true,
                  }
                }
              }
            },
            approval_status: {
              select: {
                id: true,
                title: true
              }
            },
            created_at: true,
            updated_at: true
          }
        })
      } else {
        lives = await prisma1.live.findMany({
          where: {
            AND: conditions
          },
          orderBy: {
            id: 'desc'
          },
          select: {
            id: true,
            isLive: true,
            views: true,
            source: true,
            facebookLink: true,
            youtubeLink: true,
            roomId: true,
            hostId: true,
            streamId: true,
            hostname: true,
            product_ids: true,
            seller: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
                phone_no: true,
                image: true,
              }
            },
            approval_status: {
              select: {
                id: true,
                title: true
              }
            },
            created_at: true,
            updated_at: true
          }
        })
      }
      const totalCount = await prisma1.live.count({
        where: {
          AND: conditions,
        },
      });
      if (lives && lives.length) {
        const enrichedReels = await Promise.all(
          lives.map(async (live) => {
            const products = await prisma1.product.findMany({
              where: {
                id: { in: live.product_ids },
              },
              select: {
                id: true,
                name: true,
              },
            });

            return {
              ...live,
              products,
              product_ids: undefined,
            };
          })
        );
        return { Total: totalCount, Lives: enrichedReels };
      }
      return { Total: totalCount, Lives: lives };
    } catch (error) {
      throw error
    }
  }


  async findOne(live_id: bigint) {
    try {
      const live = await this.prisma.live.findUnique({
        where: {
          id: live_id,
        },
        select: {
          id: true,
          isLive: true,
          views: true,
          source: true,
          facebookLink: true,
          youtubeLink: true,
          roomId: true,
          hostId: true,
          streamId: true,
          hostname: true,
          product_ids: true,
          seller: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
              phone_no: true,
            }
          },
          approval_status: {
            select: {
              id: true,
              title: true
            }
          },
          created_at: true,
          updated_at: true
        }
      });

      if (!live) {
        throw new BadRequestException("Live not found.");
      }

      const products = await this.prisma.product.findMany({
        where: {
          id: {
            in: live.product_ids,
          },
        },
        select: {
          id: true,
          name: true,
          description: true,
          sku: true,
          mrp: true,
          images: {
            select: {
              src: true,
            },
          },
          shipping: true,
          out_of_stock: true,
          new_collection: true
        },
      });
      return {
        ...live,
        products,
        product_ids: undefined,
      };

    } catch (error) {
      throw error
    }
  }


}
