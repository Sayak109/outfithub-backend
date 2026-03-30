import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';
import { PrismaService } from '@/prisma/prisma.service';
import { GetLivesDto } from '@/live/dto/get-lives.dto';
import { Request, Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { createNotification } from '@/common/helper/common.helper';

@Injectable()
export class FeedbackService {
  constructor(
    private prisma: PrismaService
  ) { }
  async create(user_id: bigint, createFeedbackDto: CreateFeedbackDto) {
    try {
      const user = await this.prisma.user.findUnique({
        where: {
          id: user_id
        }
      })
      const product = await this.prisma.product.findUnique({
        where: {
          id: BigInt(createFeedbackDto.product_id),
        }
      })
      const review = await this.prisma.customerFeedback.create({
        data: {
          user_id: user_id,
          product_id: BigInt(createFeedbackDto.product_id),
          ratings: Number(createFeedbackDto.ratings),
          description: createFeedbackDto.description,
          anonymous: createFeedbackDto.anonymous,
        },
      });
      await createNotification(
        BigInt(1),
        "REVIEW_POSTED",
        "New Product Review Submitted",
        `${user?.first_name} ${user?.last_name} has submitted a new review for "${product?.name}".`,
        {
          product_id: product?.id,
          review_id: review.id,
          customer_id: user?.id,
          ratings: review.ratings,
          anonymous: review.anonymous,
        },
      );
      return review;
    } catch (error) {
      throw error
    }
  }

  async FeedbackImage(feedback_id: bigint, file) {
    try {
      const imageFileName = file?.filename ?? '';

      let dataToUpdate: any = {}
      if (imageFileName === "null") {
        dataToUpdate.images = null;
      } else if (imageFileName !== '') {
        dataToUpdate.images = `${imageFileName}`;
      }

      const product = await this.prisma.customerFeedbackImage.create({
        data: {
          name: imageFileName,
          src: imageFileName,
          alt: imageFileName,
          feedback_id: feedback_id,
        }
      });

      return product;
    } catch (error: any) {
      throw error;
    }
  }

  async findAllReview(product_id: bigint, feedbackDto: GetLivesDto) {
    try {
      const prisma1 = await this.prisma.$extends({
        result: {
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

      if (feedbackDto?.search) {
        var str = (feedbackDto?.search).trim();
        searchWord = str;
        conditions.push({
          OR: [
            { ratings: { contains: searchWord, mode: "insensitive" } },
            { description: { contains: searchWord, mode: "insensitive" } },
            { user: { first_name: { contains: searchWord, mode: "insensitive" } } },
            { user: { last_name: { contains: searchWord, mode: "insensitive" } } },
            {
              AND: [
                { user: { first_name: { contains: searchWord.split(" ")[0], mode: "insensitive" } } },
                { user: { last_name: { contains: searchWord.split(" ")[1] ?? "", mode: "insensitive" } } }
              ]
            },
          ]
        });
      }

      if (feedbackDto?.approval_status_id) {
        conditions.push({
          approval_status_id: feedbackDto?.approval_status_id
        });
      }

      let feedback: any;
      if (feedbackDto && feedbackDto.page && feedbackDto.rowsPerPage) {
        feedback = await prisma1.customerFeedback.findMany({
          skip: (feedbackDto?.page - 1) * feedbackDto?.rowsPerPage,
          take: feedbackDto?.rowsPerPage,
          where: {
            product_id,
            AND: conditions,
            approval_status_id: 2,
          },
          orderBy: {
            id: 'desc'
          },
          select: {
            id: true,
            anonymous: true,
            ratings: true,
            description: true,
            userReviewImage: {
              select: {
                id: true,
                src: true
              }
            },
            user: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                image: true,
              }
            },
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                mrp: true
              }
            },
            approval_status: {
              select: {
                id: true,
                title: true
              }
            },
            created_at: true,
          }
        })
      } else {
        feedback = await prisma1.customerFeedback.findMany({
          where: {
            product_id,
            AND: conditions,
            approval_status_id: 2,
          },
          orderBy: {
            id: 'desc'
          },
          select: {
            id: true,
            anonymous: true,
            ratings: true,
            description: true,
            userReviewImage: {
              select: {
                id: true,
                src: true
              }
            },
            user: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                image: true,
              }
            },
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                mrp: true
              }
            },
            approval_status: {
              select: {
                id: true,
                title: true
              }
            },
            created_at: true,
          }
        })
      }
      const totalCount = await prisma1.customerFeedback.count({
        where: {
          product_id,
          AND: conditions,
          approval_status_id: 2,
        },
      });
      return { Total: totalCount, Feedback: feedback };
    } catch (error) {
      throw error;
    }
  }

  async findAll(feedbackDto: GetLivesDto) {
    try {
      const prisma1 = await this.prisma.$extends({
        result: {
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

      if (feedbackDto?.search) {
        const str = feedbackDto.search.trim();
        const searchWord = str;
        const ratingAsNumber = parseFloat(searchWord);

        const orConditions: any[] = [
          { description: { contains: searchWord, mode: "insensitive" } },
          { user: { first_name: { contains: searchWord, mode: "insensitive" } } },
          { user: { last_name: { contains: searchWord, mode: "insensitive" } } },
          {
            AND: [
              { user: { first_name: { contains: searchWord.split(" ")[0], mode: "insensitive" } } },
              { user: { last_name: { contains: searchWord.split(" ")[1] ?? "", mode: "insensitive" } } },
            ],
          },
        ];

        if (!isNaN(ratingAsNumber)) {
          orConditions.push({
            ratings: {
              gte: ratingAsNumber - 0.5,
              lte: ratingAsNumber + 0.5,
            },
          });
        }

        conditions.push({ OR: orConditions });
      }

      if (feedbackDto?.approval_status_id) {
        conditions.push({
          approval_status_id: feedbackDto?.approval_status_id
        });
      }

      let feedback: any;
      if (feedbackDto && feedbackDto.page && feedbackDto.rowsPerPage) {
        feedback = await prisma1.customerFeedback.findMany({
          skip: (feedbackDto?.page - 1) * feedbackDto?.rowsPerPage,
          take: feedbackDto?.rowsPerPage,
          where: {
            AND: conditions
          },
          orderBy: {
            id: 'desc'
          },
          select: {
            id: true,
            anonymous: true,
            ratings: true,
            description: true,
            userReviewImage: {
              select: {
                id: true,
                src: true
              }
            },
            user: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                image: true,
              }
            },
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                mrp: true
              }
            },
            approval_status: {
              select: {
                id: true,
                title: true
              }
            },
            created_at: true,
          }
        })
      } else {
        feedback = await prisma1.customerFeedback.findMany({
          where: {
            AND: conditions
          },
          orderBy: {
            id: 'desc'
          },
          select: {
            id: true,
            anonymous: true,
            ratings: true,
            description: true,
            userReviewImage: {
              select: {
                id: true,
                src: true
              }
            },
            user: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                image: true,
              }
            },
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                mrp: true
              }
            },
            approval_status: {
              select: {
                id: true,
                title: true
              }
            },
            created_at: true,
          }
        })
      }
      const totalCount = await prisma1.customerFeedback.count({
        where: {
          AND: conditions,
        },
      });
      return { Total: totalCount, Feedback: feedback };
    } catch (error) {
      console.log("error", error);

      throw error;
    }
  }

  async findOne(feedback_id: bigint) {
    try {
      const prisma1 = await this.prisma.$extends({
        result: {
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
      })
      const feedback = await prisma1.customerFeedback.findUnique({
        where: {
          id: feedback_id
        },
        select: {
          id: true,
          anonymous: true,
          ratings: true,
          description: true,
          userReviewImage: {
            select: {
              id: true,
              src: true
            }
          },
          user: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              image: true,
              created_at: true
            }
          },
          product: {
            select: {
              id: true,
              name: true,
              description: true,
              sku: true,
              mrp: true,
              shipping: true,
              images: {
                select: {
                  name: true,
                  src: true,
                  main_image: true,
                }
              }
            },
          },
          approval_status: {
            select: {
              id: true,
              title: true
            }
          },
          created_at: true,
        }
      })
      return feedback
    } catch (error) {
      throw error;
    }
  }

  async update(feedback_id: bigint, updateFeedbackDto: UpdateFeedbackDto, req: Request, user_email: string) {
    try {
      const feedback = await this.prisma.customerFeedback.update({
        where: {
          id: feedback_id
        },
        data: {
          approval_status_id: updateFeedbackDto.status_id
        }
      })
      if (updateFeedbackDto.status_id === 2) {
        const avgRating = await this.prisma.customerFeedback.aggregate({
          _avg: {
            ratings: true,
          },
          where: {
            product_id: BigInt(feedback.product_id),
          },
        });
        await this.prisma.product.update({
          where: {
            id: BigInt(feedback.product_id),
          },
          data: {
            average_rating: (avgRating._avg.ratings)?.toFixed(1) || "0",
          },
        });
      }

      await this.prisma.adminActivityLog.create({
        data: {
          action: 'UPDATE',
          description: `Product "${feedback.description}" updated by "${user_email}".`,
          ip: req.ip,
          userAgent: req.headers['user-agent'] || '',
        },
      });
      return feedback
    } catch (error) {
      throw error;
    }
  }

  async remove(feedback_id: bigint, req: Request, user_email: string) {
    try {
      const feedbacks = await this.prisma.customerFeedback.findFirst({
        where: {
          id: feedback_id
        },
        include: {
          userReviewImage: {
            select: {
              src: true,
            }
          }
        }
      })
      if (!feedbacks) {
        throw new BadRequestException("No review found.")
      }
      await this.prisma.adminActivityLog.create({
        data: {
          action: 'UPDATE',
          description: `Product "${feedbacks?.description}" updated by "${user_email}".`,
          ip: req.ip,
          userAgent: req.headers['user-agent'] || '',
        },
      });
      for (const feedback of feedbacks?.userReviewImage) {
        const fileName = path.basename(feedback.src);
        const fullPath = path.join(
          process.env.IMAGE_PATH!,
          process.env.CUSTOMER_FEEDBACK_IMAGE_PATH!,
          feedbacks.id.toString(),
          fileName
        );
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        } else {
          console.warn('File not found, skipping deletion:', fullPath);
        }
      }
      await this.prisma.customerFeedbackImage.deleteMany({
        where: {
          feedback_id
        }
      })
      const del = await this.prisma.customerFeedback.deleteMany({
        where: {
          id: feedback_id
        }
      })
      return del
    } catch (error) {
      throw error;
    }
  }
}
