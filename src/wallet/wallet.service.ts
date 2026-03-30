import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';
import { PrismaService } from '@/prisma/prisma.service';
import { GetWalletDto } from './dto/get-wallet.dto';
import { CreateWithdrawRequestDto } from './dto/withdrawal-request.dto';
import { PaginationDto } from '@/customer/product/dto/pagination.dto';
import { GetLivesDto } from '@/live/dto/get-lives.dto';
import { Request } from 'express';


@Injectable()
export class WalletService {
  constructor(private prisma: PrismaService) { }

  create(createWalletDto: CreateWalletDto) {
    return 'This action adds a new wallet';
  }

  async sellerWallet(seller_id: bigint) {
    try {
      let wallet: any = await this.prisma.wallet.findUnique({
        where: { user_id: seller_id },
        select: {
          sellerWalletTransaction: {
            orderBy: { order_item_id: 'desc' },
            select: {
              id: true,
              amount_earned: true,
              withdrawn_amount: true,
              commision_charges_amount: true,
              cancellation_charges_amount: true,
              created_at: true,
              order_item: {
                select: {
                  order: {
                    select: {
                      id: true,
                      order_id: true,
                    }
                  },
                  order_status: {
                    select: { id: true, title: true }
                  }
                }
              }
            }
          }
        }
      });

      // const totalCount = await this.prisma.sellerWalletTransaction.count({
      //   where: {
      //     wallet: {
      //       user_id: seller_id
      //     }
      //   }
      // });

      if (!wallet) {
        wallet = await this.prisma.wallet.create({
          data: {
            user_id: seller_id,
            total_amount: 0
          }
        });
      }

      let totalEarnings = 0;
      let pendingAmount = 0;
      let withdrawnAmount = 0;
      let outstandingPayment = 0;
      let confirmOrderAmount = 0;
      let deliveredOrderAmount = 0;
      let remaining = 0;
      let cancellationCharges = 0;

      // const transactions = wallet?.sellerWalletTransaction.map(txn => {
      //   const { order_item, amount_earned, cancellation_charges_amount, withdrawn_amount } = txn;

      //   withdrawnAmount += Number(withdrawn_amount)
      //   // totalEarnings -= Number(cancellation_charges_amount);
      //   cancellationCharges += Number(cancellation_charges_amount);

      //   const statusTitle = order_item.order_status?.title?.toLowerCase() || "";

      //   if (statusTitle === "pending" || statusTitle === "processing" || statusTitle === "on-hold") {
      //     pendingAmount += Number(amount_earned);
      //   }

      //   if (statusTitle === "delivered") {
      //     totalEarnings += Number(amount_earned)
      //     deliveredOrderAmount += Number(amount_earned);

      //     remaining = Number(amount_earned) - Number(withdrawn_amount)
      //     if (remaining > 0) {
      //       outstandingPayment += remaining;
      //     }
      //   }

      //   if (statusTitle === "processing" || statusTitle === "confirmed" || statusTitle === "shipped") {
      //     confirmOrderAmount += Number(amount_earned);
      //   }

      //   return {
      //     wallet_txn_id: Number(txn.id),
      //     order_id: order_item.order.order_id ? order_item.order.order_id : order_item.order.id,
      //     orderStatus: {
      //       id: Number(order_item.order_status.id),
      //       title: order_item.order_status.title
      //     },
      //     amountEarned: +Number(amount_earned).toFixed(2),
      //     created_at: txn.created_at
      //   };
      // });
      const Summary = {
        totalEarnings: +((totalEarnings) - (cancellationCharges)).toFixed(2),
        pendingAmount: +pendingAmount.toFixed(2),
        withdrawnAmount: +withdrawnAmount,
        outstandingPayment: +(outstandingPayment) - (cancellationCharges) < 0 ? 0 : +((outstandingPayment) - (cancellationCharges)).toFixed(2),
        confirmOrderAmount: +confirmOrderAmount.toFixed(2),
        deliveredOrderAmount: +deliveredOrderAmount.toFixed(2),
      }
      return {
        Summary,
        // transactions,
        // Total: totalCount
      };
    } catch (error) {
      throw error;
    }
  }

