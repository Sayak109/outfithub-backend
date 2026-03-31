# OutfitHub Backend: API and Functionality Documentation

## 1. Project Overview
- Framework: NestJS 11 + TypeScript
- Database: PostgreSQL via Prisma ORM
- API Base URL Pattern: /api/v1/...
- Auth Style: JWT stored in HTTP-only cookie (token)
- Static Uploads: Served from /uploads
- Scheduler: Cron jobs via @nestjs/schedule

This backend implements a multi-role commerce platform with buyer, seller, admin, and operator capabilities including product catalog management, seller onboarding, cart/checkout/order lifecycle, payment via Razorpay, shipping via Shiprocket, notifications, wallet settlements, reels/live commerce, support, and CMS-style pages.

## 2. High-Level Domain Model
Core Prisma entities are grouped as:
- Identity and Access: User, Role, UserToken, AccountStatus, ApprovalStatus
- Catalog: Product, ProductImage, ProductCategory, ProductAttribute, ProductAttributeTerm
- Seller Domain: SellerProfile, SellerKYC, SellerStoreFront, SocialLinks, PickupLocation
- Customer Shopping: Cart, CartAttributeTerm, WishList, Address
- Orders and Payments: Order, OrderItems, OrderDetails, OrderCancel, OrderCancelImage
- Payouts: Wallet, SellerWalletTransaction, WithdrawalRequest, PayoutStatus
- Content and Discovery: Reels, Live, HashTag, ReelTags, SearchQuery, RecentSearch, DynamicPage, Menu, MenuType
- Communication: InAppNotifications, NotificationPreference, PushNotification, SupportTicket, FAQ, CustomerFeedback
- Integrations: shiprocketOrder, ShiprocketToken

## 3. Authentication and Authorization
### 3.1 Roles
- admin
- operator
- seller
- buyer
- Guest users are created with temporary accounts and later merged into real users on signup/signin.

### 3.2 Guards and Access Decorators
- JwtGuard: validates JWT from cookie and checks token revocation/expiry via UserToken.
- RolesGuard: enforces @Roles(...) against user.role.title.
- AccountStatusGuard: enforces allowed account states.
- ApprovalStatusGuard: enforces allowed approval states.

### 3.3 Auth Flows
- POST /api/v1/auth/signup: OTP-verified registration; sets auth cookie.
- POST /api/v1/auth/signin: email/social login; sets auth cookie.
- POST /api/v1/auth/guest: creates temporary guest account + cookie.
- POST /api/v1/auth/logout and POST /api/v1/auth/logout-all: revoke current/all tokens.
- POST /api/v1/auth/forgot-password and POST /api/v1/auth/reset-password: reset flow via mail token.

## 4. Core Functional Workflows
### 4.1 Seller Onboarding and Commerce Setup
- Seller profile creation/update with media uploads.
- Social links and storefront metadata management.
- Pickup address creation and Shiprocket pickup sync.
- Seller product CRUD with image handling and moderation status.
- Seller reels/live CRUD and seller-facing order management.

### 4.2 Buyer Shopping Lifecycle
- Explore/search APIs with popular/recent/relevant searches.
- Product discovery APIs and seller storefront views.
- Cart management including holding items and coupon fetch.
- Checkout -> order creation -> payment confirmation.
- Cancellation and return requests with optional return evidence uploads.
- Invoice PDF generation and order update email triggers.

### 4.3 Admin and Operator Controls
- User and seller management.
- Category/attribute/coupon/FAQ/menu/dynamic page management.
- Order operations including return-approval and seller return analytics.
- Wallet and withdrawal request oversight with export endpoint.
- Dashboard analytics endpoints (totals, top data, graphs, recent orders).

### 4.4 Notification and Communication
- In-app notification preferences and listing.
- FCM token registration and push dispatch (single/all users).
- Email campaigns to all users.
- Support ticket submission with image/pdf attachments.

### 4.5 Payments, Webhooks, and Logistics
- Razorpay used for order payment and refund operations.
- Dedicated raw-body webhook endpoint for Razorpay signature validation.
- Shiprocket order creation, AWB assignment, and tracking retrieval.
- Cron task monitors/recovers payment states.

## 5. API Response Pattern
Most endpoints use a standard wrapper:

{
  success: boolean,
  message: string,
  data: any
}

