import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { CreateMenuTypeDto } from './dto/create-menutype.dto';
import { PrismaService } from '@/prisma/prisma.service';
import { generateSlug } from '@/common/helper/common.helper';
import { GetAllMenuTypeDto } from './dto/get-all-menu-type.dto';
import { UpdateMenuTypeDto } from './dto/update-menutype.dto';

@Injectable()
export class MenuService {
  constructor(
    private prisma: PrismaService,
  ) { }
  async create(createMenuDto: CreateMenuDto) {
    try {
      const lastRank = await this.prisma.menu.findFirst({
        where: {
          menu_type_id: createMenuDto.menu_type_id
        },
        orderBy: {
          id: "desc"
        },
        select: {
          display_rank: true,
        }
      })
      const rank = Number(lastRank?.display_rank ?? 0) + 1;

      const menu = await this.prisma.menu.create({
        data: {
          menu_type_id: createMenuDto.menu_type_id,
          menu_item_id: createMenuDto.menu_item_id,
          menu_item_type: createMenuDto.menu_item_type,
          path: createMenuDto.path,
          display_rank: rank
        }
      })
      return menu;
    } catch (error) {
      throw error;
    }
  }

  async findAll() {
    try {
      const menus = await this.prisma.menuType.findMany({
        where: {
          parent_menu_type: null
        },
        orderBy: {
          id: 'asc'
        },
        select: {
          id: true,
          name: true,
          slug: true,
          menu: {
            where: {
              status_id: 1,
            },
            orderBy: {
              display_rank: "asc"
            },
            select: {
              id: true,
              menu_item_id: true,
              menu_item_type: true,
              display_rank: true,
              path: true,
            }
          },
          sub_menu_types: {
            orderBy: {
              id: 'asc'
            },
            select: {
              id: true,
              name: true,
              slug: true,
              menu: {
                where: {
                  status_id: 1,
                },
                orderBy: {
                  display_rank: "asc"
                },
                select: {
                  id: true,
                  menu_item_id: true,
                  menu_item_type: true,
                  display_rank: true,
                  path: true,
                }
              }
            }
          },
        }
      });
      return menus;
    } catch (error) {
      throw error
    }
  }

  async createMenuType(createMenuTypeDto: CreateMenuTypeDto) {
    try {
      const categorySlug = await generateSlug(
        createMenuTypeDto.name,
        this.prisma.menuType,
        'slug'
      );
      let parent_menu_type: bigint | null = null;
      if (createMenuTypeDto.parent_id !== undefined && createMenuTypeDto.parent_id !== null) {
        parent_menu_type = BigInt(createMenuTypeDto.parent_id);
        const existingSub = await this.prisma.menuType.findFirst({
          where: {
            name: createMenuTypeDto.name,
            parent_menu_type: parent_menu_type,
          },
        });
        if (existingSub) {
          throw new BadRequestException(`Submenu type with name "${createMenuTypeDto.name}" already exists.`);
        }
      }
      else {
        const existingParent = await this.prisma.menuType.findFirst({
          where: {
            name: createMenuTypeDto.name,
            parent_menu_type: null,
          },
        });

        if (existingParent) {
          throw new BadRequestException(`Menu type with name "${createMenuTypeDto.name}" already exists.`);
        }
      }
      const menuType = await this.prisma.menuType.create({
        data: {
          name: createMenuTypeDto.name,
          slug: categorySlug,
          parent_menu_type: parent_menu_type,
        },
      });
      return menuType;
    }
    catch (error) {
      throw error;
    }
  }

  async findAllMenuType(getAllMenuTypeDto: GetAllMenuTypeDto) {
    try {
      let conditions: any[] = [];
      let searchWord = '';

      if (getAllMenuTypeDto?.search) {
        let str = (getAllMenuTypeDto?.search).trim();
        searchWord = str;
        conditions.push({
          OR: [
            { name: { contains: searchWord, mode: "insensitive" } },
          ]
        });
      }
      if (getAllMenuTypeDto?.parent) {
        conditions.push({
          parent_menu_type: null
        });
      }


      let menuType: any;
      if (getAllMenuTypeDto && getAllMenuTypeDto?.page && getAllMenuTypeDto?.rowsPerPage) {
        menuType = await this.prisma.menuType.findMany({
          skip: (getAllMenuTypeDto?.page - 1) * getAllMenuTypeDto?.rowsPerPage,
          take: getAllMenuTypeDto?.rowsPerPage,
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
            sub_menu_types: {
              orderBy: {
                id: 'desc'
              },
              select: {
                id: true,
                name: true,
                slug: true,
                parent_menu_type: true,
              }
            },
          }
        });
      } else {
        menuType = await this.prisma.menuType.findMany({
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
            sub_menu_types: {
              orderBy: {
                id: 'desc'
              },
              select: {
                id: true,
                name: true,
                slug: true,
                parent_menu_type: true,
              }
            },
          }
        });
      }
      const totalCount = await this.prisma.menuType.count({
        where: {
          AND: conditions,
        },
      });

