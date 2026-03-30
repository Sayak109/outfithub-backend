import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateCartDto } from './dto/create-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';
import { PrismaService } from '@/prisma/prisma.service';
import { Decimal } from '@generated/prisma/runtime/library';
import { ProductService } from '../product/product.service';
import { CartHoldingDto } from './dto/cart-holding.dto';
import { CheckoutDto } from '../order/dto/checkout.dto';
import { createNotification } from '@/common/helper/common.helper';

@Injectable()
export class CartService {
  constructor(
    private prisma: PrismaService,
    private readonly productService: ProductService,
  ) { }
  async create(customer_id: bigint, createCartDto: CreateCartDto) {
    try {
      const { product_id, quantity, attribute_term_ids } = createCartDto;
      if (quantity > 10) {
        throw new BadRequestException("You can only add up to 10 units of this product.");
      }
      await this.prisma.wishList.deleteMany({
        where: {
          product_id: createCartDto.product_id,
          user_id: customer_id,
          list_type: {
            in: ["SAVEFORLATER", "RECENTLYVIEWEDPRODUCTS"]
          }
        }
      });

      const product: any = await this.productService.productDetials(BigInt(createCartDto.product_id));

      if (!product || product.length === 0) {
        throw new BadRequestException("Product not available");
      }

      const requestedTermIds = createCartDto.attribute_term_ids || [];
      const attributeTermsMap = new Map<string, number[]>();

      product.attributes.forEach((attr: any) => {
        if (!attr.terms || !Array.isArray(attr.terms)) return;
        const termIds = attr.terms.map((term: any) => Number(term.id));
        attributeTermsMap.set(attr.id, termIds);
      });

      const usedAttributes = new Set<string>();
      let isValid = true;
      for (const termId of requestedTermIds) {
        const attributeId = Array.from(attributeTermsMap.entries()).find(([attrId, termIds]) =>
          termIds.includes(termId)
        )?.[0];
        if (!attributeId) {
          isValid = false;
          break;
        }
        if (usedAttributes.has(attributeId)) {
          isValid = false;
          break;
        }
        usedAttributes.add(attributeId);
      }

      if (!isValid) {
        throw new BadRequestException("Product not available");
      }

      const existingCarts = await this.prisma.cart.findMany({
        where: {
          product_id: product_id,
          customer_id: customer_id,
        },
        include: {
          cartAttributes: true,
        },
      });

      let matchedCart = existingCarts.find(cart => {
        const existingAttrIds = cart.cartAttributes.map(attr => Number(attr.attribute_term_id)).sort();
        const inputAttrIds = [...attribute_term_ids].sort();
        return JSON.stringify(existingAttrIds) === JSON.stringify(inputAttrIds);
      });

      let cart: any = "";
      if (matchedCart) {
        const newQuantity = matchedCart.quantity + quantity;
        if (newQuantity > 10) {
          throw new BadRequestException("You can only add up to 10 units of this product.");
        }

        if (product.stock_quantity >= newQuantity) {
          cart = await this.prisma.cart.update({
            where: { id: matchedCart.id },
            data: {
              quantity: newQuantity
            }
          });
        } else {
          throw new BadRequestException("No more stocks.")
        }
      } else {
        if (product.stock_quantity >= quantity) {
          cart = await this.prisma.cart.create({
            data: {
              product_id,
              customer_id,
              quantity,
              cartAttributes: {
                create: attribute_term_ids.map(attrId => ({
                  attribute_term_id: attrId
                }))
              }
            },
            include: {
              cartAttributes: true
            }
          });
        } else {
          throw new BadRequestException("No more stocks.")
        }
      }

      return cart;
    } catch (error) {
      throw error;
    }
  }