## 6. Environment Keys Used by the App
(Names only; do not store secrets in docs)
- BASE_PATH
- COOKIE_DOMAIN
- COOKIE_EXPIRATION_TIME
- CUSTOMER_FEEDBACK_IMAGE_PATH
- DATA_REPORT_PATH
- DATABASE_URL
- IMAGE_PATH
- IMAGE_TEMP_PATH
- JWT_EXPIRATION_TIME
- JWT_SECRET
- MAIL_HOST
- MAIL_PASS
- MAIL_PORT
- MAIL_USER
- NODE_ENV
- NOTIFICATION_IMAGE_PATH
- ORDER_RETURN_IMAGE_PATH
- OTP_SMS_SEND
- PORT
- PRODUCT_CATEGORY_IMAGE_PATH
- PRODUCT_IMAGE_PATH
- PUBLIC_ENCRYPTION_KEY
- RAZORPAY_WEBHOOK_SECRET
- SAME_SITE
- SUPPROT_TICKET_PATH
- TEMP_PRODUCT_IMAGE_PATH
- USER_BUSINESS_IMAGE_PATH
- USER_KYC_IMAGE_PATH
- USER_PROFILE_IMAGE_PATH
- USER_REELS_PATH
- VIDEO_TEMP_PATH
- WALLET_REPORT_PATH
- WEB_BASE_PATH

## 7. Complete Endpoint Catalog (Controller-wise)
Notes:
- All paths below are shown as full API paths with version prefix.
- Auth column is inferred from controller decorators and indicates likely access policy.
- A few routes are intentionally non-REST (for example PUT used for filtered listings) as implemented in code.

### src\account\account.controller.ts
| Method | Path | Handler | Auth |
|---|---|---|---|
| DELETE | /api/v1/account/:id | remove | Public/Unspecified |
| GET | /api/v1/account/:id | findOne | Public/Unspecified |
| POST | /api/v1/account/delete | deleteAccount | Public/Unspecified |
| PUT | /api/v1/account/deleted-users | findAllDelUsers | JwtGuard, RolesGuard; Roles: Role.Admin, Role.Operator |
| POST | /api/v1/account/download-request | downloadRequest | Public/Unspecified |
| PUT | /api/v1/account/download-request | findAll | JwtGuard, RolesGuard; Roles: Role.Admin, Role.Operator |
| PATCH | /api/v1/account/download-request/:id | updateDownloadRequest | JwtGuard, RolesGuard; Roles: Role.Admin, Role.Operator |

### src\admin\admin.controller.ts
| Method | Path | Handler | Auth |
|---|---|---|---|
| PUT | /api/v1/admin/log-report | getAllReport | Public/Unspecified |
| GET | /api/v1/admin/sellers | findAllSellers | Public/Unspecified |
| POST | /api/v1/admin/user | create | JwtGuard, RolesGuard; Roles: Role.Admin, Role.Operator |
| DELETE | /api/v1/admin/user/:id | remove | Public/Unspecified |
| GET | /api/v1/admin/user/:id | findOne | Public/Unspecified |
| PATCH | /api/v1/admin/user/:id | update | Public/Unspecified |
| PUT | /api/v1/admin/user-profile/:id | FileFieldsInterceptor | Public/Unspecified |
| PUT | /api/v1/admin/users | findAll | Public/Unspecified |

### src\admin-settings\admin-settings.controller.ts
| Method | Path | Handler | Auth |
|---|---|---|---|
| POST | /api/v1/admin-settings | create | JwtGuard, RolesGuard; Roles: Role.Admin |
| PUT | /api/v1/admin-settings | findAll | Public/Unspecified |
| DELETE | /api/v1/admin-settings/:id | remove | JwtGuard, RolesGuard; Roles: Role.Admin |
| GET | /api/v1/admin-settings/:id | findOne | Public/Unspecified |
| PATCH | /api/v1/admin-settings/:id | update | JwtGuard, RolesGuard; Roles: Role.Admin |

### src\attributes\attributes.controller.ts
| Method | Path | Handler | Auth |
|---|---|---|---|
| POST | /api/v1/attributes | create | JwtGuard, RolesGuard; Roles: Role.Admin, Role.Operator |
| PUT | /api/v1/attributes | findAll | Public/Unspecified |
| DELETE | /api/v1/attributes/term/:id | removeAttributeTerm | Public/Unspecified |
| DELETE | /api/v1/attributes/:id | removeAttribute | Public/Unspecified |
| PATCH | /api/v1/attributes/:id | updateAttribute | Public/Unspecified |
| PUT | /api/v1/attributes/:id | findOne | Public/Unspecified |
| PATCH | /api/v1/attributes/term/:id | updateAttributeTerm | Public/Unspecified |