  async sellerWalletTransactions(seller_id: bigint, dto: GetLivesDto) {
    try {
      const skip = ((dto?.page || 1) - 1) * dto?.rowsPerPage;
      const take = dto?.rowsPerPage;

      const transactionsRaw = await this.prisma.sellerWalletTransaction.findMany({
        where: {
          AND: [
            {
              OR: [
                { amount_earned: { not: 0 } },
                { commision_charges_amount: { not: 0 } },
                { cancellation_charges_amount: { not: 0 } }
              ]
            },
            {
              wallet: {
                user_id: seller_id
              }
            }
          ]
        },
        skip,
        take,
        orderBy: { order_item_id: 'desc' },
        select: {
          id: true,
          amount_earned: true,
          withdrawn_amount: true,
          commision_charges_amount: true,
          cancellation_charges_amount: true,
          created_at: true,
          order_item: {
            select: {
              order: {
                select: {
                  id: true,
                  order_id: true
                }
              },
              order_status: {
                select: { id: true, title: true }
              }
            }
          }
        }
      });

      const totalCount = await this.prisma.sellerWalletTransaction.count({
        where: {
          AND: [
            {
              OR: [
                { amount_earned: { not: 0 } },
                { commision_charges_amount: { not: 0 } },
                { cancellation_charges_amount: { not: 0 } }
              ]
            },
            {
              wallet: {
                user_id: seller_id
              }
            }
          ]
        }
      });

      const transactions = transactionsRaw.map(txn => {
        const { order_item, amount_earned } = txn;

        return {
          wallet_txn_id: Number(txn.id),
          order_id: order_item.order.order_id || String(order_item.order.id),
          orderStatus: {
            id: Number(order_item.order_status.id),
            title: order_item.order_status.title
          },
          commision_charges_amount: txn.commision_charges_amount,
          cancellation_charges_amount: txn.cancellation_charges_amount,
          amountEarned: +Number(amount_earned).toFixed(2),
          created_at: txn.created_at
        };
      });

      return {
        Total: totalCount,
        Transactions: transactions
      };
    } catch (error) {
      throw error;
    }
  }

  async sellerWalletWithdrawalRequest(seller_id: bigint, dto: CreateWithdrawRequestDto) {
    try {
      const requestedAmount = Number(dto.amount);
      let remaining = requestedAmount;
      let totalAvailable = 0;

      const existingPendingRequest = await this.prisma.withdrawalRequest.findFirst({
        where: {
          seller_id,
          payout_status_id: 1,
        }
      });

      if (existingPendingRequest) {
        throw new BadRequestException("You already have a pending withdrawal request.");
      }

      const transactions = await this.prisma.sellerWalletTransaction.findMany({
        where: {
          wallet: { user_id: seller_id },
          order_item: {
            order_status: { title: 'delivered' }
          },
        },
        orderBy: { created_at: 'asc' }
      });

      const unwithdrawnTxns = transactions.filter(txn =>
        Number(txn.withdrawn_amount) < Number(txn.amount_earned)
      );

      for (const txn of unwithdrawnTxns) {
        totalAvailable += Number(txn.amount_earned) - Number(txn.withdrawn_amount);
      }

      if (totalAvailable <= 0) {
        throw new BadRequestException('Insufficient wallet balance for withdrawal.');
      }

      if (totalAvailable < requestedAmount) {
        throw new BadRequestException(`You can only withdraw up to ₹${totalAvailable.toFixed(2)}.`);
      }

      const withdrawalRequest = await this.prisma.withdrawalRequest.create({
        data: {
          seller_id,
          amount: requestedAmount,
          payout_status_id: 1, // pending
          transactions: {
            connect: unwithdrawnTxns.map(txn => ({ id: txn.id }))
          }
        }
      });

      return {
        request_id: withdrawalRequest.id,
        amount: requestedAmount
      };
    } catch (error) {
      throw error;
    }
  }
  async sellerWithdrawalRequests(seller_id: bigint, dto: GetLivesDto) {
    try {
      const conditions: any = []
      if (dto?.approval_status_id) {
        conditions.push({
          approval_status_id: dto?.approval_status_id
        });
      }
      let list: any = []
      if (dto && dto.page && dto.rowsPerPage) {
        list = await this.prisma.withdrawalRequest.findMany({
          skip: (dto?.page - 1) * dto?.rowsPerPage,
          take: dto?.rowsPerPage,
          orderBy: {
            id: 'desc'
          },
          where: {
            AND: conditions,
            seller_id
          },
          select: {
            id: true,
            amount: true,
            created_at: true,
            paid_at: true,
            payout_status: {
              select: {
                id: true,
                title: true,
              }
            },
            seller: {
              select: {
                first_name: true,
                last_name: true,
                email: true,
                phone_no: true,
                sellerProfile: {
                  select: {
                    business_name: true,
                    business_tag: true,
                  }
                }
              }
            }
          }
        })
      }
      else {
        list = await this.prisma.withdrawalRequest.findMany({
          orderBy: {
            id: 'desc'
          },
          where: {
            AND: conditions,
            seller_id
          },
          select: {
            id: true,
            amount: true,
            created_at: true,
            paid_at: true,
            payout_status: {
              select: {
                id: true,
                title: true,
              }
            },
            seller: {
              select: {
                first_name: true,
                last_name: true,
                email: true,
                phone_no: true,
                sellerProfile: {
                  select: {
                    business_name: true,
                    business_tag: true,
                  }
                }
              }
            }
          }
        })
      }
      const totalCount = await this.prisma.withdrawalRequest.count({
        where: {
          AND: conditions,
          seller_id
        }
      });
      return { Total: totalCount, Requests: list }
    } catch (error) {
      throw error
    }
  }

