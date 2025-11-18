import { BaseService } from '../core/base.service';
import type {
  MerchantAPIKey,
  CreateAPIKeyRequest,
  UpdateAPIKeyRequest,
  CreateMerchantOrderRequest,
  CreateMerchantOrderResponse,
  PayMerchantOrderRequest,
  GetMerchantOrderRequest,
  GetMerchantOrderResponse,
} from './types';

/**
 * 商户服务
 * 处理商户 API Key 管理和支付订单相关的 API 请求
 */
export class MerchantService extends BaseService {
  protected static readonly basePath = '/api/v1/merchant';

  // ==================== API Key 管理 ====================

  /**
   * 创建商户 API Key
   * @param request - 创建 API Key 的请求参数
   * @returns 创建的 API Key 信息（包含 client_secret）
   * @throws {UnauthorizedError} 当未登录时
   * @throws {ValidationError} 当参数验证失败时
   * 
   * @example
   * ```typescript
   * const apiKey = await MerchantService.createAPIKey({
   *   app_name: '我的应用',
   *   app_homepage_url: 'https://example.com',
   *   app_description: '应用描述',
   *   redirect_uri: 'https://example.com/callback'
   * });
   * console.log('Client ID:', apiKey.client_id);
   * console.log('Client Secret:', apiKey.client_secret); // 请保存，之后无法再次获取
   * ```
   */
  static async createAPIKey(request: CreateAPIKeyRequest): Promise<MerchantAPIKey> {
    return this.post<MerchantAPIKey>('/api-keys', request);
  }

  /**
   * 获取商户 API Key 列表
   * @returns API Key 列表
   * @throws {UnauthorizedError} 当未登录时
   * 
   * @example
   * ```typescript
   * const apiKeys = await MerchantService.listAPIKeys();
   * console.log('API Keys 数量:', apiKeys.length);
   * ```
   */
  static async listAPIKeys(): Promise<MerchantAPIKey[]> {
    return this.get<MerchantAPIKey[]>('/api-keys');
  }

  /**
   * 获取单个商户 API Key
   * @param id - API Key ID
   * @returns API Key 详细信息
   * @throws {UnauthorizedError} 当未登录时
   * @throws {NotFoundError} 当 API Key 不存在时
   * @throws {ForbiddenError} 当无权访问该 API Key 时
   * 
   * @example
   * ```typescript
   * const apiKey = await MerchantService.getAPIKey(123);
   * console.log('应用名称:', apiKey.app_name);
   * ```
   */
  static async getAPIKey(id: number): Promise<MerchantAPIKey> {
    return this.get<MerchantAPIKey>(`/api-keys/${id}`);
  }

  /**
   * 更新商户 API Key
   * @param id - API Key ID
   * @param request - 更新 API Key 的请求参数
   * @returns void
   * @throws {UnauthorizedError} 当未登录时
   * @throws {NotFoundError} 当 API Key 不存在时
   * @throws {ForbiddenError} 当无权访问该 API Key 时
   * @throws {ValidationError} 当参数验证失败时
   * 
   * @example
   * ```typescript
   * await MerchantService.updateAPIKey(123, {
   *   app_name: '新的应用名称',
   *   app_description: '新的描述'
   * });
   * ```
   */
  static async updateAPIKey(
    id: number,
    request: UpdateAPIKeyRequest,
  ): Promise<void> {
    return this.put<void>(`/api-keys/${id}`, request);
  }

  /**
   * 删除商户 API Key
   * @param id - API Key ID
   * @returns void
   * @throws {UnauthorizedError} 当未登录时
   * @throws {NotFoundError} 当 API Key 不存在时
   * @throws {ForbiddenError} 当无权访问该 API Key 时
   * 
   * @example
   * ```typescript
   * await MerchantService.deleteAPIKey(123);
   * ```
   */
  static async deleteAPIKey(id: number): Promise<void> {
    return this.delete<void>(`/api-keys/${id}`);
  }

  // ==================== 商户支付订单 ====================