### src\auth\auth.controller.ts
| Method | Path | Handler | Auth |
|---|---|---|---|
| POST | /api/v1/auth/forgot-password | forgotPassword | Public/Unspecified |
| POST | /api/v1/auth/guest | createGuest | Public/Unspecified |
| POST | /api/v1/auth/logout | logout | JwtGuard |
| POST | /api/v1/auth/logout-all | logoutAll | JwtGuard |
| POST | /api/v1/auth/reset-password | resetPassword | Public/Unspecified |
| POST | /api/v1/auth/signin | signin | Public/Unspecified |
| POST | /api/v1/auth/signup | create | Public/Unspecified |

### src\blocked-keywords\blocked-keywords.controller.ts
| Method | Path | Handler | Auth |
|---|---|---|---|
| POST | /api/v1/blocked-keywords | blockKeywords | JwtGuard, RolesGuard; Roles: Role.Admin, Role.Operator |
| PUT | /api/v1/blocked-keywords | findAll | Public/Unspecified |
| GET | /api/v1/blocked-keywords/:id | findOne | Public/Unspecified |
| PATCH | /api/v1/blocked-keywords/:id | update | Public/Unspecified |
| POST | /api/v1/blocked-keywords/delete | remove | JwtGuard, RolesGuard; Roles: Role.Admin, Role.Operator |

### src\category\category.controller.ts
| Method | Path | Handler | Auth |
|---|---|---|---|
| POST | /api/v1/category | create | JwtGuard, RolesGuard; Roles: Role.Admin, Role.Operator |
| PUT | /api/v1/category | findAll | Public/Unspecified |
| DELETE | /api/v1/category/:id | remove | Roles: Role.Admin, Role.Operator |
| PATCH | /api/v1/category/:id | update | Roles: Role.Admin, Role.Operator |
| PUT | /api/v1/category/:id | findOne | Public/Unspecified |
| DELETE | /api/v1/category/image/:id | removeImage | Roles: Role.Admin, Role.Operator |

### src\coupon\coupon.controller.ts
| Method | Path | Handler | Auth |
|---|---|---|---|
| POST | /api/v1/coupon | create | JwtGuard, RolesGuard; Roles: Role.Admin, Role.Operator |
| PUT | /api/v1/coupon | findAll | Public/Unspecified |
| DELETE | /api/v1/coupon/:id | remove | Public/Unspecified |
| GET | /api/v1/coupon/:id | findOne | Public/Unspecified |
| PATCH | /api/v1/coupon/:id | update | Public/Unspecified |

### src\customer\address\address.controller.ts
| Method | Path | Handler | Auth |
|---|---|---|---|
| GET | /api/v1/customer/address | findAll | Public/Unspecified |
| POST | /api/v1/customer/address | createBillingAddress | JwtGuard |
| DELETE | /api/v1/customer/address/:id | remove | Public/Unspecified |
| GET | /api/v1/customer/address/:id | findOne | Public/Unspecified |
| PATCH | /api/v1/customer/address/:id | update | Public/Unspecified |

### src\customer\allseller\allseller.controller.ts
| Method | Path | Handler | Auth |
|---|---|---|---|
| PUT | /api/v1/allsellers | findAll | Public/Unspecified |
| PUT | /api/v1/seller/products/:id | findAllSellerProduct | Public/Unspecified |

### src\customer\cart\cart.controller.ts
| Method | Path | Handler | Auth |
|---|---|---|---|
| POST | /api/v1/customer/cart | create | JwtGuard |
| PUT | /api/v1/customer/cart | findAll | Public/Unspecified |
| DELETE | /api/v1/customer/cart/:id | remove | Public/Unspecified |
| PATCH | /api/v1/customer/cart/:id | update | Public/Unspecified |
| POST | /api/v1/customer/cart/holding-items | cartHolding | Public/Unspecified |
| GET | /api/v1/customer/coupons | coupons | Public/Unspecified |

