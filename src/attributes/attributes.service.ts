import { BadRequestException, HttpStatus, Injectable, Res } from '@nestjs/common';
import { UpdateAttributeDto } from './dto/update-attribute.dto';
import { ApiResponse } from '@/common/dto/response.dto';
import { Request, Response } from 'express';
import { PrismaService } from '@/prisma/prisma.service';
import { generateSlug } from '@/common/helper/common.helper';
import { FindAttributesDto } from './dto/find-attributes.dto';
import { CreateAttributeDto } from './dto/create-attribute.dto';

@Injectable()
export class AttributesService {
  constructor(
    // private jwt: JwtService,
    private prisma: PrismaService,
  ) { }

  async create(createAttributeDto: CreateAttributeDto) {
    try {
      const existingAttribute = await this.prisma.productAttribute.findFirst({
        where: {
          name: {
            equals: createAttributeDto.name,
            mode: 'insensitive',
          },
        },
      });

      if (existingAttribute) {
        throw new BadRequestException(`Attribute '${createAttributeDto.name}' already exists`);
      }
      const attributeSlug = await generateSlug(
        createAttributeDto.name,
        this.prisma.productAttribute,
        'slug'
      );

      const attribute = await this.prisma.productAttribute.create({
        data: {
          name: createAttributeDto.name,
          slug: attributeSlug,
          status_id: 1,
        },
      });

      const attributeTermsData: any = [];
      for (const val of createAttributeDto.values) {
        const termSlug = await generateSlug(
          val,
          this.prisma.productAttributeTerm,
          'slug'
        );

        attributeTermsData.push({
          name: val,
          slug: termSlug,
          attribute_id: attribute.id,
          status_id: 1,
        });
      }

      await this.prisma.productAttributeTerm.createMany({
        data: attributeTermsData,
      });

      return {
        attribute,
        terms: attributeTermsData,
      };
    } catch (error: any) {
      throw error;
    }
  }

  // async create(createAttributeDto: CreateAttributeDto) {
  //   try {
  //     const existingAttribute = await this.prisma.productAttribute.findFirst({
  //       where: {
  //         name: {
  //           equals: createAttributeDto.name,
  //           mode: 'insensitive',
  //         },
  //       },
  //     });

  //     if (existingAttribute) {
  //       throw new BadRequestException(`Attribute '${createAttributeDto.name}' already exists`);
  //     }
  //     const attributeSlug = await generateSlug(
  //       createAttributeDto.name,
  //       this.prisma.productAttribute,
  //       'slug'
  //     );

  //     const attribute = await this.prisma.productAttribute.create({
  //       data: {
  //         name: createAttributeDto.name,
  //         slug: attributeSlug,
  //         status_id: 1,
  //       },
  //     });

  //     const attributeTermsData: any[] = [];
  //     const seenTerms = new Set<string>();

  //     for (const val of createAttributeDto.values) {
  //       if (seenTerms.has(val)) continue;
  //       seenTerms.add(val);

  //       const existingTerm = await this.prisma.productAttributeTerm.findFirst({
  //         where: {
  //           name: val,
  //           attribute_id: attribute.id,
  //         },
  //       });
  //       if (existingAttribute) {
  //         throw new BadRequestException(`Attribute value'${existingTerm?.name}' already exists`);
  //       }
  //       const termSlug = await generateSlug(
  //         val,
  //         this.prisma.productAttributeTerm,
  //         'slug'
  //       );

  //       attributeTermsData.push({
  //         name: val,
  //         slug: termSlug,
  //         attribute_id: attribute.id,
  //         status_id: 1,
  //       });
  //     }

  //     if (attributeTermsData.length > 0) {
  //       await this.prisma.productAttributeTerm.createMany({
  //         data: attributeTermsData,
  //       });
  //     }

  //     return {
  //       attribute,
  //       terms: attributeTermsData,
  //     };
  //   } catch (error: any) {
  //     throw error;
  //   }
  // }

