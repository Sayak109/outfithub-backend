import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateReelDto } from './dto/create-reel.dto';
import { UpdateReelDto } from './dto/update-reel.dto';
import { PrismaService } from '@/prisma/prisma.service';
import { GetReelsDto } from './dto/get-reels.dto';
import * as fs from 'fs';
import * as path from 'path';
import { updateStatusDto } from './dto/update-reel-status.dto';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ReelsService {
  constructor(
    private prisma: PrismaService,
  ) { }

  // async create(user_id: bigint, createReelDto: CreateReelDto, files: {
  //   thumbnail?: { filename: string, path: string },
  //   reel?: { filename: string, path: string },
  // }) {
  //   try {
  //     const thumbnailFileName = files?.thumbnail?.filename ?? '';
  //     const reelFileName = files?.reel?.filename ?? '';
  //     let thumbnail: any;
  //     if (thumbnailFileName && thumbnailFileName !== '') {
  //       thumbnail = thumbnailFileName;
  //     } else if (thumbnailFileName === "null") {
  //       thumbnail = null;
  //     }

  //     let reel: any;
  //     if (reelFileName && reelFileName !== 'null') {
  //       reel = reelFileName;
  //     }
  //     else if (reelFileName === "null") {
  //       reel = null;
  //     }

  //     const validProducts = await this.prisma.product.findMany({
  //       where: {
  //         id: { in: createReelDto.product_ids },
  //         seller_id: user_id
  //       },
  //       select: { id: true }
  //     });
  //     const validProductIds = validProducts.map(p => p.id);

  //     const invalidIds = createReelDto.product_ids.filter(
  //       id => !validProductIds.includes(BigInt(id))
  //     );

  //     if (invalidIds.length > 0) {
  //       const invalidProducts = await this.prisma.product.findMany({
  //         where: { id: { in: invalidIds } },
  //         select: { name: true }
  //       });
  //       const invalidNames = invalidProducts.map(p => p.name);
  //       throw new BadRequestException(`Product(s) Not found: ${invalidNames.join(', ')}`);
  //     }


  //     const reels = await this.prisma.reels.create({
  //       data: {
  //         seller_id: user_id,
  //         reel: reel,
  //         thumbnail: thumbnail,
  //         likes: 0,
  //         views: 0,
  //         source: createReelDto.source,
  //         facebookLink: createReelDto.facebookLink,
  //         youtubeLink: createReelDto.youtubeLink,
  //         product_ids: createReelDto.product_ids
  //       },
  //     });



  //     return reels;
  //   } catch (error) {
  //     throw error;
  //   }
  // }

  async extractHashtags(text: string): Promise<string[]> {
    if (!text) return [];
    const regex = /#(\w+)/g;
    const tags: string[] = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
      tags.push(match[1].toLowerCase());
    }
    return [...new Set(tags)];
  }

  async create(
    user_id: bigint,
    createReelDto: CreateReelDto,
    files: {
      thumbnail?: { filename: string; path: string };
      reel?: { filename: string; path: string };
    }
  ) {
    try {
      const thumbnailFileName = files?.thumbnail?.filename ?? null;
      const reelFileName = files?.reel?.filename ?? null;

      let thumbnail: string | null = null;
      if (thumbnailFileName && thumbnailFileName !== "null") {
        thumbnail = thumbnailFileName;
      }

      let reel: string | null = null;
      if (reelFileName && reelFileName !== "null") {
        reel = reelFileName;
      }

      const validProducts = await this.prisma.product.findMany({
        where: {
          id: { in: createReelDto.product_ids },
          seller_id: user_id,
        },
        select: { id: true },
      });

      const validProductIds = validProducts.map((p) => p.id);
      const invalidIds = createReelDto.product_ids.filter(
        (id) => !validProductIds.includes(BigInt(id))
      );

      if (invalidIds.length > 0) {
        const invalidProducts = await this.prisma.product.findMany({
          where: { id: { in: invalidIds } },
          select: { name: true },
        });
        const invalidNames = invalidProducts.map((p) => p.name);
        throw new BadRequestException(
          `Product(s) Not found: ${invalidNames.join(", ")}`
        );
      }

      const id1 = crypto.randomBytes(6).toString('base64url').slice(0, 8);
      const id2 = uuidv4().replace(/-/g, '').slice(0, 8);
      const id3 = crypto.createHash('sha256').update(Date.now().toString() + Math.random().toString()).digest('hex').slice(0, 8);

      const allIds = [id1, id2, id3];
      const randomId = allIds[Math.floor(Math.random() * allIds.length)];


      const reelRecord = await this.prisma.reels.create({
        data: {
          slug: randomId,
          seller_id: user_id,
          reel,
          thumbnail,
          likes: 0,
          views: 0,
          desc: createReelDto.desc,
          source: createReelDto.source,
          facebookLink: createReelDto.facebookLink,
          youtubeLink: createReelDto.youtubeLink,
          product_ids: createReelDto.product_ids
        },
      });

      const hashtags = await this.extractHashtags(createReelDto.desc);
      if (hashtags.length > 0) {
        for (const tagName of hashtags) {
          const tag = await this.prisma.hashTag.upsert({
            where: { name: tagName },
            update: {},
            create: { name: tagName }
          });

          await this.prisma.reelTags.create({
            data: {
              reel_id: reelRecord?.id,
              tag_id: tag.id
            }
          });
        }
      }

      const reelFolder = path.join(
        process.env.IMAGE_PATH!,
        process.env.USER_REELS_PATH!,
        user_id.toString(),
        reelRecord.id.toString(),
        "reel",
      );

      const thumbnailFolder = path.join(
        process.env.IMAGE_PATH!,
        process.env.USER_REELS_PATH!,
        user_id.toString(),
        reelRecord.id.toString(),
        "thumbnail",
      );

      if (reelFileName && files.reel) {
        if (!fs.existsSync(reelFolder)) {
          fs.mkdirSync(reelFolder, { recursive: true });
        }
        const finalReelPath = path.join(reelFolder, reelFileName);
        fs.renameSync(files.reel.path, finalReelPath);
      }

      if (thumbnailFileName && files.thumbnail) {
        if (!fs.existsSync(thumbnailFolder)) {
          fs.mkdirSync(thumbnailFolder, { recursive: true });
        }
        const finalThumbnailPath = path.join(thumbnailFolder, thumbnailFileName);
        fs.renameSync(files.thumbnail.path, finalThumbnailPath);
      }
      return reelRecord;

    } catch (error) {
      throw error;
    }
  }

  async findAllBySeller(user_id: bigint, getReelsDto: GetReelsDto) {
    try {
      const prisma1 = this.prisma.$extends({
        result: {
          reels: {
            reel: {
              needs: { seller_id: true, id: true, reel: true },
              compute(reels) {
                if (reels.reel) {
                  return `${process.env.BASE_PATH}/${process.env.IMAGE_PATH}/${process.env.USER_REELS_PATH}/${reels.seller_id}/${reels.id}/reel/${reels.reel}`;
                }
                else {
                  return ""
                }
              },
            },
            thumbnail: {
              needs: { seller_id: true, id: true, thumbnail: true },
              compute(reels) {
                if (reels.thumbnail) {
                  return `${process.env.BASE_PATH}/${process.env.IMAGE_PATH}/${process.env.USER_REELS_PATH}/${reels.seller_id}/${reels.id}/thumbnail/${reels.thumbnail}`;
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
        },
      });
      let conditions: any[] = [];
      let searchWord = '';

      if (getReelsDto?.search) {
        var str = (getReelsDto?.search).trim();
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

      if (getReelsDto?.approval_status_id) {
        conditions.push({
          approval_status_id: getReelsDto?.approval_status_id
        });
      }

      let reels: any;
      if (getReelsDto && getReelsDto.page && getReelsDto.rowsPerPage) {
        reels = await prisma1.reels.findMany({
          skip: (getReelsDto?.page - 1) * getReelsDto?.rowsPerPage,
          take: getReelsDto?.rowsPerPage,
          where: {
            seller_id: user_id,
            AND: conditions
          },
          orderBy: {
            id: 'desc'
          },
          select: {
            id: true,
            thumbnail: true,
            reel: true,
            desc: true,
            likes: true,
            views: true,
            product_ids: true,
            source: true,
            facebookLink: true,
            youtubeLink: true,
            seller: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true
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
        reels = await prisma1.reels.findMany({
          where: {
            seller_id: user_id
          },
          orderBy: {
            id: 'desc'
          },
          select: {
            id: true,
            thumbnail: true,
            reel: true,
            desc: true,
            likes: true,
            views: true,
            product_ids: true,
            source: true,
            facebookLink: true,
            youtubeLink: true,
            seller: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true
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
      const totalCount = await this.prisma.reels.count({
        where: {
          seller_id: user_id,
          AND: conditions,
        },
      });
      if (reels && reels.length) {
        const enrichedReels = await Promise.all(
          reels.map(async (reel) => {
            const products = await prisma1.product.findMany({
              where: {
                id: { in: reel.product_ids },
              },
              select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                mrp: true,
                images: true
              },
            });

            return {
              ...reel,
              products,
              product_ids: undefined,
            };
          })
        );
        return { Total: totalCount, Reels: enrichedReels };
      }
      return { Total: totalCount, Reels: reels };
    } catch (error) {
      throw error
    }
  }

  async findOneBySeller(reels_id: bigint, user_id: bigint) {
    try {
      const prisma1 = this.prisma.$extends({
        result: {
          reels: {
            reel: {
              needs: { seller_id: true, id: true, reel: true },
              compute(reel) {
                return reel.reel
                  ? `${process.env.BASE_PATH}/${process.env.IMAGE_PATH}/${process.env.USER_REELS_PATH}/${reel.seller_id}/${reel.id}/reel/${reel.reel}`
                  : "";
              },
            },
            thumbnail: {
              needs: { seller_id: true, id: true, thumbnail: true },
              compute(reel) {
                return reel.thumbnail
                  ? `${process.env.BASE_PATH}/${process.env.IMAGE_PATH}/${process.env.USER_REELS_PATH}/${reel.seller_id}/${reel.id}/thumbnail/${reel.thumbnail}`
                  : "";
              },
            },
          },
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
          productImage: {
            src: {
              needs: { product_id: true, src: true },
              compute(src) {
                if (src.src != null && src.src != '' && src.src != undefined) {
                  return `${process.env.BASE_PATH}/${process.env.IMAGE_PATH}/${process.env.PRODUCT_IMAGE_PATH}/${src.product_id}/${src.src}`
                } else {
                  return ""
                }
              },
            },
          },
        },
      });

      const reel = await prisma1.reels.findUnique({
        where: {
          id: reels_id,
          seller_id: user_id
        },
        select: {
          id: true,
          seller_id: true,
          thumbnail: true,
          reel: true,
          desc: true,
          likes: true,
          views: true,
          source: true,
          facebookLink: true,
          youtubeLink: true,
          product_ids: true,
          approval_status: {
            select: {
              id: true,
              title: true,
            },
          },
          seller: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
              image: true,
              created_at: true,
            }
          },
          created_at: true,
        },
      });

      if (!reel) {
        throw new BadRequestException("Reel not found.");
      }

      const products = await prisma1.product.findMany({
        where: {
          id: {
            in: reel.product_ids,
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
          categories: {
            orderBy: {
              id: "asc"
            },
            select: {
              id: true,
              name: true,
            }
          },
          shipping: true,
          out_of_stock: true,
          new_collection: true
        },
      });
      return {
        ...reel,
        products,
        product_ids: undefined,
      };

    } catch (error) {
      throw error;
    }
  }

  async update(reel_id: bigint, user_id: bigint, updateReelDto: UpdateReelDto, files: {
    thumbnail?: { filename: string, path: string },
    reel?: { filename: string, path: string },
  }) {
    try {
      const existingReel = await this.prisma.reels.findFirst({
        where: {
          id: reel_id,
          seller_id: user_id,
        },
        select: { id: true, reel: true, thumbnail: true },
      });
      if (!existingReel) {
        throw new BadRequestException("Reel not found.")
      }
      if (files?.reel?.filename && existingReel?.reel) {
        const reelPath = existingReel.reel;
        const fileName = path.basename(reelPath);
        const fullPath = path.join(
          process.env.IMAGE_PATH!,
          process.env.USER_REELS_PATH!,
          user_id.toString(),
          reel_id.toString(),
          "reel",
          fileName
        );

        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      }
      if (files?.thumbnail?.filename && existingReel?.thumbnail) {
        const thumbnailPath = existingReel.thumbnail;
        const fileName = path.basename(thumbnailPath);
        const fullPath = path.join(
          process.env.IMAGE_PATH!,
          process.env.USER_REELS_PATH!,
          user_id.toString(),
          reel_id.toString(),
          "thumbnail",
          fileName
        );

        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      }

      const thumbnailFileName = files?.thumbnail?.filename ?? '';
      const reelFileName = files?.reel?.filename ?? '';
      let thumbnail: any;
      if (thumbnailFileName && thumbnailFileName !== '') {
        thumbnail = thumbnailFileName;
      } else if (thumbnailFileName === "null") {
        thumbnail = null;
      }

      let reel: any;
      if (reelFileName && reelFileName !== 'null') {
        reel = reelFileName;
      }
      else if (reelFileName === "null") {
        reel = null;
      }

      const validProducts = await this.prisma.product.findMany({
        where: {
          id: { in: updateReelDto.product_ids },
          seller_id: user_id
        },
        select: { id: true }
      });
      const validProductIds = validProducts.map(p => p.id);

      const invalidIds = (updateReelDto.product_ids ?? []).filter(
        id => !validProductIds.includes(BigInt(id))
      );

      if (invalidIds.length > 0) {
        const invalidProducts = await this.prisma.product.findMany({
          where: { id: { in: invalidIds } },
          select: { name: true }
        });
        const invalidNames = invalidProducts.map(p => p.name);
        throw new BadRequestException(`Product(s) Not found.`);
      }
      const updatedReel = await this.prisma.reels.update({
        where: {
          id: reel_id,
          seller_id: user_id,
        },
        data: {
          reel,
          thumbnail,
          ...(updateReelDto.likes !== undefined && {
            likes: BigInt(updateReelDto.likes),
          }),
          ...(updateReelDto.views !== undefined && {
            views: BigInt(updateReelDto.views),
          }),
          desc: updateReelDto.desc,
          source: updateReelDto.source,
          facebookLink: updateReelDto.facebookLink,
          youtubeLink: updateReelDto.youtubeLink,
          product_ids: updateReelDto.product_ids
        },
      });

      if (updateReelDto.desc !== undefined) {
        const hashtags = await this.extractHashtags(updateReelDto.desc);
        await this.prisma.reelTags.deleteMany({
          where: { reel_id: updatedReel.id },
        });
        for (const tagName of hashtags) {
          const tag = await this.prisma.hashTag.upsert({
            where: { name: tagName },
            update: {},
            create: { name: tagName },
          });
          await this.prisma.reelTags.create({
            data: { reel_id: updatedReel.id, tag_id: tag.id },
          });
        }
      }

      return updatedReel;

    } catch (error) {
      throw error;
    }
  }

  async remove(reel_id: bigint, seller_id: bigint) {
    try {
      const existingReel = await this.prisma.reels.findUnique({
        where: {
          id: reel_id,
          seller_id: seller_id,
        },
        select: { id: true, reel: true, thumbnail: true },
      });

      if (!existingReel) {
        throw new BadRequestException('Reel not found.');
      }

      if (existingReel.reel) {
        const fileName = path.basename(existingReel.reel);
        const fullPath = path.join(
          process.env.IMAGE_PATH!,
          process.env.USER_REELS_PATH!,
          seller_id.toString(),
          "reel",
          fileName
        );

        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        } else {
          console.warn('File not found, skipping deletion:', fullPath);
        }
      }
      if (existingReel.thumbnail) {
        const thumbnailPath = existingReel.thumbnail;
        const fileName = path.basename(thumbnailPath);
        const fullPath = path.join(
          process.env.IMAGE_PATH!,
          process.env.USER_REELS_PATH!,
          seller_id.toString(),
          "thumbnail",
          fileName
        );

        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      }
      await this.prisma.likedReels.deleteMany({ where: { reel_id: existingReel.id } })
      await this.prisma.reelTags.deleteMany({ where: { reel_id: existingReel.id } })
      const reels = await this.prisma.reels.delete({
        where: {
          id: existingReel.id,
        },
      });

      return reels;
    } catch (error) {
      throw error;
    }
  }

  //Admin Part
  async findAll(getReelsDto: GetReelsDto) {
    try {
      const prisma1 = await this.prisma.$extends({
        result: {
          reels: {
            reel: {
              needs: { seller_id: true, id: true, reel: true },
              compute(reels) {
                if (reels.reel) {
                  return `${process.env.BASE_PATH}/${process.env.IMAGE_PATH}/${process.env.USER_REELS_PATH}/${reels.seller_id}/${reels.id}/reel/${reels.reel}`;
                }
                else {
                  return ""
                }
              },
            },
            thumbnail: {
              needs: { seller_id: true, id: true, thumbnail: true },
              compute(reels) {
                if (reels.thumbnail) {
                  return `${process.env.BASE_PATH}/${process.env.IMAGE_PATH}/${process.env.USER_REELS_PATH}/${reels.seller_id}/${reels.id}/thumbnail/${reels.thumbnail}`;
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
        },
      });
      let conditions: any[] = [];
      let searchWord = '';

      if (getReelsDto?.search) {
        var str = (getReelsDto?.search).trim();
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

      if (getReelsDto?.approval_status_id) {
        conditions.push({
          approval_status_id: getReelsDto?.approval_status_id
        });
      }

      let reels: any;
      if (getReelsDto && getReelsDto.page && getReelsDto.rowsPerPage) {
        reels = await prisma1.reels.findMany({
          skip: (getReelsDto?.page - 1) * getReelsDto?.rowsPerPage,
          take: getReelsDto?.rowsPerPage,
          where: {
            AND: conditions
          },
          orderBy: {
            id: 'desc'
          },
          select: {
            id: true,
            thumbnail: true,
            reel: true,
            desc: true,
            likes: true,
            views: true,
            source: true,
            facebookLink: true,
            youtubeLink: true,
            product_ids: true,
            seller: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true
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
        reels = await prisma1.reels.findMany({
          where: {
            AND: conditions
          },
          orderBy: {
            id: 'desc'
          },
          select: {
            id: true,
            thumbnail: true,
            reel: true,
            desc: true,
            likes: true,
            views: true,
            source: true,
            facebookLink: true,
            youtubeLink: true,
            product_ids: true,
            seller: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true
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
      const totalCount = await this.prisma.reels.count({
        where: {
          AND: conditions,
        },
      });
      if (reels && reels.length) {
        const enrichedReels = await Promise.all(
          reels.map(async (reel) => {
            const products = await prisma1.product.findMany({
              where: {
                id: { in: reel.product_ids },
              },
              select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                mrp: true,
                images: true
              },
            });

            return {
              ...reel,
              products,
              product_ids: undefined,
            };
          })
        );
        return { Total: totalCount, Reels: enrichedReels };
      }
      return { Total: totalCount, Reels: reels };
    } catch (error) {
      throw error
    }
  }

  async findReels(reels_id: bigint) {
    try {
      const prisma1 = this.prisma.$extends({
        result: {
          reels: {
            reel: {
              needs: { seller_id: true, id: true, reel: true },
              compute(reel) {
                return reel.reel
                  ? `${process.env.BASE_PATH}/${process.env.IMAGE_PATH}/${process.env.USER_REELS_PATH}/${reel.seller_id}/${reel.id}/reel/${reel.reel}`
                  : "";
              },
            },
            thumbnail: {
              needs: { seller_id: true, id: true, thumbnail: true },
              compute(reel) {
                return reel.thumbnail
                  ? `${process.env.BASE_PATH}/${process.env.IMAGE_PATH}/${process.env.USER_REELS_PATH}/${reel.seller_id}/${reel.id}/thumbnail/${reel.thumbnail}`
                  : "";
              },
            },
          },
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
          productImage: {
            src: {
              needs: { product_id: true, src: true },
              compute(src) {
                if (src.src != null && src.src != '' && src.src != undefined) {
                  return `${process.env.BASE_PATH}/${process.env.IMAGE_PATH}/${process.env.PRODUCT_IMAGE_PATH}/${src.product_id}/${src.src}`
                } else {
                  return ""
                }
              },
            },
          },
        },
      });

      const reel = await prisma1.reels.findUnique({
        where: { id: reels_id },
        select: {
          id: true,
          seller_id: true,
          thumbnail: true,
          reel: true,
          desc: true,
          likes: true,
          views: true,
          source: true,
          facebookLink: true,
          youtubeLink: true,
          product_ids: true,
          approval_status: {
            select: {
              id: true,
              title: true,
            },
          },
          seller: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
              image: true,
              created_at: true,
            }
          },
          created_at: true,
        },
      });

      if (!reel) {
        throw new BadRequestException("Reel not found.");
      }

      const products = await prisma1.product.findMany({
        where: {
          id: { in: reel.product_ids },
        },
        select: {
          id: true,
          name: true,
          description: true,
          sku: true,
          mrp: true,
          categories: {
            select: {
              id: true,
              name: true,
              image: true
            }
          },
          images: {
            select: {
              src: true,
            },
          },
          shipping: true,
          out_of_stock: true,
          new_collection: true,
          clickCount: {
            where: {
              reel_id: reel.id
            },
            select: {
              count: true,
            }
          }
        },
      });
      return {
        ...reel,
        products,
        product_ids: undefined,
      };

    } catch (error) {
      throw error;
    }
  }

  async updateStatus(reel_id: bigint, dto: updateStatusDto) {
    try {
      const update = await this.prisma.reels.update({
        where: {
          id: reel_id
        },
        data: {
          approval_status_id: dto.approval_status_id
        },
        select: {
          id: true,
          reel: true,
          thumbnail: true,
          product_ids: true,
          approval_status: {
            select: {
              id: true,
              title: true
            }
          },
          seller: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true
            }
          },
          created_at: true,
        }
      })
      return update;
    } catch (error) {
      throw error
    }
  }

  async removeReel(reel_id: bigint) {
    try {
      const existingReel = await this.prisma.reels.findUnique({
        where: {
          id: reel_id,
        },
        select: { id: true, reel: true, seller_id: true, thumbnail: true },
      });
      if (!existingReel) {
        throw new BadRequestException('Reel not found.');
      }

      if (existingReel.reel) {
        const fileName = path.basename(existingReel.reel);
        const fullPath = path.join(
          process.env.IMAGE_PATH!,
          process.env.USER_REELS_PATH!,
          existingReel.seller_id.toString(),
          "reel",
          fileName
        );

        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        } else {
          console.warn('File not found, skipping deletion:', fullPath);
        }
      }
      if (existingReel.thumbnail) {
        const thumbnailPath = existingReel.thumbnail;
        const fileName = path.basename(thumbnailPath);
        const fullPath = path.join(
          process.env.IMAGE_PATH!,
          process.env.USER_REELS_PATH!,
          existingReel.seller_id.toString(),
          "thumbnail",
          fileName
        );

        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      }
      await this.prisma.likedReels.deleteMany({
        where: {
          reel_id: existingReel.id
        }
      })
      await this.prisma.reelTags.deleteMany({
        where: {
          reel_id: existingReel.id
        }
      })
      const reels = await this.prisma.reels.delete({
        where: {
          id: reel_id,
        },
        select: {
          id: true,
          reel: true,
          thumbnail: true,
          product_ids: true,
          source: true,
          facebookLink: true,
          youtubeLink: true,
          approval_status: {
            select: {
              id: true,
              title: true
            }
          },
          seller: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true
            }
          },
          created_at: true,
        }
      });

      return reels;
    } catch (error) {
      throw error;
    }
  }

}