### src\customer\explore\buyer-explore.controller.ts
| Method | Path | Handler | Auth |
|---|---|---|---|
| GET | /api/v1//search/popular-searches | getPopularSearches | Public/Unspecified |
| GET | /api/v1//search/recent-searches | getRecentSearches | JwtGuard |
| GET | /api/v1//search/relevant-search | getRelevantSearches | Public/Unspecified |
| GET | /api/v1/categories | getAllCategories | Public/Unspecified |
| GET | /api/v1/categories/:id | getCategoryById | Public/Unspecified |
| GET | /api/v1/category/:slug | getMetaByCatgory | Public/Unspecified |
| GET | /api/v1/filters | getAllFilters | Public/Unspecified |
| PUT | /api/v1/search | search | Public/Unspecified |
| PUT | /api/v1/subcategory/:id | getSubCategoryById | Public/Unspecified |

### src\customer\live\live.controller.ts
| Method | Path | Handler | Auth |
|---|---|---|---|
| POST | /api/v1/customer/live | create | Public/Unspecified |
| PUT | /api/v1/customer/live | findAllReels | Public/Unspecified |
| DELETE | /api/v1/customer/live/:id | remove | Public/Unspecified |
| PATCH | /api/v1/customer/live/:id | update | Public/Unspecified |
| GET | /api/v1/customer/live/:slug | findOne | Public/Unspecified |

### src\customer\order\order.controller.ts
| Method | Path | Handler | Auth |
|---|---|---|---|
| GET | /api/v1/customer/cancel-order/:id | GetCancelOrder | Public/Unspecified |
| POST | /api/v1/customer/cancel-order/:id | CancelOrder | Public/Unspecified |
| POST | /api/v1/customer/checkout | checkout | JwtGuard |
| POST | /api/v1/customer/order | create | Public/Unspecified |
| PUT | /api/v1/customer/order | findAll | Public/Unspecified |
| GET | /api/v1/customer/order/:id | findOne | Public/Unspecified |
| GET | /api/v1/customer/order/pdf/:id | update | Public/Unspecified |
| POST | /api/v1/customer/order/send/:id | sendOrderUpdateEmail | Public/Unspecified |
| POST | /api/v1/customer/payment/:id | payment | Public/Unspecified |
| POST | /api/v1/customer/return-order/:id | ReturnOrder | Public/Unspecified |
| POST | /api/v1/customer/test-encryption | Test | Public/Unspecified |

### src\customer\product\product.controller.ts
| Method | Path | Handler | Auth |
|---|---|---|---|
| POST | /api/v1/customer | create | Public/Unspecified |
| DELETE | /api/v1/customer/:id | remove | Public/Unspecified |
| GET | /api/v1/customer/product-details/:slug | productDetials | Public/Unspecified |
| PUT | /api/v1/customer/products | findAllProducts | Public/Unspecified |
| GET | /api/v1/customer/products/:slug | getSellerDetails | Public/Unspecified |
| PUT | /api/v1/customer/store-front/:link | find | Public/Unspecified |

### src\customer\reels\reels.controller.ts
| Method | Path | Handler | Auth |
|---|---|---|---|
| PUT | /api/v1/customer/reels | findAllReels | Public/Unspecified |
| DELETE | /api/v1/customer/reels/:id | remove | Public/Unspecified |
| PATCH | /api/v1/customer/reels/:id | update | JwtGuard |
| GET | /api/v1/customer/reels/:slug | findOne | Public/Unspecified |
| PUT | /api/v1/customer/reels/by-tags/:tag | reelsbyTags | Public/Unspecified |
| POST | /api/v1/customer/reels/product-click-count/:id | create | Public/Unspecified |
| GET | /api/v1/customer/reels/tags | topTags | Public/Unspecified |

### src\customer\sellerfront\sellerfront.controller.ts
| Method | Path | Handler | Auth |
|---|---|---|---|
| GET | /api/v1/seller-meta/:storelink | getMetaForSellerFront | Public/Unspecified |

### src\customer\wishlist\wishlist.controller.ts
| Method | Path | Handler | Auth |
|---|---|---|---|
| POST | /api/v1/wishlist | create | JwtGuard, RolesGuard; Roles: Role.Admin, Role.Operator, Role.Seller, Role.Buyer |
| PUT | /api/v1/wishlist | findAll | Public/Unspecified |
| DELETE | /api/v1/wishlist/:id | remove | Public/Unspecified |
| GET | /api/v1/wishlist/:id | findOne | Public/Unspecified |