      return { Total: totalCount, MenuTypes: menuType };
    } catch (error) {
      throw error;
    }
  }

  async findOneMenuType(menu_type_id: bigint) {
    try {
      const menuType = await this.prisma.menuType.findUnique({
        where: {
          id: menu_type_id
        },
        select: {
          id: true,
          name: true,
          slug: true,
          sub_menu_types: {
            orderBy: {
              id: 'desc'
            },
            select: {
              id: true,
              name: true,
              slug: true,
              parent_menu_type: true,
            }
          },
        }
      });
      return menuType;
    } catch (error) {
      throw error;
    }
  }

  async findOneMenuTypeBySlug(menu_type: string) {
    try {
      const menuType = await this.prisma.menuType.findUnique({
        where: {
          slug: menu_type
        },
        select: {
          id: true,
          name: true,
          slug: true,
          sub_menu_types: {
            orderBy: {
              id: 'desc'
            },
            select: {
              id: true,
              name: true,
              slug: true,
              parent_menu_type: true,
            }
          },
        }
      });
      return menuType;
    } catch (error) {
      throw error;
    }
  }

  async update(updateMenuTypeDto: UpdateMenuDto, menu_id?: bigint) {
    try {
      const lastRank = await this.prisma.menu.findFirst({
        where: {
          menu_type_id: updateMenuTypeDto.menu_type_id
        },
        orderBy: {
          id: "desc"
        },
        select: {
          display_rank: true,
        }
      })
      const rank = Number(lastRank?.display_rank ?? 0) + 1;
      if (menu_id) {
        const menu = await this.prisma.menu.update({
          where: {
            id: menu_id
          },
          data: {
            menu_type_id: updateMenuTypeDto.menu_type_id,
            menu_item_id: updateMenuTypeDto.menu_item_id,
            menu_item_type: updateMenuTypeDto.menu_item_type,
            path: updateMenuTypeDto.path,
            display_rank: rank
          }
        })
        return menu
      } else {
        const menu = await this.prisma.menu.create({
          data: {
            menu_type_id: updateMenuTypeDto?.menu_type_id!,
            menu_item_id: updateMenuTypeDto?.menu_item_id!,
            menu_item_type: updateMenuTypeDto?.menu_item_type || "",
            path: updateMenuTypeDto?.path || "",
            display_rank: rank
          }
        })
        return menu
      }
    } catch (error) {
      throw error;
    }
  }

  async remove(menu_id: bigint) {
    try {
      const delMenu = await this.prisma.menu.delete({
        where: {
          id: menu_id
        }
      })
      return delMenu;
    } catch (error) {
      throw error;
    }
  }


  async updateType(menu_type_id: bigint, updateMenuTypeDto: UpdateMenuTypeDto) {
    try {
      const existingCategory = await this.prisma.menuType.findUnique({
        where: { id: menu_type_id },
      });

      if (
        updateMenuTypeDto.name &&
        updateMenuTypeDto.name.toLowerCase() !== existingCategory?.name.toLowerCase()
      ) {
        if (existingCategory?.parent_menu_type === null) {
          const duplicateParent = await this.prisma.menuType.findFirst({
            where: {
              name: updateMenuTypeDto.name,
              parent_menu_type: null,
              NOT: { id: menu_type_id },
            },
          });

          if (duplicateParent) {
            throw new BadRequestException(
              `Menu with name "${updateMenuTypeDto.name}" already exists.`
            );
          }
        } else {
          const duplicateSub = await this.prisma.menuType.findFirst({
            where: {
              name: updateMenuTypeDto.name,
              parent_menu_type: existingCategory?.parent_menu_type,
              NOT: { id: menu_type_id },
            },
          });

          if (duplicateSub) {
            throw new BadRequestException(
              `Category with name "${updateMenuTypeDto.name}" already exists.`
            );
          }
        }
      }

      let newSlug = existingCategory?.slug;
      if (updateMenuTypeDto.name && updateMenuTypeDto.name !== existingCategory?.name) {
        newSlug = await generateSlug(
          updateMenuTypeDto.name,
          this.prisma.menuType,
          'slug'
        );
      }
      const updateData: any = {};

      if (updateMenuTypeDto.name !== undefined) {
        updateData.name = updateMenuTypeDto.name;
      }

      const menuType = await this.prisma.menuType.update({
        where: { id: menu_type_id },
        data: updateData,
      });
      return menuType
    } catch (error) {
      throw error;
    }
  }


  async removeType(menu_type_id: bigint) {
    try {
      const menuType = await this.prisma.menuType.delete({
        where: { id: menu_type_id },
      });
      return menuType
    } catch (error) {
      throw error;
    }
  }
}