  async updateAttribute(attribute_id: bigint, updateAttributeDto: UpdateAttributeDto) {
    try {
      const existingAttribute = await this.prisma.productAttribute.findUnique({
        where: { id: attribute_id },
      });

      if (!existingAttribute) {
        throw new BadRequestException(`Attribute with id ${attribute_id} not found.`);
      }

      if (updateAttributeDto.name === "" || updateAttributeDto.name === undefined || updateAttributeDto.name === null) {
        throw new BadRequestException(`Attribute name should not be empty.`);
      }

      const duplicateAttribute = await this.prisma.productAttribute.findFirst({
        where: {
          name: {
            equals: updateAttributeDto.name,
            mode: 'insensitive',
          },
          NOT: {
            id: attribute_id,
          },
        },
      });

      if (duplicateAttribute) {
        throw new BadRequestException(`Attribute '${updateAttributeDto.name}' already exists.`);
      }

      let newSlug = existingAttribute.slug;
      if (updateAttributeDto.name && updateAttributeDto.name !== existingAttribute.name) {
        newSlug = await generateSlug(
          updateAttributeDto.name,
          this.prisma.productAttribute,
          'slug'
        );
      }
      const attribute = await this.prisma.productAttribute.update({
        where: { id: attribute_id },
        data: {
          name: updateAttributeDto.name,
          slug: newSlug,
          status_id: updateAttributeDto.status_id,
        },
      });

      const attributeTermsData: any = [];
      if (updateAttributeDto.values) {
        for (const val of updateAttributeDto.values) {

          const duplicateAttributeTerm = await this.prisma.productAttributeTerm.findFirst({
            where: {
              name: {
                equals: val,
                mode: 'insensitive',
              },
            },
          });

          if (duplicateAttributeTerm) {
            throw new BadRequestException(`Attribute value '${val}' already exists.`);
          }

          const termSlug = await generateSlug(
            val,
            this.prisma.productAttributeTerm,
            'slug'
          );

          attributeTermsData.push({
            name: val,
            slug: termSlug,
            attribute_id: attribute.id,
            status_id: 1,
          });
        }
        await this.prisma.productAttributeTerm.createMany({
          data: attributeTermsData,
        });
      }
      return {
        attribute,
        terms: attributeTermsData,
      };

    } catch (error: any) {
      throw error;
    }
  }

  async updateAttributeTerm(term_id: bigint, updateAttributeTermDto: UpdateAttributeDto) {
    try {
      const existingAttributeTerm = await this.prisma.productAttributeTerm.findUnique({
        where: { id: term_id },
      });

      if (!existingAttributeTerm) {
        throw new BadRequestException(`Attribute with id ${term_id} not found.`);
      }

      if (updateAttributeTermDto.name === "" || updateAttributeTermDto.name === undefined || updateAttributeTermDto.name === null) {
        throw new BadRequestException(`Attribute Terms name should not be empty.`);
      }

      const duplicateAttributeTerm = await this.prisma.productAttributeTerm.findFirst({
        where: {
          name: {
            equals: updateAttributeTermDto.name,
            mode: 'insensitive',
          },
          NOT: {
            id: term_id
          },
        },
      });

      if (duplicateAttributeTerm) {
        throw new BadRequestException(`Attribute value '${updateAttributeTermDto.name}' already exists.`);
      }

      let newSlug = existingAttributeTerm.slug;
      if (updateAttributeTermDto.name && updateAttributeTermDto.name !== existingAttributeTerm.name) {
        newSlug = await generateSlug(
          updateAttributeTermDto.name,
          this.prisma.productAttributeTerm,
          'slug'
        );
      }

      const attributeTerm = await this.prisma.productAttributeTerm.update({
        where: { id: term_id },
        data: {
          name: updateAttributeTermDto.name,
          slug: newSlug,
          status_id: updateAttributeTermDto.status_id,
        },
      });

      return { attributeTerm };
    } catch (error: any) {
      throw error;
    }
  }