### src\dashboard\dashboard.controller.ts
| Method | Path | Handler | Auth |
|---|---|---|---|
| POST | /api/v1/dashboard | create | JwtGuard, RolesGuard; Roles: Role.Admin, Role.Operator |
| DELETE | /api/v1/dashboard/:id | remove | Public/Unspecified |
| PATCH | /api/v1/dashboard/:id | update | Public/Unspecified |
| GET | /api/v1/dashboard/orders-graph | ordersGraph | Public/Unspecified |
| GET | /api/v1/dashboard/product-list | productList | Public/Unspecified |
| GET | /api/v1/dashboard/recent-orders | recentOrders | Public/Unspecified |
| GET | /api/v1/dashboard/top | findTop | Public/Unspecified |
| GET | /api/v1/dashboard/total | findTotal | Public/Unspecified |
| PUT | /api/v1/dashboard/users-graph | usersGraph | Public/Unspecified |

### src\delivery\delivery.controller.ts
| Method | Path | Handler | Auth |
|---|---|---|---|
| GET | /api/v1/delivery/order-tracking/:orderItemsId | getorderTrackingDetails | Public/Unspecified |
| POST | /api/v1/delivery/shiprocket-order | createShiprocketOrder | JwtGuard |

### src\dynamic-pages\dynamic-pages.controller.ts
| Method | Path | Handler | Auth |
|---|---|---|---|
| POST | /api/v1/page | create | JwtGuard, RolesGuard; Roles: Role.Admin, Role.Operator |
| PUT | /api/v1/page | getAllDynamicPages | JwtGuard, RolesGuard; Roles: Role.Admin, Role.Operator |
| DELETE | /api/v1/page/:id | removeDynamicPage | JwtGuard, RolesGuard; Roles: Role.Admin, Role.Operator |
| PATCH | /api/v1/page/:id | updateDynamicPage | JwtGuard, RolesGuard; Roles: Role.Admin, Role.Operator |
| GET | /api/v1/page/:slug | getDynamicPage | Public/Unspecified |

### src\faq\faq.controller.ts
| Method | Path | Handler | Auth |
|---|---|---|---|
| POST | /api/v1/faq | create | JwtGuard, RolesGuard; Roles: Role.Admin, Role.Operator |
| DELETE | /api/v1/faq/:id | remove | JwtGuard, RolesGuard; Roles: Role.Admin, Role.Operator |
| GET | /api/v1/faq/:id | findOne | JwtGuard, RolesGuard; Roles: Role.Admin, Role.Operator |
| PATCH | /api/v1/faq/:id | update | JwtGuard, RolesGuard; Roles: Role.Admin, Role.Operator |
| PUT | /api/v1/faq/:id | findAll | JwtGuard, RolesGuard; Roles: Role.Admin, Role.Operator |
| GET | /api/v1/faq/client | clientFaq | Public/Unspecified |
| POST | /api/v1/faq/module | createModule | JwtGuard, RolesGuard; Roles: Role.Admin, Role.Operator |
| PUT | /api/v1/faq/module | findAllModule | JwtGuard, RolesGuard; Roles: Role.Admin, Role.Operator |
| DELETE | /api/v1/faq/module/:id | removeModule | JwtGuard, RolesGuard; Roles: Role.Admin, Role.Operator |
| GET | /api/v1/faq/module/:id | findOneModule | JwtGuard, RolesGuard; Roles: Role.Admin, Role.Operator |
| PATCH | /api/v1/faq/module/:id | updateModule | JwtGuard, RolesGuard; Roles: Role.Admin, Role.Operator |

### src\feedback\feedback.controller.ts
| Method | Path | Handler | Auth |
|---|---|---|---|
| POST | /api/v1/feedback | create | JwtGuard |
| PUT | /api/v1/feedback | findAll | RolesGuard; Roles: Role.Admin, Role.Operator |
| DELETE | /api/v1/feedback/:id | remove | Public/Unspecified |
| GET | /api/v1/feedback/:id | GetOne | RolesGuard; Roles: Role.Admin, Role.Operator |
| PATCH | /api/v1/feedback/:id | update | RolesGuard; Roles: Role.Admin, Role.Operator |
| PUT | /api/v1/feedback/product/:id | findAllReview | Public/Unspecified |

### src\live\live.controller.ts
| Method | Path | Handler | Auth |
|---|---|---|---|
| POST | /api/v1/live | create | JwtGuard, AccountStatusGuard, ApprovalStatusGuard |
| PUT | /api/v1/live | findAll | Public/Unspecified |
| DELETE | /api/v1/live/:id | remove | Public/Unspecified |
| GET | /api/v1/live/:id | findOneBySeller | Public/Unspecified |
| PATCH | /api/v1/live/:id | update | Public/Unspecified |
| PUT | /api/v1/live/seller | findAllReels | RolesGuard; Roles: Role.Admin, Role.Operator |
| GET | /api/v1/live/seller/:id | findOne | Public/Unspecified |

