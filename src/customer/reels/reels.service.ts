import { Injectable, Param } from '@nestjs/common';
import { CreateReelDto } from './dto/create-reel.dto';
import { UpdateReelDto } from './dto/update-reel.dto';
import { PrismaService } from '@/prisma/prisma.service';
import { PaginationDto } from '../product/dto/pagination.dto';
import { createNotification } from '@/common/helper/common.helper';

@Injectable()
export class ReelsService {
  constructor(private prisma: PrismaService) { }

  async create(reel_id: bigint, createReelDto: CreateReelDto) {
    try {
      const clickCount = await this.prisma.productClickCount.upsert({
        where: {
          reel_id_product_id: {
            product_id: createReelDto.product_id,
            reel_id: reel_id,
          },
        },
        update: {
          count: {
            increment: 1,
          },
        },
        create: {
          reel_id: reel_id,
          product_id: createReelDto.product_id,
          count: 1,
        },
      });

      return clickCount;
    } catch (error) {
      throw error;
    }
  }

  async findAllReels(dto: PaginationDto, user_id?: bigint) {
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
      });
      let conditions: any[] = [];
      let searchWord = '';

      if (dto?.search) {
        let str = (dto?.search).trim();
        searchWord = str;
        conditions.push({
          OR: [
            { name: { contains: searchWord, mode: "insensitive" } },
            { slug: { contains: searchWord, mode: "insensitive" } },
            { description: { contains: searchWord, mode: "insensitive" } },
          ]
        });
      }

      if (dto?.link) {
        const seller = await this.prisma.sellerStoreFront.findUnique({
          where: {
            link: dto?.link
          }
        })
        conditions.push({
          seller_id: seller?.user_id
        })
      }
      let likedReelIds: Set<number> = new Set();

      if (user_id) {
        const likedReels = await this.prisma.likedReels.findMany({
          where: {
            user_id: user_id,
          },
          select: {
            reel_id: true,
          },
        });
        likedReelIds = new Set(likedReels.map((r) => Number(r.reel_id)));
      }

      let reels: any;
      if (dto && dto.page && dto.rowsPerPage) {
        reels = await prisma1.reels.findMany({
          skip: (dto?.page - 1) * dto?.rowsPerPage,
          take: dto?.rowsPerPage,
          where: {
            approval_status_id: 2,
            AND: conditions
          },
          orderBy: {
            id: 'desc'
          },
          select: {
            id: true,
            slug: true,
            thumbnail: true,
            reel: true,
            desc: true,
            likes: true,
            views: true,
            product_ids: true,
            source: true,
            youtubeLink: true,
            facebookLink: true,
            seller: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
                image: true,
                sellerProfile: {
                  select: {
                    business_logo: true,
                    business_name: true,
                    business_tag: true
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
        reels = await prisma1.reels.findMany({
          skip: (dto?.page - 1) * dto?.rowsPerPage,
          take: dto?.rowsPerPage,
          where: {
            approval_status_id: 2,
            AND: conditions
          },
          orderBy: {
            id: 'desc'
          },
          select: {
            id: true,
            slug: true,
            thumbnail: true,
            reel: true,
            desc: true,
            likes: true,
            views: true,
            product_ids: true,
            source: true,
            youtubeLink: true,
            facebookLink: true,
            seller: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
                image: true,
                sellerProfile: {
                  select: {
                    business_logo: true,
                    business_name: true,
                    business_tag: true
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
      }

      reels = reels.map((reel: any) => ({
        ...reel,
        liked: likedReelIds.has(Number(reel.id)),
      }));
      const total = await this.prisma.reels.count({
        where: {
          approval_status_id: 2,
          AND: conditions
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
                images: {
                  select: {
                    id: true,
                    name: true,
                    alt: true,
                    src: true,
                    main_image: true,
                    created_at: true
                  }
                }
              },
            });

            return {
              ...reel,
              products,
              product_ids: undefined,
            };
          })
        );
        return { Total: total, Reels: enrichedReels };
      }
      return { Total: total, Reels: [] };
    } catch (error) {
      throw error
    }
  }

  async findRellsBySlug(slug: string, user_id?: bigint) {
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
      });

      let likedReelIds: Set<number> = new Set();

      if (user_id) {
        const likedReels = await this.prisma.likedReels.findMany({
          where: {
            user_id: user_id,
          },
          select: {
            reel_id: true,
          },
        });
        likedReelIds = new Set(likedReels.map((r) => Number(r.reel_id)));
      }

      let reel = await prisma1.reels.findUnique({
        where: { slug },
        select: {
          id: true,
          slug: true,
          thumbnail: true,
          reel: true,
          desc: true,
          likes: true,
          views: true,
          product_ids: true,
          source: true,
          youtubeLink: true,
          facebookLink: true,
          seller: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
              image: true,
              sellerProfile: {
                select: {
                  business_logo: true,
                  business_name: true,
                  business_tag: true
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
      if (!reel) return null;

      const liked = likedReelIds.has(Number(reel?.id));
      reel = { ...reel, liked } as typeof reel & { liked: boolean };

      let products: any;
      if (reel) {
        products = await prisma1.product.findFirst({
          where: {
            id: { in: reel.product_ids },
          },
          select: {
            id: true,
            name: true,
            description: true,
            mrp: true,
            average_rating: true,
            images: {
              select: {
                id: true,
                name: true,
                alt: true,
                src: true,
                main_image: true,
                created_at: true
              }
            }
          },
        })
      }
      return { ...reel, products };
    } catch (error) {
      throw error
    }
  }

  async update(reel_id: bigint, user_id: bigint, updateReelDto: UpdateReelDto) {
    const { likes, views, ...rest } = updateReelDto;
    try {
      const user = await this.prisma.user.findUnique({
        where: {
          id: user_id
        }
      })
      const seller = await this.prisma.reels.findUnique({
        where: {
          id: reel_id
        },
        select: {
          seller: {
            select: {
              id: true,
            }
          }
        }
      })
      const updateData: any = { ...rest };

      if (likes !== undefined && likes !== 0) {
        updateData.likes = likes > 0
          ? { increment: likes }
          : { decrement: Math.abs(likes) };
      }

      if (views !== undefined && views !== 0) {
        updateData.views = views > 0
          ? { increment: views }
          : { decrement: Math.abs(views) };
      }

      const updatedReel = await this.prisma.reels.update({
        where: { id: reel_id },
        data: updateData,
      });

      if (likes !== undefined && likes !== 0) {
        if (likes > 0) {
          await this.prisma.likedReels.upsert({
            where: {
              user_id_reel_id: {
                user_id,
                reel_id,
              }
            },
            update: {},
            create: {
              user_id,
              reel_id,
            },
          });
        } else {
          await this.prisma.likedReels.deleteMany({
            where: {
              user_id,
              reel_id,
            },
          });
        }
      }
      const haveInappPreferance = await this.prisma.notificationPreference.count({
        where: {
          user_id: seller?.seller.id,
          preference_category_id: 5
        }
      })
      if (haveInappPreferance && likes !== undefined && likes > 0) {
        await this.addLikeNotification(reel_id, user_id);
      }

      return updatedReel;
    } catch (error) {
      throw error;
    }
  }

  async topTags() {
    try {
      const tags = await this.prisma.hashTag.findMany({
        include: {
          _count: {
            select: {
              tags: true
            }
          }
        },
        orderBy: {
          tags: {
            _count: 'desc'
          }
        },
        take: 6
      });

      return tags;
    } catch (error) {
      throw error;
    }
  }


  async reelsbyTags(dto: PaginationDto, tag: string, user_id?: bigint) {
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
      });
      const hashTag = await this.prisma.hashTag.findUnique({
        where: {
          name: tag
        }
      })
      if (!hashTag) {
        return { Total: 0, Reels: [] };
      }
      let conditions: any[] = [];
      let searchWord = '';

      if (dto?.search) {
        let str = (dto?.search).trim();
        searchWord = str;
        conditions.push({
          OR: [
            { name: { contains: searchWord, mode: "insensitive" } },
            { slug: { contains: searchWord, mode: "insensitive" } },
            { description: { contains: searchWord, mode: "insensitive" } },
          ]
        });
      }

      if (dto?.link) {
        const seller = await this.prisma.sellerStoreFront.findUnique({
          where: {
            link: dto?.link
          }
        })
        conditions.push({
          seller_id: seller?.user_id
        })
      }
      let likedReelIds: Set<number> = new Set();

      if (user_id) {
        const likedReels = await this.prisma.likedReels.findMany({
          where: {
            user_id: user_id,
          },
          select: {
            reel_id: true,
          },
        });
        likedReelIds = new Set(likedReels.map((r) => Number(r.reel_id)));
      }

      let reels: any;
      if (dto && dto.page && dto.rowsPerPage) {
        reels = await prisma1.reels.findMany({
          skip: (dto?.page - 1) * dto?.rowsPerPage,
          take: dto?.rowsPerPage,
          where: {
            tags: {
              some: {
                tag_id: {
                  in: [hashTag?.id]
                }
              }
            },
            approval_status_id: 2,
            AND: conditions
          },
          orderBy: {
            id: 'desc'
          },
          select: {
            id: true,
            slug: true,
            thumbnail: true,
            reel: true,
            desc: true,
            likes: true,
            views: true,
            product_ids: true,
            source: true,
            youtubeLink: true,
            facebookLink: true,
            seller: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
                image: true,
                sellerProfile: {
                  select: {
                    business_logo: true,
                    business_name: true,
                    business_tag: true
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
        reels = await prisma1.reels.findMany({
          skip: (dto?.page - 1) * dto?.rowsPerPage,
          take: dto?.rowsPerPage,
          where: {
            tags: {
              some: {
                tag_id: {
                  in: [hashTag?.id]
                }
              }
            },
            approval_status_id: 2,
            AND: conditions
          },
          orderBy: {
            id: 'desc'
          },
          select: {
            id: true,
            slug: true,
            thumbnail: true,
            reel: true,
            desc: true,
            likes: true,
            views: true,
            product_ids: true,
            source: true,
            youtubeLink: true,
            facebookLink: true,
            seller: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
                image: true,
                sellerProfile: {
                  select: {
                    business_logo: true,
                    business_name: true,
                    business_tag: true
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
      }

      reels = reels.map((reel: any) => ({
        ...reel,
        liked: likedReelIds.has(Number(reel.id)),
      }));
      const total = await this.prisma.reels.count({
        where: {
          tags: {
            some: {
              tag_id: {
                in: [hashTag?.id]
              }
            }
          },
          approval_status_id: 2,
          AND: conditions
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
                images: {
                  select: {
                    src: true,
                    main_image: true,
                  }
                }
              },
            });

            return {
              ...reel,
              products,
              product_ids: undefined,
            };
          })
        );
        return { Total: total, Reels: enrichedReels };
      }
      return { Total: total, Reels: [] };
    } catch (error) {
      throw error
    }
  }


  async addLikeNotification(
    reel_id: bigint,
    liker_id: bigint,
  ) {
    const liker = await this.prisma.user.findUnique({ where: { id: liker_id } });
    const reel = await this.prisma.reels.findUnique({
      where: { id: reel_id },
      select: { seller: { select: { id: true } } }
    });

    const receiverId = reel?.seller?.id;
    if (!receiverId) return;

    let existingNotif = await this.prisma.inAppNotifications.findFirst({
      where: {
        user_id: receiverId,
        type: "REEL_LIKED",
        created_at: { gte: new Date(Date.now() - 5 * 60 * 1000) }
      },
      include: { notificationActor: true }
    });

    if (existingNotif) {
      await this.prisma.notificationActor.upsert({
        where: {
          notification_id_user_id: {
            notification_id: existingNotif.id,
            user_id: liker_id,
          },
        },
        update: {},
        create: {
          notification_id: existingNotif.id,
          user_id: liker_id,
        },
      });


      const totalActors = existingNotif?.notificationActor?.length + 1;
      let body = "";

      if (totalActors === 1) {
        body = `${liker?.first_name} ${liker?.last_name} liked your reel.`;
      } else if (totalActors === 2) {
        const other = existingNotif.notificationActor[0];
        const otherUser = await this.prisma.user.findUnique({ where: { id: other.user_id } });
        body = `${otherUser?.first_name} and ${liker?.first_name} liked your reel.`;
      } else {
        body = `${liker?.first_name} ${liker?.last_name} and ${totalActors - 1} others liked your reel.`;
      }

      await this.prisma.inAppNotifications.update({
        where: { id: existingNotif.id },
        data: { body }
      });

    } else {
      const newNotif = await createNotification(
        receiverId,
        "REEL_LIKED",
        "Like",
        `${liker?.first_name} ${liker?.last_name} liked your reel.`,
        {
          reel_id: reel_id,
          seller_id: receiverId,
          user_id: liker?.id,
        },
      );
      await this.prisma.notificationActor.create({
        data: { notification_id: newNotif.id, user_id: liker_id }
      });
    }
  }

  remove(id: number) {
    return `This action removes a #${id} reel`;
  }
}
