import { Controller, Get, Post, Body, Patch, Param, Delete, Put, HttpStatus, BadRequestException, Res, Req, UseGuards, Query } from '@nestjs/common';
import { BuyerExploreService } from './buyer-explore.service';
import { CreateBuyerExploreDto } from './dto/create-buyer-explore.dto';
import { UpdateBuyerExploreDto } from './dto/update-buyer-explore.dto';
import { GetBuyerExploreDto } from './dto/get-buyer-explore.dto';
import { ApiResponse } from '@/common/dto/response.dto';
import { Response, Request as ExpressRequest } from 'express';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '@/prisma/prisma.service';
import { JwtGuard } from '@/auth/guard/jwt.guard';
import { GetUser } from '@/auth/decorators/get-user.decorator';
import { GetProductBySubCategoryDto } from './dto/get-product-by-subcategory.dto';


interface AuthenticatedRequest extends ExpressRequest {
  cookies: { [key: string]: string };
}



@Controller({ path: '', version: '1' })
export class BuyerExploreController {
  constructor(private readonly buyerExploreService: BuyerExploreService, private prisma: PrismaService) { }

  @Put('search')
  async search(@Res() res: Response, @Req() req: AuthenticatedRequest, @Body() getBuyerExploreDto: GetBuyerExploreDto) {
    try {
      let userId: bigint | undefined;
      const token = req.cookies?.token?.split(' ')[0];
      if (token) {
        try {
          const payload: any = jwt.verify(token, process.env.JWT_SECRET!);
          const user = await this.prisma.user.findFirst({
            where: { email: payload.email },
            select: { id: true },
          });

          if (user) {
            userId = user.id;
          }
        } catch (err) {
          console.warn('JWT verification failed:', err.message);
        }
      }
      const searchResult = await this.buyerExploreService.search(getBuyerExploreDto, userId);

      let result = JSON.stringify(searchResult, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Searches"));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @Get('/search/popular-searches')
  async getPopularSearches(@Res() res: Response) {
    try {
      const popularSearches = await this.buyerExploreService.getPopularSearches();

      let result = JSON.stringify(popularSearches, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Popular Searches"));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  };

  @Get('/search/relevant-search')
  async getRelevantSearches(@Res() res: Response, @Query('search') search: string) {
    try {
      const relevantsearch = await this.buyerExploreService.getRelevantSearches(search);

      let result = JSON.stringify(relevantsearch, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Relevant Searches."));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  };



  @UseGuards(JwtGuard)
  @Get('/search/recent-searches')
  async getRecentSearches(@Res() res: Response, @GetUser("id") user_id: string) {
    try {
      const recentSearches = await this.buyerExploreService.getRecentSearches(BigInt(user_id));

      let result = JSON.stringify(recentSearches, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Recent Searches"));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }


  @Get("filters")
  async getAllFilters(@Res() res: Response) {
    try {
      const allfiltersDetails = await this.buyerExploreService.getAllFilterDetails();
      let result = JSON.stringify(allfiltersDetails, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "All Filters Details"));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }


  @Get("categories")
  async getAllCategories(@Res() res: Response) {
    try {
      const categories = await this.buyerExploreService.getAllCategories();
      let result = JSON.stringify(categories, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "All Categories"));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }


  @Get("categories/:id")
  async getCategoryById(@Res() res: Response, @Param('id') id: string) {
    try {
      const category = await this.buyerExploreService.getProductByCategoryById(BigInt(id));
      let result = JSON.stringify(category, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Category Details"));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }
  @Get("category/:slug")
  async getMetaByCatgory(@Res() res: Response, @Param('slug') slug: string) {
    try {
      const category = await this.buyerExploreService.getMetaByCatgory(slug);
      let result = JSON.stringify(category, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Category Details"));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @Put("subcategory/:id")
  async getSubCategoryById(@Req() req: AuthenticatedRequest, @Res() res: Response, @Param('id') id: string, @Body() dto: GetProductBySubCategoryDto) {
    try {
      let user_id: bigint | undefined;
      const token = req.cookies?.token?.split(' ')[0];
      if (token) {
        try {
          const payload: any = jwt.verify(token, process.env.JWT_SECRET!);
          const user = await this.prisma.user.findFirst({
            where: { email: payload.email },
            select: { id: true },
          });

          if (user) {
            user_id = user.id;
          }
        } catch (err) {
          console.warn('JWT verification failed:', err.message);
        }
      }
      const subcategory = await this.buyerExploreService.getProdductBySubCategoryById(BigInt(id), dto, user_id,);
      let result = JSON.stringify(subcategory, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Products by sub category."));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

}