  async adminWallet(admin_id: bigint, dto?: GetWalletDto) {
    try {
      // 1) Fetch orders (paid)
      const wallet_transactions = await this.prisma.order.findMany({
        where: { payment_status: "paid" },
        orderBy: { id: "desc" },
        select: {
          amount: true,
          order_details: {
            select: { order_amount: true, discount_amount: true }
          },
          order_items: {
            select: {
              total_item_amount: true,
              sellerWalletTransaction: {
                select: {
                  id: true,
                  amount_earned: true,                // seller part
                  commision_charge: true,
                  commision_charges_amount: true,     // admin commission
                  cancellation_charges_amount: true,
                  created_at: true
                }
              }
            }
          }
        }
      });

      const wallet = await this.prisma.wallet.findUnique({
        where: { user_id: admin_id },
        select: { id: true, total_amount: true }
      });

      // ------------------------
      // CALCULATIONS
      // ------------------------
      let staticEarningWithoutCommission = 0; // all-time seller portion
      let staticCommission = 0;               // all-time admin commission

      let todayEarning = 0;
      let monthlyEarning = 0;
      let yearlyEarning = 0;

      const now = new Date();

      // Normalize incoming dates
      let startDate: Date | null = dto?.startDate ? new Date(dto.startDate) : null;
      let endDate: Date | null = dto?.endDate ? new Date(dto.endDate) : null;

      if (startDate && !endDate) {
        endDate = new Date(startDate);
      }

      if (startDate) startDate.setHours(0, 0, 0, 0);
      if (endDate) endDate.setHours(23, 59, 59, 999);

      // For graph dataset (date-filtered)
      const graphMap: Record<
        string,
        {
          totalCommission: number;
          totalEarningWithoutCommission: number;
          totalEarningWithCommission: number;
        }
      > = {};

      const toKey = (d: Date) => d.toISOString().split("T")[0];

      wallet_transactions.forEach(order => {
        order.order_items.forEach(item => {
          item.sellerWalletTransaction.forEach(txn => {
            const earned = txn.amount_earned?.toNumber?.() ?? Number(txn.amount_earned ?? 0);
            const commissionChargeAmt = txn.commision_charges_amount?.toNumber?.() ?? Number(txn.commision_charges_amount ?? 0);
            const cancellationChargeAmt = txn.cancellation_charges_amount?.toNumber?.() ?? Number(txn.cancellation_charges_amount ?? 0);
            const commissionAmt = commissionChargeAmt + cancellationChargeAmt
            const createdAt = new Date(txn.created_at);

            // ---------------------------
            // STATIC TOTALS (ignore date filter)
            // ---------------------------
            staticEarningWithoutCommission += earned;
            staticCommission += commissionAmt;

            // ---------------------------
            // PERIODIC CALCULATIONS (today/month/year)
            // ---------------------------
            const todayStr = now.toISOString().split("T")[0];
            const createdStr = createdAt.toISOString().split("T")[0];
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();

            if (createdStr === todayStr) {
              todayEarning += commissionAmt;
            }
            if (createdAt.getMonth() === currentMonth && createdAt.getFullYear() === currentYear) {
              monthlyEarning += commissionAmt;
            }
            if (createdAt.getFullYear() === currentYear) {
              yearlyEarning += commissionAmt;
            }

            // ---------------------------
            // GRAPH DATA (apply date filter)
            // ---------------------------
            const inFilter =
              startDate && endDate
                ? createdAt >= startDate && createdAt <= endDate
                : true;

            if (inFilter) {
              const dateKey = toKey(createdAt);
              if (!graphMap[dateKey]) {
                graphMap[dateKey] = {
                  totalCommission: 0,
                  totalEarningWithoutCommission: 0,
                  totalEarningWithCommission: 0
                };
              }
              graphMap[dateKey].totalCommission += commissionAmt;
              graphMap[dateKey].totalEarningWithoutCommission += earned;
              graphMap[dateKey].totalEarningWithCommission += earned + commissionAmt;
            }
          });
        });
      });

      const graphData = Object.entries(graphMap)
        .map(([date, vals]) => ({
          date,
          totalCommission: +vals.totalCommission.toFixed(2),
          totalEarningWithoutCommission: +vals.totalEarningWithoutCommission.toFixed(2),
          totalEarningWithCommission: +vals.totalEarningWithCommission.toFixed(2)
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      return {
        Wallet: wallet,
        Wallet_Transactions: wallet_transactions,
        Summary: {
          totalEarningWithCommission: wallet?.total_amount?.toNumber?.() ?? Number(wallet?.total_amount ?? 0),
          totalEarningWithoutCommission: +staticEarningWithoutCommission.toFixed(2),
          totalCommission: +staticCommission.toFixed(2),
          todayEarning: +todayEarning.toFixed(2),
          monthlyEarning: +monthlyEarning.toFixed(2),
          yearlyEarning: +yearlyEarning.toFixed(2)
        },
        Graph: graphData
      };
    } catch (error) {
      throw error;
    }
  }

  async withdrawalRequestList(dto: PaginationDto) {
    try {
      let list: any = []
      if (dto && dto.page && dto.rowsPerPage) {
        list = await this.prisma.withdrawalRequest.findMany({
          skip: (dto?.page - 1) * dto?.rowsPerPage,
          take: dto?.rowsPerPage,
          orderBy: {
            id: 'desc'
          },
          select: {
            id: true,
            amount: true,
            created_at: true,
            paid_at: true,
            payout_status: {
              select: {
                id: true,
                title: true,
              }
            },
            seller: {
              select: {
                first_name: true,
                last_name: true,
                email: true,
                phone_no: true,
                sellerProfile: {
                  select: {
                    business_name: true,
                    business_tag: true,
                  }
                }
              }
            }
          }
        })
      }
      else {
        list = await this.prisma.withdrawalRequest.findMany({
          orderBy: {
            id: 'desc'
          },
          select: {
            id: true,
            amount: true,
            created_at: true,
            paid_at: true,
            payout_status: {
              select: {
                id: true,
                title: true,
              }
            },
            seller: {
              select: {
                first_name: true,
                last_name: true,
                email: true,
                phone_no: true,
                sellerProfile: {
                  select: {
                    business_name: true,
                    business_tag: true,
                  }
                }
              }
            }
          }
        })
      }
      const totalCount = await this.prisma.withdrawalRequest.count({});
      return { Total: totalCount, Requests: list }
    } catch (error) {
      throw error
    }
  }

  async exportWithdrawalRequest(dto: PaginationDto) {
    try {
      let list = await this.prisma.withdrawalRequest.findMany({
        orderBy: {
          id: 'desc'
        },
        select: {
          id: true,
          amount: true,
          created_at: true,
          paid_at: true,
          payout_status: {
            select: {
              id: true,
              title: true,
            }
          },
          seller: {
            select: {
              first_name: true,
              last_name: true,
              email: true,
              phone_no: true,
              sellerProfile: {
                select: {
                  business_name: true,
                  business_tag: true,
                }
              }
            }
          }
        }
      })
      let result = JSON.stringify(list, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      return { List: result }
    } catch (error) {
      throw error
    }
  }

  async approveWithdrawalRequest(request_id: bigint, status_id: bigint, req: Request, user_email: string) {
    try {
      const withdrawalRequest = await this.prisma.withdrawalRequest.findUnique({
        where: { id: request_id },
        select: {
          amount: true,
          payout_status: true,
          payout_status_id: true,
          transactions: true
        }
      });

      if (!withdrawalRequest) {
        throw new BadRequestException('Withdrawal request not found');
      }
      if (withdrawalRequest.payout_status_id === BigInt(2)) {
        throw new BadRequestException('Requested amount already paid.');
      }
      if (status_id === BigInt(2)) {
        let remaining = Number(withdrawalRequest.amount);
        const txns = withdrawalRequest.transactions.sort((a, b) => a.created_at.getTime() - b.created_at.getTime());

        for (const txn of txns) {
          const available = Number(txn.amount_earned) - Number(txn.withdrawn_amount);
          if (available <= 0) continue;

          const toWithdraw = Math.min(available, remaining);
          remaining -= toWithdraw;

          await this.prisma.sellerWalletTransaction.update({
            where: { id: txn.id },
            data: {
              withdrawn_amount: Number(txn.withdrawn_amount) + toWithdraw
            }
          });

          if (remaining <= 0) break;
        }

        if (remaining > 0) {
          throw new Error('Not enough unwithdrawn balance to approve withdrawal');
        }

        const update = await this.prisma.withdrawalRequest.update({
          where: { id: request_id },
          data: {
            payout_status_id: status_id,
            paid_at: new Date()
          },
          select: {
            amount: true,
            payout_status: true,
            seller: {
              select: {
                sellerProfile: {
                  select: {
                    business_name: true,
                  }
                }
              }
            }
          }
        });
        await this.prisma.adminActivityLog.create({
          data: {
            action: 'UPDATE',
            description: `Status of the seller's (name:${update.seller.sellerProfile?.business_name}) wallet withdrawal request (amount: ${update.amount}) was changed from "${withdrawalRequest.payout_status.title}" to "${update.payout_status.title}" by "${user_email}".`,
            ip: req.ip,
            userAgent: req.headers['user-agent'] || '',
          },
        });
        return true
      }
      else if (status_id === BigInt(3) || status_id === BigInt(1)) {
        const update = await this.prisma.withdrawalRequest.update({
          where: { id: request_id },
          data: {
            payout_status_id: status_id,
          },
          select: {
            amount: true,
            payout_status: true,
            seller: {
              select: {
                sellerProfile: {
                  select: {
                    business_name: true,
                  }
                }
              }
            }
          }
        });
        await this.prisma.adminActivityLog.create({
          data: {
            action: 'UPDATE',
            description: `Status of the seller's (name:${update.seller.sellerProfile?.business_name})  wallet withdrawal request (amount: ${update.amount}) was changed from "${withdrawalRequest.payout_status.title}" to "${update.payout_status.title}" by "${user_email}".`,
            ip: req.ip,
            userAgent: req.headers['user-agent'] || '',
          },
        });
        return true
      }
    } catch (error) {
      throw error
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} wallet`;
  }

  update(id: number, updateWalletDto: UpdateWalletDto) {
    return `This action updates a #${id} wallet`;
  }

  remove(id: number) {
    return `This action removes a #${id} wallet`;
  }
}