  /**
   * 创建商户订单
   * 
   * @description
   * 此接口用于商户创建支付订单，需要使用商户凭证（ClientID:ClientSecret）进行认证。
   * 返回的 pay_url 可以提供给用户进行支付。
   * 订单有效期根据系统配置确定（通常为5分钟）。
   * 
   * @param request - 创建订单请求参数
   * @param clientId - 商户的 Client ID
   * @param clientSecret - 商户的 Client Secret
   * @returns 订单信息（包含订单ID和支付URL）
   * @throws {UnauthorizedError} 当商户凭证无效时
   * @throws {ValidationError} 当参数验证失败时
   * 
   * @example
   * ```typescript
   * const order = await MerchantService.createMerchantOrder(
   *   {
   *     order_name: '商品购买',
   *     amount: 99.99,
   *     remark: '订单备注'
   *   },
   *   'your_client_id',
   *   'your_client_secret'
   * );
   * 
   * console.log('订单ID:', order.order_id);
   * console.log('支付链接:', order.pay_url); // 提供给用户支付
   * ```
   * 
   * @remarks
   * - 金额必须大于 0
   * - 金额最多支持 2 位小数
   * - 订单在 5 分钟后自动过期
   */
  static async createMerchantOrder(
    request: CreateMerchantOrderRequest,
    clientId: string,
    clientSecret: string,
  ): Promise<CreateMerchantOrderResponse> {
    // 使用 Basic Auth 格式：ClientID:ClientSecret
    const auth = `${clientId}:${clientSecret}`;
    const encodedAuth = btoa(auth);

    return this.post<CreateMerchantOrderResponse>('/payment/orders', request, {
      headers: {
        Authorization: `Basic ${encodedAuth}`,
      },
    });
  }

  /**
   * 查询商户订单信息
   *
   * @description
   * 查询商户创建的订单详细信息，用于支付页面显示订单信息。
   * 订单必须处于待支付状态。
   *
   * @param request - 查询订单请求参数
   * @returns 订单信息和用户支付配置
   * @throws {UnauthorizedError} 当用户未登录时
   * @throws {NotFoundError} 当订单不存在时
   * @throws {ValidationError} 当订单号格式错误时
   * @throws {ApiErrorBase} 当订单已过期或已支付等业务错误时
   *
   * @example
   * ```typescript
   * // 从 URL 获取订单号
   * const params = new URLSearchParams(window.location.search);
   * const orderNo = params.get('order_no');
   *
   * if (orderNo) {
   *   try {
   *     const orderInfo = await MerchantService.getMerchantOrder({ order_no: orderNo });
   *     console.log('订单信息:', orderInfo.order);
   *     console.log('支付配置:', orderInfo.user_pay_config);
   *   } catch (error) {
   *     console.error('查询订单失败:', error.message);
   *   }
   * }
   * ```
   *
   * @remarks
   * - 订单必须处于待支付状态
   * - 返回的用户支付配置包含手续费率等信息
   */
  static async getMerchantOrder(request: GetMerchantOrderRequest): Promise<GetMerchantOrderResponse> {
    return this.get<GetMerchantOrderResponse>('/payment/order', { order_no: request.order_no });
  }

  /**
   * 支付商户订单
   *
   * @description
   * 用户使用此接口支付商户创建的订单。
   * 需要用户登录，并且用户余额充足。
   *
   * @param request - 支付订单请求参数
   * @returns void
   * @throws {UnauthorizedError} 当用户未登录时
   * @throws {NotFoundError} 当订单不存在或已过期时
   * @throws {ValidationError} 当订单号格式错误时
   * @throws {ApiErrorBase} 当余额不足、订单已支付等业务错误时
   *
   * @example
   * ```typescript
   * // 从 URL 获取订单号
   * const params = new URLSearchParams(window.location.search);
   * const orderNo = params.get('order_no');
   *
   * if (orderNo) {
   *   try {
   *     await MerchantService.payMerchantOrder({
   *       order_no: orderNo,
   *       pay_key: '123456'  // 用户的支付密码
   *     });
   *     // 支付成功
   *     console.log('支付成功');
   *   } catch (error) {
   *     console.error('支付失败:', error.message);
   *   }
   * }
   * ```
   *
   * @remarks
   * - 用户不能支付自己作为商户创建的订单
   * - 订单必须在有效期内（5分钟）
   * - 用户余额必须充足
   * - 支付成功后会扣除手续费（根据用户的支付等级）
   */
  static async payMerchantOrder(request: PayMerchantOrderRequest): Promise<void> {
    return this.post<void>('/payment', request);
  }
}