  async cartHolding(customer_id: bigint, dto: CartHoldingDto) {
    try {
      const holdItems: string[] = [];
      const unavailableProductIds: bigint[] = [];
      let response: any = null;

      const existingHolding = await this.prisma.cartHoldingItems.count({
        where: { user_id: customer_id }
      });

      const getHoldingRecord = async () => {
        const prismaExtended = this.prisma.$extends({
          result: {
            cartHoldingItems: {
              items: {
                needs: { items: true },
                compute(src) {
                  return JSON.parse(src?.items);
                }
              }
            }
          }
        });

        return prismaExtended.cartHoldingItems.findUnique({
          where: { user_id: customer_id },
          select: { items: true, created_at: true, expired_at: true }
        });
      };

      const restoreStockFromHolding = async (holdingItems: string[]) => {
        const quantityMap = new Map<number, number>();

        for (const itemStr of holdingItems) {
          const item = JSON.parse(itemStr);
          if (!item?.product_id || !item?.quantity) continue;

          const productId = Number(item.product_id);
          const quantity = Number(item.quantity);

          quantityMap.set(productId, (quantityMap.get(productId) || 0) + quantity);
        }

        await Promise.all(
          Array.from(quantityMap.entries()).map(async ([productId, totalQuantity]) => {
            const product = await this.prisma.product.findUnique({
              where: { id: productId },
              select: { id: true, stock_quantity: true }
            });

            if (product) {
              await this.prisma.product.update({
                where: { id: productId },
                data: {
                  stock_quantity: (product.stock_quantity ?? 0) + totalQuantity,
                  out_of_stock: ((product.stock_quantity ?? 0) + totalQuantity) > 0 ? false : true
                }
              });
            }
          })
        );
      };

      if (dto?.type === "HOLD") {
        let createNew = !existingHolding;

        if (existingHolding) {
          const holdingRecord = await getHoldingRecord();
          if (holdingRecord?.items) {
            await restoreStockFromHolding(holdingRecord.items);
          }

          await this.prisma.cartHoldingItems.delete({
            where: { user_id: customer_id }
          });
          createNew = true;
        }

        if (createNew) {
          const cartItems = await this.prisma.cart.findMany({
            where: { customer_id },
            select: {
              quantity: true, product_id: true, cartAttributes: {
                select: { attribute_term_id: true }
              }
            }
          });

          const productQuantities = cartItems.reduce((acc, item) => {
            const pid = item.product_id.toString();
            acc[pid] = (acc[pid] || 0) + item.quantity;
            return acc;
          }, {} as Record<string, number>);

          for (const productIdStr in productQuantities) {
            const totalQuantity = productQuantities[productIdStr];
            const productIdBigInt = BigInt(productIdStr);

            const product = await this.prisma.product.findUnique({
              where: { id: productIdBigInt },
              select: { id: true, stock_quantity: true }
            });

            const itemsForProduct = cartItems.filter(item => item.product_id.toString() === productIdStr);
            const serializedItems = itemsForProduct.map(item =>
              JSON.stringify(item, (_k, val) => (typeof val === "bigint" ? val.toString() : val))
            );

            if (product) {
              if (product.stock_quantity !== null && product.stock_quantity >= totalQuantity) {
                const update = await this.prisma.product.update({
                  where: { id: product.id },
                  data: {
                    stock_quantity: product.stock_quantity - totalQuantity,
                    out_of_stock: (product.stock_quantity - totalQuantity) === 0 ? true : false
                  }
                });
                holdItems.push(...serializedItems);

                if (update.stock_quantity === 0) {
                  const haveInappPreferance = await this.prisma.notificationPreference.count({
                    where: {
                      user_id: update.seller_id,
                      preference_category_id: 5
                    }
                  })
                  if (haveInappPreferance) {
                    await createNotification(
                      update.seller_id,
                      "STOCK_STATUS",
                      "Stock Update",
                      `Your product "${update.name}" is now out of stock. Please restock it to continue receiving orders.`,
                      {
                        product_id: update.id,
                        seller_id: update.seller_id,
                      },
                    );
                  }
                }
              } else {
                unavailableProductIds.push(productIdBigInt);
              }
            } else {
              holdItems.push(...serializedItems);
            }
          }

          let product = await this.prisma.product.findMany({
            where: {
              id: {
                in: unavailableProductIds
              }
            },
            select: {
              id: true,
              name: true,
              mrp: true,
              sku: true,
              stock_quantity: true
            }
          });
          const now = new Date();
          const expireAt = new Date(now.getTime() + 10 * 60 * 1000);
          if (holdItems.length > 0) {
            await this.prisma.cartHoldingItems.create({
              data: {
                items: JSON.stringify(holdItems),
                unavailable_product_ids: unavailableProductIds,
                user_id: customer_id,
                created_at: now,
                expired_at: expireAt
              }
            });
          }

          response = {
            type: dto.type,
            created_at: now,
            expired_at: expireAt,
            unavailable_products: product
          };
        }
      }

      if (dto.type === "ROLLBACK") {
        if (!existingHolding) return false;
        if (existingHolding) {
          const holdingRecord = await getHoldingRecord();
          if (holdingRecord?.items) {
            await restoreStockFromHolding(holdingRecord.items);
          }

          await this.prisma.cartHoldingItems.delete({
            where: { user_id: customer_id }
          });
        }

        response = {
          type: dto.type,
          unavailable_products: []
        };
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  async findAll(customer_id: bigint, dto: CheckoutDto) {
    try {
      const prisma1 = await this.prisma.$extends({
        result: {
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
          productCategory: {
            image: {
              needs: { id: true, image: true },
              compute(image) {
                if (image.image != null && image.image != '' && image.image != undefined) {
                  return `${process.env.BASE_PATH}/${process.env.IMAGE_PATH}/${process.env.PRODUCT_CATEGORY_IMAGE_PATH}/${image.id}/${image.image}`
                } else {
                  return ""
                }
              },
            },
          }
        },
      })

      const cart = await prisma1.cart.findMany({
        where: { customer_id },
        orderBy: {
          id: 'desc'
        },
        include: {
          cartAttributes: {
            select: {
              attributeTerm: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  attributes: {
                    select: {
                      id: true,
                      name: true,
                      slug: true,
                    }
                  }
                }
              }
            },
          },
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              description: true,
              sku: true,
              mrp: true,
              sales_price: true,
              shipping: true,
              tax: true,
              stock_quantity: true,
              average_rating: true,
              new_collection: true,
              out_of_stock: true,
              status: {
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
              images: {
                select: {
                  id: true,
                  name: true,
                  src: true,
                  alt: true,
                  main_image: true
                }
              },
              categories: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  description: true,
                  image: true
                }
              },
              attributes: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                }
              },
              seller: {
                select: {
                  id: true,
                  first_name: true,
                  last_name: true,
                  email: true
                }
              }
            }
          }
        }
      });
      const cartItems: any[] = [];
      let total_shipping = new Decimal(0);
      let total_tax = new Decimal(0);
      let total = new Decimal(0);
      let net_total = new Decimal(0);
      let coupon_discount_amount = new Decimal(0);
      let ord_qty = 0;
      for (const item of cart) {
        if (item && item?.product.attributes) {
          let attributes = await Promise.all(item!.product.attributes.map(async (attr: any, j: any) => {
            let options = await this.prisma.productToProductTerm.findMany({
              where: {
                product_id: item.product_id,
                attribute_id: attr.id
              },
              select: {
                attributeTerms: {
                  select: {
                    id: true,
                    name: true,
                    slug: true
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
          item!.product.attributes = attributes;
        }
        const qty = item.quantity
        const mrp = new Decimal(item.product.mrp).mul(qty);
        const shipping = item.product.shipping ? new Decimal(item.product.shipping).mul(qty) : new Decimal(0);
        const taxRate = Decimal(item.product.tax || 0);

        const total_price = (mrp.plus(shipping)).toDecimalPlaces(2);
        // const total_price = (mrp).toDecimalPlaces(2);
        const unitPrice = mrp.div((taxRate).div(100).add(1));
        const tax_amount = (mrp.minus(unitPrice)).toDecimalPlaces(2);
        const price_without_tax = (mrp.minus(tax_amount)).toDecimalPlaces(2);

        cartItems.push({
          ...item,
          price: mrp,
          taxRate: `${taxRate}%`,
          price_without_tax: price_without_tax.toDecimalPlaces(2),
          tax_amount: tax_amount.toDecimalPlaces(2),
          shipping_charge: shipping,
          total_price: total_price.toDecimalPlaces(2),
        });
        ord_qty += 1;
        total_shipping = total_shipping.plus(shipping)
        total_tax = total_tax.plus(tax_amount)
        total = total.plus(mrp)
      }

      if (dto && dto.coupon_id) {
        const coupon = await this.getCouponData(dto.coupon_id);
        if (coupon) {
          const isExpired = !coupon.expire_at || coupon.expire_at < new Date();
          const isInactive = coupon.status.title === "inactive";

          if (isExpired || isInactive) {
            throw new BadRequestException("Coupon is expired or invalid.");
          }

          const minOrderValue = new Decimal(coupon.min_order_value ?? 0);
          const cartTotal = total;

          if (!cartTotal.eq(0) && cartTotal.lt(minOrderValue)) {
            throw new BadRequestException(`This Promo Code requires a minimum order value of ₹${minOrderValue.toFixed(2)}.`);
          }
          if (coupon.type === 'percentage') {
            const discountPercentage = coupon.amount;
            coupon_discount_amount = total.mul(discountPercentage / 100).toDecimalPlaces(2);
          } else {
            coupon_discount_amount = new Decimal(coupon.amount);
          }
        }
      }
      net_total = total;
      total = (total.minus(coupon_discount_amount).plus(total_shipping)).toDecimalPlaces(2)

      return {
        cartItems,
        order_qty: ord_qty,
        total_amount: net_total,
        total_tax,
        coupon_discount: coupon_discount_amount,
        discounted_amount: net_total.minus(coupon_discount_amount),
        total_shipping,
        cart_total: total
      };
    } catch (error) {
      throw error
    }
  }

  async getCouponData(code_id?: number) {
    if (!code_id) return null;
    const coupon = await this.prisma.coupon.findUnique({
      where: { id: code_id },
      select: {
        code: true,
        amount: true,
        type: true,
        min_order_value: true,
        status: { select: { title: true } },
        expire_at: true
      }
    });
    return coupon;
  }

  async coupons() {
    try {
      const coupon = await this.prisma.coupon.findMany({
        where: {
          status_id: 1,
          expire_at: {
            gt: new Date()
          },
        },
        select: {
          id: true,
          code: true,
          desc: true,
          amount: true,
          type: true,
          min_order_value: true,
          status: {
            select:
            {
              id: true,
              title: true
            }
          },
          expire_at: true
        }
      });
      return coupon;
    } catch (error) {
      throw error
    }
  }


  async update(cart_id: bigint, user_id: bigint, updateCartDto: UpdateCartDto) {
    try {
      const existingCart = await this.prisma.cart.findUnique({
        where: { id: cart_id },
        include: {
          cartAttributes: true,
          product: {
            include: {
              attributes: {
                include: {
                  attributeTerms: true
                }
              }
            }
          }
        }
      });

      if (!existingCart || existingCart.customer_id !== user_id) {
        throw new BadRequestException('Cart not found.');
      }

      const product = existingCart.product;
      const attributeTermsMap = new Map<string, number[]>();
      product.attributes.forEach((attr: any) => {
        if (!attr.attributeTerms || !Array.isArray(attr.attributeTerms)) return;
        const termIds = attr.attributeTerms.map((term: any) => Number(term.id));
        attributeTermsMap.set(attr.id, termIds);
      });

      const requestedTermIds = updateCartDto.attribute_term_ids || [];
      const usedAttributes = new Set<string>();
      let isValid = true;

      for (const termId of requestedTermIds) {
        const attributeId = Array.from(attributeTermsMap.entries()).find(([attrId, termIds]) =>
          termIds.includes(termId)
        )?.[0];

        if (!attributeId) {
          isValid = false;
          break;
        }
        if (usedAttributes.has(attributeId)) {
          isValid = false;
          break;
        }
        usedAttributes.add(attributeId);
      }

      if (!isValid) {
        throw new BadRequestException("Product not available");
      }

      let updatedQuantity = existingCart.quantity;

      if (
        typeof updateCartDto.increase === 'boolean' &&
        typeof updateCartDto.quantity === 'number'
      ) {
        // if (updateCartDto.increase) {
        //   const newQuantity = existingCart.quantity + updateCartDto.quantity;
        //   if (product?.stock_quantity && product?.stock_quantity >= newQuantity) {
        //     updatedQuantity = newQuantity
        //   } else {
        //     throw new BadRequestException("No more stocks.")
        //   }
        // }
        if (updateCartDto.increase) {
          const newQuantity = existingCart.quantity + updateCartDto.quantity;
          if (!product?.stock_quantity || product.stock_quantity < newQuantity) {
            throw new BadRequestException("No more stocks.");
          }
          if (newQuantity > 10) {
            throw new BadRequestException("You can only add up to 10 units of this product.");
          }
          updatedQuantity = newQuantity;
        }
        else {
          updatedQuantity = existingCart.quantity - updateCartDto.quantity;
        }
      }

      if (updatedQuantity <= 0) {
        await this.prisma.cartAttributeTerm.deleteMany({
          where: { cart_id }
        });
        await this.prisma.cart.delete({
          where: { id: cart_id }
        });
        return { message: 'Cart item removed' };
      }
      const updatedCart = await this.prisma.cart.update({
        where: { id: cart_id },
        data: {
          quantity: updatedQuantity
        }
      });

      if (
        Array.isArray(updateCartDto.attribute_term_ids) &&
        updateCartDto.attribute_term_ids.length > 0
      ) {
        await this.prisma.cartAttributeTerm.deleteMany({
          where: { cart_id }
        });

        const newTerms = updateCartDto.attribute_term_ids.map((termId) => ({
          cart_id,
          attribute_term_id: BigInt(termId)
        }));

        await this.prisma.cartAttributeTerm.createMany({
          data: newTerms
        });
      }

      return updatedCart;
    } catch (error) {
      throw error;
    }
  }

  async remove(cart_id: bigint) {
    try {
      const existingCart = await this.prisma.cart.findUnique({
        where: { id: cart_id },
      });

      if (!existingCart) {
        throw new BadRequestException("No record found")
      }

      await this.prisma.cartAttributeTerm.deleteMany({
        where: { cart_id }
      });
      const cart = await this.prisma.cart.delete({
        where: { id: cart_id }
      });

      return null;
    } catch (error) {
      throw error
    }
  }
}