### src\menu\menu.controller.ts
| Method | Path | Handler | Auth |
|---|---|---|---|
| GET | /api/v1/menu | findAll | Public/Unspecified |
| POST | /api/v1/menu | create | JwtGuard, RolesGuard; Roles: Role.Admin, Role.Operator |
| DELETE | /api/v1/menu/:id | remove | Public/Unspecified |
| PATCH | /api/v1/menu/:id | update | Public/Unspecified |
| POST | /api/v1/menu/type | createMenuType | JwtGuard, RolesGuard; Roles: Role.Admin, Role.Operator |
| PUT | /api/v1/menu/type | findAllMenuType | JwtGuard, RolesGuard; Roles: Role.Admin, Role.Operator |
| DELETE | /api/v1/menu/type/:id | removeType | JwtGuard, RolesGuard; Roles: Role.Admin, Role.Operator |
| GET | /api/v1/menu/type/:id | findOneMenuType | JwtGuard, RolesGuard; Roles: Role.Admin, Role.Operator |
| PATCH | /api/v1/menu/type/:id | updateType | JwtGuard, RolesGuard; Roles: Role.Admin, Role.Operator |
| GET | /api/v1/menu/type-by-slug/:slug | findOneMenuTypeBySlug | JwtGuard, RolesGuard; Roles: Role.Admin, Role.Operator |

### src\notification\notification.controller.ts
| Method | Path | Handler | Auth |
|---|---|---|---|
| DELETE | /api/v1/notification/:id | remove | Public/Unspecified |
| PATCH | /api/v1/notification/:id | update | Public/Unspecified |
| POST | /api/v1/notification/add-fcm | AddFCMToken | Public/Unspecified |
| POST | /api/v1/notification/email/send-all | sendEmailNotificationToAll | Public/Unspecified |
| GET | /api/v1/notification/in-app | findAll | Public/Unspecified |
| PUT | /api/v1/notification/list | notificationList | Public/Unspecified |
| POST | /api/v1/notification/order-place/:id | sendOrderPlaceNotification | Public/Unspecified |
| GET | /api/v1/notification/preference | getnotificationPreference | Public/Unspecified |
| POST | /api/v1/notification/preference | notificationPreference | JwtGuard |
| POST | /api/v1/notification/push/send-all | sendNotificationToAll | Public/Unspecified |
| POST | /api/v1/notification/send | sendNotification | Public/Unspecified |

### src\orders\orders.controller.ts
| Method | Path | Handler | Auth |
|---|---|---|---|
| POST | /api/v1/orders | create | JwtGuard |
| PUT | /api/v1/orders | findAll | RolesGuard, AccountStatusGuard; Roles: Role.Admin, Role.Operator |
| GET | /api/v1/orders/:id | findOne | RolesGuard, AccountStatusGuard; Roles: Role.Admin, Role.Operator |
| PATCH | /api/v1/orders/:id | update | RolesGuard, AccountStatusGuard; Roles: Role.Admin, Role.Operator |
| PUT | /api/v1/orders/get-return-orders | getAllReturnOrders | RolesGuard, AccountStatusGuard; Roles: Role.Admin, Role.Operator, Role.Seller |
| PUT | /api/v1/orders/get-seller-return-percentage | getAllReturnPercentageSellerWise | RolesGuard, AccountStatusGuard; Roles: Role.Admin, Role.Operator |
| PUT | /api/v1/orders/seller | findAllSellerOrders | RolesGuard, AccountStatusGuard; Roles: Role.Seller |
| GET | /api/v1/orders/seller/:id | findAllSellerOrdersById | RolesGuard, AccountStatusGuard; Roles: Role.Seller |
| GET | /api/v1/orders/seller/cancel/:id | CancelOrderCharges | RolesGuard, AccountStatusGuard; Roles: Role.Seller |
| POST | /api/v1/orders/seller/cancel/:id | SellerOrderCancel | RolesGuard, AccountStatusGuard; Roles: Role.Seller |
| PUT | /api/v1/orders/seller/return/:id | SellerOrderRetrurn | RolesGuard, AccountStatusGuard; Roles: Role.Seller |
| GET | /api/v1/orders/status | GetStatus | JwtGuard; Roles: Role.Admin, Role.Operator |
| PUT | /api/v1/orders/update-return-orders | updateReturnOrderAdmin | RolesGuard, AccountStatusGuard; Roles: Role.Admin, Role.Operator |

