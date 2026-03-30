import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateDynamicPageDto } from './dto/create-dynamic-page.dto';
import { PrismaService } from '@/prisma/prisma.service';
import { createMetaData, generateSlug } from '@/common/helper/common.helper';
import { UpdateDynamicPageDto } from './dto/update-dynamic-page.dto';
import { GetDynamicPageDTO } from './dto/get-dynamic-page.dto';

@Injectable()
export class DynamicPagesService {
  constructor(private readonly prisma: PrismaService) { }

  async create(dto: CreateDynamicPageDto) {
    try {
      const existingPage = await this.prisma.dynamicPage.findFirst({
        where: {
          title: {
            equals: dto.title,
            mode: 'insensitive',
          },
        },
      });
      if (existingPage) {
        throw new BadRequestException(`Page '${dto.title}' already exists`);
      }

      const pageSlug = await generateSlug(
        dto.title,
        this.prisma.dynamicPage,
        'slug'
      );


      // 2. Ensure uniqueness (append number if duplicate)
      let slug = pageSlug;
      let counter = 1;

      while (await this.prisma.dynamicPage.findUnique({ where: { slug } })) {
        slug = `${pageSlug}-${counter++}`;
      }

      // 3. Create the page
      const newPage = await this.prisma.dynamicPage.create({
        data: {
          title: dto.title,
          slug,
          description: dto.description || "",
          isActive: dto.isActive ?? true,
        },
      });

      if (newPage) {
        let metaDetails = {
          meta_title: dto?.meta_title,
          meta_description: dto?.meta_description,
          meta_keyword: dto?.meta_keyword,
          other_meta: dto.other_meta
        }
        await createMetaData(
          newPage.id,
          "page",
          "_page_meta",
          JSON.stringify(metaDetails)
        )
      }

      return {
        message: "Dynamic page created successfully",
        data: newPage,
      };
    } catch (error) {
      throw new BadRequestException(error.message || "Failed to create dynamic page");
    }
  };
  async getAllDynamicPages(dto: GetDynamicPageDTO) {
    try {
      const { page = 1, rowsPerPage = 10, search } = dto;

      // Search filter (title or description)
      const searchFilter: any = search
        ? {
          OR: [
            { title: { contains: search.trim(), mode: "insensitive" } },
            { description: { contains: search.trim(), mode: "insensitive" } },
          ],
        }
        : {};

      // Run in a transaction for efficiency (get data + total count together)
      const [pages, totalCount] = await this.prisma.$transaction([
        this.prisma.dynamicPage.findMany({
          where: searchFilter,
          skip: (page - 1) * rowsPerPage,
          take: rowsPerPage,
          orderBy: { created_at: "desc" }, // default sorting by newest
        }),
        this.prisma.dynamicPage.count({
          where: searchFilter,
        }),
      ]);

      return {
        total: totalCount,
        page,
        rowsPerPage,
        data: pages,
      };
    } catch (error) {
      throw new BadRequestException(error.message || "Failed to get dynamic pages");
    }
  }



  async getDynamicPage(slug: string) {
    try {
      const dynamicPage = await this.prisma.dynamicPage.findUnique({
        where: { slug, isActive: true }
      });

      const meta = await this.prisma.metaData.findFirst({
        where: {
          table_id: dynamicPage?.id,
          table_name: "page",
          key: "_page_meta",
        }
      });

      (dynamicPage as any).meta_data = meta?.value ? JSON.parse(meta?.value) : ""

      const inFooter = await this.prisma.menu.findFirst({
        where: {
          menu_item_type: "page",
          menu_item_id: dynamicPage?.id,
        },
        select: {
          id: true,
          menu_type_id: true,
        }
      })
      if (!dynamicPage) {
        throw new BadRequestException(`Page '${slug}' not found`);
      }
      (dynamicPage as any).isInFooter = !!inFooter;
      (dynamicPage as any).menu_id = inFooter?.id;
      (dynamicPage as any).menu_type_id = inFooter?.menu_type_id;
      return dynamicPage;
    } catch (error) {
      throw new BadRequestException(error.message || "Failed to get dynamic page");
    }
  };



  async updateDynamicPage(id: bigint, dto: UpdateDynamicPageDto) {
    try {
      // 1. Find the existing page
      const existingPage = await this.prisma.dynamicPage.findUnique({
        where: { id },
      });

      if (!existingPage) {
        throw new BadRequestException(`Page with id '${id}' not found`);
      }

      // 2. Handle slug regeneration if title is updated
      let slug = existingPage.slug;
      if (dto.title && dto.title !== existingPage.title) {
        const pageSlug = await generateSlug(
          dto.title,
          this.prisma.dynamicPage,
          'slug'
        );

        slug = pageSlug;
        let counter = 1;

        while (
          await this.prisma.dynamicPage.findUnique({
            where: { slug },
          })
        ) {
          slug = `${pageSlug}-${counter++}`;
        }
      }

      // 3. Update page
      const updatedPage = await this.prisma.dynamicPage.update({
        where: { id },
        data: {
          title: dto.title ?? existingPage.title,
          slug,
          description: dto.description ?? existingPage.description,
          isActive: dto.isActive ?? existingPage.isActive,
        },
      });
      let up: any
      if (existingPage.isActive === true) {
        up = await this.prisma.menu.updateMany({
          where: {
            menu_item_id: id
          },
          data: {
            status_id: 2
          }
        })
      } else if (existingPage.isActive === false) {
        up = await this.prisma.menu.updateMany({
          where: {
            menu_item_id: id
          },
          data: {
            status_id: 1
          }
        })
      }
      console.log("up", up);
      console.log("id", id);



      // ----------- META DATA HANDLING -----------
      if (updatedPage) {
        let isPageAvailable = await this.prisma.metaData.findFirst({
          where: {
            table_id: updatedPage?.id,
            table_name: 'page',
            key: '_page_meta'
          }
        });
        let metaDetails = {
          meta_title: dto?.meta_title,
          meta_description: dto?.meta_description,
          meta_keyword: dto?.meta_keyword,
          other_meta: dto.other_meta
        }
        if (isPageAvailable) {
          await this.prisma.metaData.update({
            where: {
              id: isPageAvailable?.id
            },
            data: {
              table_id: updatedPage.id,
              table_name: "page",
              key: "_page_meta",
              value: JSON.stringify(metaDetails)
            }
          });
        } else {
          await createMetaData(
            updatedPage.id,
            "page",
            "_page_meta",
            JSON.stringify(metaDetails)
          )
        }
      }

      return {
        message: 'Dynamic page updated successfully',
        data: updatedPage,
      };
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to update dynamic page');
    }
  }

  async removeDynamicPage(id: bigint) {
    try {
      const dynamicPage = await this.prisma.dynamicPage.delete({ where: { id } });
      await this.prisma.menu.deleteMany({
        where: {
          menu_item_id: id
        }
      })
      return dynamicPage;
    } catch (error) {
      throw new BadRequestException(error.message || "Failed to remove dynamic page");
    }
  };

}
