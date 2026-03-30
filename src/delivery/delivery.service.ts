import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { UpdateDeliveryDto } from './dto/update-delivery.dto';
import { PrismaService } from '@/prisma/prisma.service';
import axios from 'axios';
import * as jwt from 'jsonwebtoken';
import { CreateShipRocketOrderDto } from './dto/create-shiprocket-order.dto';
import { createNotification } from '@/common/helper/common.helper';
import { MailService } from '@/mail/mail.service';
import { OrderService } from '@/customer/order/order.service';

@Injectable()
export class DeliveryService {

  private token: string;

  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
    private orderService: OrderService,
  ) { }

  async login() {
    try {
      const deliverySettring: any = await this.prisma.adminSettings.findFirst({
        where: {
          title: "delivery-settings"
        },
        select: {
          metadata: true
        }
      });
      if (!deliverySettring) {
        throw new BadRequestException("Delivery Settings required.")
      }

      const res = await axios.post("https://apiv2.shiprocket.in/v1/external/auth/login", {
        email: deliverySettring?.metadata?.shipRocketEmail,
        password: deliverySettring.metadata.shipRocketPassword
      });
      this.token = res.data.token;
      const decoded: any = jwt.decode(res.data.token);

      // const existingToken = await this.prisma.shiprocketToken.findFirst();
      // if (existingToken) {
      //   // Update existing token
      //   await this.prisma.shiprocketToken.update({
      //     where: { id: existingToken.id }, // Assuming 'id' is the primary key
      //     data: {
      //       token: this.token,
      //       expire_at: decoded.exp
      //     }
      //   });
      // } else {
      //   // Create a new token entry
      //   await this.prisma.shiprocketToken.create({
      //     data: {
      //       token: this.token,
      //       expire_at: decoded.exp
      //     }
      //   });
      // }
      return this.token;
    } catch (error) {
      throw error
    }
  }

  async getToken() {
    const existingToken: any = await this.prisma.shiprocketToken.findFirst();
    if (!existingToken || (Number(existingToken.expire_at) * 1000) <= Date.now()) {
      await this.login();
    } else {
      this.token = existingToken.token;
    }
    return this.token;
  }


  async createSellerPickupLocationService(userId: bigint) {
    const token = await this.login();
    const user: any = await this.prisma.user.findUnique({
      where: {
        id: userId
      },
      select: {
        first_name: true,
        last_name: true,
        email: true,
        phone_no: true
      }
    })
    const sellerAddress: any = await this.prisma.sellerProfile.findUnique({
      where: {
        user_id: userId
      },
      select: {
        address1: true,
        city: true,
        state: true,
        pincode: true,
        country: true,
      }
    });

    try {
      if (token && user && sellerAddress) {

        const shiprocketPickupLoationRes = await axios.post(`https://apiv2.shiprocket.in/v1/external/settings/company/addpickup`, {
          "pickup_location": sellerAddress.address1?.substring(0, 10),
          "name": user.first_name + " " + user.last_name,
          "email": user.email,
          // "phone": pickLocationDto.phone,
          "phone": +(user.phone_no),
          "address": sellerAddress.address1,
          // "address_2": sellerAddress.address1,
          "city": sellerAddress.city,
          "state": sellerAddress.state,
          "country": "India",
          "pin_code": sellerAddress.pincode
        }, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (shiprocketPickupLoationRes?.data?.success) {
          const res = await this.prisma.pickupLocation.create({
            data: {
              sellerId: userId,
              address: sellerAddress.address1,
              city: sellerAddress.city,
              state: sellerAddress.state,
              pin_code: sellerAddress.pincode,
              country: "India",
              // address_2: sellerAddress.address_2,
              shiprocketCode: +(shiprocketPickupLoationRes?.data?.pickup_id),
              pickup_location: sellerAddress.address1?.substring(0, 10)
            }
          })
          return { success: true, res };
        }
      }
    } catch (error: any) {
      // return JSON.parse(error?.response?.data?.message)
      return

      // throw new BadRequestException(JSON.parse(error?.response?.data?.message));
    }
  }


  async createShiprocketOrder(userId: any, orderCreateDto: CreateShipRocketOrderDto) {

    // const pickupResponse = await this.createSellerPickupLocationService(userId);
    const token = await this.login();
    // if (pickupResponse?.pickup_location?.[0] === "Address name already exists and is inactive. Kindly activate it or kindly select a different address name to proceed ahead.") {

    // }
    // return
    console.log("token", token);

    const sellerPickAddressFromPayload = await this.prisma.pickupLocation.findFirst({
      where: {
        pickup_location: orderCreateDto.pickuplocation
      }
    })

    if (!sellerPickAddressFromPayload) {
      throw new BadRequestException("No pickup location found.")
    }

    const sellerPickupAddress = await this.prisma.pickupLocation.findFirst({
      where: {
        sellerId: userId
      }
    });

    if (!sellerPickupAddress) {
      throw new BadRequestException("No pickup location found.")
    }

    const sellerProfile = await this.prisma.sellerProfile.findFirst({
      where: {
        user_id: userId
      }
    });
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId
      }
    });

    const orderItemDetails: any = await this.prisma.orderItems.findFirst({
      where: {
        id: orderCreateDto.orderItemsId
      },
      select: {
        id: true,
        item_quantity: true,
        item_metadata: true,
      }
    });

    const orderDetails: any = await this.prisma.order.findFirst({
      where: {
        id: orderCreateDto.orderId
      },
      select: {
        id: true,
        order_id: true,
        amount: true,
        order_details: {
          select: {
            billing: true,
            shipping: true,
          }
        },
        order_date: true
      }
    });

    const data = {
      token,
      sellerPickupAddress,
      orderItemDetails: { ...orderItemDetails, item_metadata: JSON.parse(orderItemDetails?.item_metadata) },
      orderDetails: {
        billing: {
          ...orderDetails?.order_details?.billing,
          metadata: JSON.parse(orderDetails?.order_details?.billing)
        },
        shipping: {
          ...orderDetails?.order_details?.shipping,
          metadata: JSON.parse(orderDetails?.order_details?.shipping)
        }
      },
    }

    const orderpayload = {
      "order_id": orderCreateDto.orderItemsId,
      "order_date": orderDetails.order_date,
      // "pickup_location": "Primary",
      "pickup_location": orderCreateDto?.pickuplocation,
      "billing_customer_name": data?.orderDetails?.billing?.metadata?.metadata?.first_name,
      "billing_last_name": data?.orderDetails?.billing?.metadata?.metadata?.last_name,
      "billing_address": data?.orderDetails?.billing?.metadata?.metadata?.address1,
      // "billing_address_2": "",
      // "billing_isd_code": "",
      "billing_city": data?.orderDetails?.billing?.metadata?.metadata?.city,
      "billing_pincode": data?.orderDetails?.billing?.metadata?.metadata?.pincode,
      "billing_state": data?.orderDetails?.billing?.metadata?.metadata?.state,
      "billing_country": "India",
      "billing_email": user?.email,
      // "billing_phone": 6294748063,
      "billing_phone": +(data?.orderDetails?.billing?.metadata?.metadata?.mobile_no),
      "shipping_is_billing": false,
      "shipping_customer_name": data?.orderDetails?.shipping?.metadata?.metadata?.first_name,
      "shipping_last_name": data?.orderDetails?.shipping?.metadata?.metadata?.last_name,
      "shipping_address": data?.orderDetails?.shipping?.metadata?.metadata?.address1,
      // "shipping_address_2": orderDetails?.shipping?.metadata,
      "shipping_city": data?.orderDetails?.shipping?.metadata?.metadata?.city,
      "shipping_pincode": data?.orderDetails?.shipping?.metadata?.metadata?.pincode,
      "shipping_country": "India",
      "shipping_state": data?.orderDetails?.shipping?.metadata?.metadata?.state,
      "shipping_email": user?.email,
      // "shipping_phone": 6294748063,
      "shipping_phone": +(data?.orderDetails?.shipping?.metadata?.metadata?.mobile_no),
      "order_items": [
        {
          "name": data?.orderItemDetails?.item_metadata?.name,
          "sku": data?.orderItemDetails?.item_metadata?.sku,
          "units": orderItemDetails?.item_quantity,
          "selling_price": +(data?.orderItemDetails?.item_metadata?.mrp),
          // "discount": orderItemDetails?.item_metadata,
          // "tax": orderItemDetails?.item_metadata,
          // "hsn": orderItemDetails?.item_metadata
        }
      ],
      "payment_method": "Prepaid",
      // "shipping_charges": "",
      // "giftwrap_charges": "",
      // "transaction_charges": "",
      // "total_discount": "",
      "sub_total": +(data?.orderItemDetails?.item_metadata?.mrp) * orderItemDetails?.item_quantity,
      "length": orderCreateDto?.length,
      "breadth": orderCreateDto?.breadth,
      "height": orderCreateDto?.height,
      "weight": orderCreateDto?.weight,
      // "ewaybill_no": "",
      // "customer_gstin": "",
      // "invoice_number": "",
      // "order_type": ""
    }
    // return

    try {
      const orderRes = await axios.post(`https://apiv2.shiprocket.in/v1/external/orders/create/adhoc`, orderpayload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });


      if (orderRes?.status === 200) {
        const generateAWB = await axios.post(`https://apiv2.shiprocket.in/v1/external/courier/assign/awb`, {
          shipment_id: orderRes?.data?.shipment_id,
        }, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        // console.log(generateAWB?.status, "statusawb")

        // console.log(generateAWB?.data, "genedddrateAWBfsdfsdf")
        // console.log(generateAWB?.data?.response?.data?.awb_code, "generateAWBfsdfsdf")
        // console.log({
        //   awb_number: generateAWB?.data?.response?.data?.awb_code,
        //   shipmentId: +(orderRes?.data?.shipment_id),
        //   shiprocketOrderId: +(orderRes?.data?.order_id),
        //   orderId: orderCreateDto.orderItemsId
        // }, "dfndsfifdfshgfjsdhjkfsdjkfdhsf")

        if (generateAWB?.status === 200) {

          const res = await this.prisma.shiprocketOrder.create({
            data: {
              awb_number: generateAWB?.data?.response?.data?.awb_code,
              shipmentId: +(orderRes?.data?.shipment_id),
              shiprocketOrderId: +(orderRes?.data?.order_id),
              orderItemsId: +(orderCreateDto.orderItemsId),
              pickup_location_id: sellerPickAddressFromPayload?.id
            }
          });

          await this.prisma.orderItems.update({
            where: {
              id: orderCreateDto.orderItemsId
            },
            data: {
              order_status_id: 3,
              updated_at: new Date()
            }
          })
          setImmediate(async () => {
            try {
              const haveInappPreferance = await this.havePreferance(userId, BigInt(5))
              if (haveInappPreferance) {
                await createNotification(
                  userId,
                  "ORDER_UPDATE",
                  "Order update",
                  `Your order #${orderDetails.order_id} worth ₹${data?.orderItemDetails?.total_item_amount} has been confirmed. We’ll ship it soon!`,
                  {
                    id: orderDetails.id,
                    order_id: orderDetails.order_id,
                    customer_id: userId,
                    amount: orderDetails.amount,
                  },
                );
              }
              const haveMailPreferance = await this.havePreferance(userId, BigInt(3))
              if (haveMailPreferance) {
                const orderData = await this.orderService.orderData(BigInt(orderDetails.id), userId);
                const pdfBuffer = await this.orderService.createPDF(BigInt(orderCreateDto.orderItemsId), userId);
                await this.mailService.sendOrderUpdationEmail(userId, BigInt(orderCreateDto.orderItemsId), orderData, pdfBuffer)
              }
            } catch (error) {
              console.error("Failed to send notifiactions")
            }
          });

          return res
        }
      }
    } catch (error: any) {
      throw new BadRequestException(error.response.data.message);
    }

    // console.log("orderDetails", {
    //   token,
    //   sellerPickupAddress,
    //   orderItemDetails: { ...orderItemDetails, item_metadata: JSON.parse(orderItemDetails?.item_metadata) },
    //   orderDetails: {
    //     billing: {
    //       ...orderDetails?.order_details?.billing, metadata: JSON.parse(orderDetails?.order_details?.billing?.metadata)
    //     },
    //     shipping: {
    //       ...orderDetails?.order_details?.shipping, metadata: JSON.parse(orderDetails?.order_details?.shipping?.metadata)
    //     }
    //   },
    // });

    // return {
    //   orderpayload,
    //   orderItemDetails: { ...orderItemDetails, item_metadata: JSON.parse(orderItemDetails?.item_metadata), name: JSON.parse(orderItemDetails?.item_metadata)?.name },
    // }
  };


  private async havePreferance(customer_id: bigint, preference_category_id: bigint) {
    return await this.prisma.notificationPreference.count({
      where: {
        user_id: customer_id,
        preference_category_id
      }
    })
  }



  async getorderTrackingDetails(orderItemsId: bigint) {
    try {
      const token = await this.login();
      const awbNumber = await this.prisma.shiprocketOrder.findFirst({
        where: {
          orderItemsId: orderItemsId
        },
        select: {
          awb_number: true,
        }
      })

      if (awbNumber !== null) {
        const trackingres = await axios.get(`https://apiv2.shiprocket.in/v1/external/courier/track/awb/${awbNumber.awb_number}`, {
          // const trackingres = await axios.get(`https://apiv2.shiprocket.in/v1/external/courier/track/awb/19041508069132`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        return trackingres.data
      } else {
        return "Awb number not found"
      }
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response.data.message);
    }
  }


}