### src\otp\otp.controller.ts
| Method | Path | Handler | Auth |
|---|---|---|---|
| DELETE | /api/v1/otp/:id | remove | Public/Unspecified |
| GET | /api/v1/otp/:id | findOne | Public/Unspecified |
| POST | /api/v1/otp/send | sendOtp | Public/Unspecified |
| POST | /api/v1/otp/verify | verifyOtp | Public/Unspecified |

### src\product\product.controller.ts
| Method | Path | Handler | Auth |
|---|---|---|---|
| POST | /api/v1/product | create | JwtGuard, RolesGuard; Roles: Role.Admin, Role.Operator |
| PUT | /api/v1/product | findAll | Public/Unspecified |
| DELETE | /api/v1/product/:id | remove | Public/Unspecified |
| GET | /api/v1/product/:id | findOne | Public/Unspecified |
| PATCH | /api/v1/product/:id | update | Public/Unspecified |
| DELETE | /api/v1/product/image/:id | removeImage | Public/Unspecified |
| PATCH | /api/v1/product/image/:id | updateImages | Public/Unspecified |
| PATCH | /api/v1/product/status/:id | updateStatus | Public/Unspecified |

### src\reels\reels.controller.ts
| Method | Path | Handler | Auth |
|---|---|---|---|
| POST | /api/v1/reels | create | Public/Unspecified |
| PUT | /api/v1/reels | findAllBySeller | Public/Unspecified |
| DELETE | /api/v1/reels/:id | remove | Public/Unspecified |
| GET | /api/v1/reels/:id | findOneBySeller | Public/Unspecified |
| PATCH | /api/v1/reels/:id | FileFieldsInterceptor | Public/Unspecified |
| PUT | /api/v1/reels/seller | findAllReels | RolesGuard; Roles: Role.Admin, Role.Operator |
| DELETE | /api/v1/reels/seller/:id | removeReel | Public/Unspecified |
| GET | /api/v1/reels/seller/:id | findReels | RolesGuard; Roles: Role.Admin, Role.Operator |
| PATCH | /api/v1/reels/seller/:id | updateStatus | RolesGuard; Roles: Role.Admin, Role.Operator |
| GET | /api/v1/reels/stream/:id/:fileName | streamReel | Public/Unspecified |

### src\seller\seller.controller.ts
| Method | Path | Handler | Auth |
|---|---|---|---|
| GET | /api/v1/seller/attributes | findAttributes | Public/Unspecified |
| GET | /api/v1/seller/categories | findCategory | Public/Unspecified |
| POST | /api/v1/seller/create-pickup-address | createShippingAddress | Public/Unspecified |
| PUT | /api/v1/seller/pickup-address | findPickupAddress | Public/Unspecified |
| GET | /api/v1/seller/profile | findOne | Public/Unspecified |
| PATCH | /api/v1/seller/profile | FileFieldsInterceptor | Public/Unspecified |
| POST | /api/v1/seller/profile | FileFieldsInterceptor | JwtGuard, RolesGuard, AccountStatusGuard, ApprovalStatusGuard; Roles: Role.Seller, Role.Buyer |
| POST | /api/v1/seller/social-links | updateSocialLinks | Public/Unspecified |
| POST | /api/v1/seller/store-front | updateStoreFront | Public/Unspecified |

### src\seller-aggrement\seller-aggrement.controller.ts
| Method | Path | Handler | Auth |
|---|---|---|---|
| GET | /api/v1/seller-aggrement | findAll | Public/Unspecified |
| POST | /api/v1/seller-aggrement | create | JwtGuard, RolesGuard; Roles: Role.Admin |
| DELETE | /api/v1/seller-aggrement/:id | remove | JwtGuard, RolesGuard; Roles: Role.Admin |
| GET | /api/v1/seller-aggrement/:id | findOne | JwtGuard, RolesGuard; Roles: Role.Admin |
| PATCH | /api/v1/seller-aggrement/:id | update | JwtGuard, RolesGuard; Roles: Role.Admin |