  async findAll(findAttrDto: FindAttributesDto) {
    try {
      let conditions: any[] = [];
      let searchWord = '';

      if (findAttrDto?.search) {
        let str = (findAttrDto?.search).trim();
        searchWord = str;
        conditions.push({
          OR: [
            { name: { contains: searchWord, mode: "insensitive" } },
            { slug: { contains: searchWord, mode: "insensitive" } },
          ]
        });
      }

      if (findAttrDto?.status_id) {
        conditions.push({
          status_id: findAttrDto?.status_id
        });
      }

      let attributes: any;
      if (findAttrDto && findAttrDto?.page && findAttrDto?.rowsPerPage) {
        attributes = await this.prisma.productAttribute.findMany({
          skip: (findAttrDto?.page - 1) * findAttrDto?.rowsPerPage,
          take: findAttrDto?.rowsPerPage,
          where: {
            AND: conditions
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
                },
              }
            },
            created_at: true,
          }
        })
      } else {
        attributes = await this.prisma.productAttribute.findMany({
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
                },
                // created_at: true,
                // updated_at: true
              }
            },
            created_at: true,
            updated_at: true
          }
        })
      }
      const totalCount = await this.prisma.productAttribute.count({
        where: {
          AND: conditions,
        },
      });
      return { Total: totalCount, Attributes: attributes };
    } catch (error) {
      throw new Error(`Failed to find attribute: ${error.message}`);
    }
  }

  async findOne(attribute_id: bigint, findAttrDto: FindAttributesDto) {
    try {

      let conditions: any[] = [];
      let searchWord: string = '';
      if (findAttrDto?.search) {
        let str = (findAttrDto?.search).trim();
        searchWord = str;
        conditions.push({
          OR: [
            { attributeTerms: { some: { name: { contains: searchWord, mode: "insensitive" } } } },
            { attributeTerms: { some: { slug: { contains: searchWord, mode: "insensitive" } } } }
          ]
        });
      }

      if (findAttrDto?.status_id) {
        conditions.push({
          status_id: findAttrDto?.status_id
        });
      }
      let attributes: any;
      if (findAttrDto && findAttrDto?.page && findAttrDto?.rowsPerPage) {
        attributes = await this.prisma.productAttribute.findMany({
          where: {
            id: attribute_id,
            AND: conditions
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
              skip: (findAttrDto?.page - 1) * findAttrDto?.rowsPerPage,
              take: findAttrDto?.rowsPerPage,
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
      }
      else {
        attributes = await this.prisma.productAttribute.findMany({
          where: {
            id: attribute_id,
            AND: conditions
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
                },
                // created_at: true,
                // updated_at: true
              }
            },
            created_at: true,
            updated_at: true
          }
        })
      }
      if (!attributes) {
        throw new BadRequestException("No data found.")
      }
      const totalCount = await this.prisma.productAttributeTerm.count({
        where: {
          attribute_id: attribute_id,
          AND: conditions,
        },
      });
      return { Total: totalCount, Terms: attributes };
    } catch (error) {
      throw error;
    }
  }

  async removeAttribute(attribute_id: bigint) {
    try {
      const find = await this.prisma.productToProductTerm.findFirst({
        where: {
          attribute_id
        }
      })
      if (find) {
        throw new BadRequestException("Unable to delete: This attribute is in use by existing products.")
      }
      const attributes = await this.prisma.productAttribute.delete({
        where: {
          id: attribute_id
        }
      })
      return attributes;
    } catch (error) {
      throw error;
    }
  }

  async removeAttributeTerm(term_id: bigint) {
    try {
      await this.prisma.productToProductTerm.deleteMany({ where: { attribute_term_id: term_id } });
      const attributeTerms = await this.prisma.productAttributeTerm.delete({
        where: {
          id: term_id
        }
      })
      return attributeTerms;
    } catch (error) {
      throw new Error(`Failed to delete attribute term: ${error.message}`);
    }
  }

}