### src\seller-product\seller-product.controller.ts
| Method | Path | Handler | Auth |
|---|---|---|---|
| POST | /api/v1/seller-product | create | JwtGuard, RolesGuard, AccountStatusGuard, ApprovalStatusGuard; Roles: Role.Seller |
| PUT | /api/v1/seller-product | findAll | Public/Unspecified |
| DELETE | /api/v1/seller-product/:id | remove | Public/Unspecified |
| GET | /api/v1/seller-product/:id | findOne | Public/Unspecified |
| PATCH | /api/v1/seller-product/:id | update | Public/Unspecified |
| DELETE | /api/v1/seller-product/image/:id | removeImage | Public/Unspecified |
| PATCH | /api/v1/seller-product/image/:id | updateImages | Public/Unspecified |

### src\settings\settings.controller.ts
| Method | Path | Handler | Auth |
|---|---|---|---|
| GET | /api/v1/settings | findAll | Public/Unspecified |
| POST | /api/v1/settings | create | Public/Unspecified |
| DELETE | /api/v1/settings/:id | remove | Public/Unspecified |
| PATCH | /api/v1/settings/:id | update | Public/Unspecified |
| GET | /api/v1/settings/payment | paymentSettings | Public/Unspecified |

### src\support-ticket\support-ticket.controller.ts
| Method | Path | Handler | Auth |
|---|---|---|---|
| GET | /api/v1/support-ticket | findAll | Public/Unspecified |
| POST | /api/v1/support-ticket | create | Public/Unspecified |
| DELETE | /api/v1/support-ticket/:id | remove | Public/Unspecified |
| GET | /api/v1/support-ticket/:id | findOne | Public/Unspecified |
| PATCH | /api/v1/support-ticket/:id | update | Public/Unspecified |

### src\user\user.controller.ts
| Method | Path | Handler | Auth |
|---|---|---|---|
| POST | /api/v1/users/change-password | changePasswod | JwtGuard |
| PUT | /api/v1/users/check-user | checkUser | Public/Unspecified |
| GET | /api/v1/users/me | getMe | JwtGuard |
| PATCH | /api/v1/users/profile | editUser | JwtGuard |

### src\wallet\wallet.controller.ts
| Method | Path | Handler | Auth |
|---|---|---|---|
| POST | /api/v1/wallet | create | JwtGuard |
| DELETE | /api/v1/wallet/:id | remove | Public/Unspecified |
| GET | /api/v1/wallet/:id | findOne | Public/Unspecified |
| PATCH | /api/v1/wallet/:id | update | Public/Unspecified |
| PUT | /api/v1/wallet/admin | adminWallet | RolesGuard; Roles: Role.Admin |
| GET | /api/v1/wallet/request/export | exportWithdrawalRequest | RolesGuard; Roles: Role.Admin |
| GET | /api/v1/wallet/seller | sellerWallet | JwtGuard; Roles: Role.Seller |
| PUT | /api/v1/wallet/seller/transactions | sellerWalletTransactions | RolesGuard; Roles: Role.Seller |
| PUT | /api/v1/wallet/seller/withdraw-request | sellerWithdrawalRequests | RolesGuard; Roles: Role.Seller |
| POST | /api/v1/wallet/withdraw-request | sellerWalletWithdrawalRequest | RolesGuard; Roles: Role.Seller |
| PUT | /api/v1/wallet/withdraw-request | withdrawalRequestList | RolesGuard; Roles: Role.Admin |
| PATCH | /api/v1/wallet/withdraw-request/:id | approveWithdrawalRequest | RolesGuard; Roles: Role.Admin |

### src\webhook\webhook.controller.ts
| Method | Path | Handler | Auth |
|---|---|---|---|
| GET | /api/v1/webhook | findAll | Public/Unspecified |
| DELETE | /api/v1/webhook/:id | remove | Public/Unspecified |
| GET | /api/v1/webhook/:id | findOne | Public/Unspecified |
| PATCH | /api/v1/webhook/:id | update | Public/Unspecified |
| POST | /api/v1/webhook/razorpay | razorpayWebhook | Public/Unspecified |

## 8. Known Technical Notes
- Webhook route /api/v1/webhook/razorpay is mounted with raw body parser in main.ts for signature verification.
- JWT is extracted from cookie, not Authorization header.
- Media uploads are disk-based (multer) and served statically from /uploads.
- Some route structures use empty base controller paths and leading slashes; effective URL remains under /api/v1.

## 9. Documentation Scope
This document is generated from the current repository code state and reflects active routes. Commented-out controllers/endpoints are excluded.
