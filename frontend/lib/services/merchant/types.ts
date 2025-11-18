/**
 * 商户 API Key 信息
 */
export interface MerchantAPIKey {
  /** API Key ID */
  id: number;
  /** 用户 ID */
  user_id: number;
  /** 客户端 ID */
  client_id: string;
  /** 客户端密钥 */
  client_secret: string;
  /** 应用名称 */
  app_name: string;
  /** 应用主页 URL */
  app_homepage_url: string;
  /** 应用描述 */
  app_description: string;
  /** 重定向 URI */
  redirect_uri: string;
  /** 创建时间 */
  created_at: string;
  /** 更新时间 */
  updated_at: string;
  /** 删除时间（软删除） */
  deleted_at: string | null;
}

/**
 * 创建商户 API Key 请求参数
 */
export interface CreateAPIKeyRequest {
  /** 应用名称（最大20字符） */
  app_name: string;
  /** 应用主页 URL（最大100字符，必须是有效的 URL） */
  app_homepage_url: string;
  /** 应用描述（最大100字符，可选） */
  app_description?: string;
  /** 重定向 URI（最大100字符，必须是有效的 URL） */
  redirect_uri: string;
}

/**
 * 更新商户 API Key 请求参数
 */
export interface UpdateAPIKeyRequest {
  /** 应用名称（最大20字符，可选） */
  app_name?: string;
  /** 应用主页 URL（最大100字符，必须是有效的 URL，可选） */
  app_homepage_url?: string;
  /** 应用描述（最大100字符，可选） */
  app_description?: string;
  /** 重定向 URI（最大100字符，必须是有效的 URL，可选） */
  redirect_uri?: string;
}

/**
 * 创建商户订单请求参数
 */
export interface CreateMerchantOrderRequest {
  /** 订单名称（最大64字符） */
  order_name: string;
  /** 订单金额（必须大于0，最多2位小数） */
  amount: number | string;
  /** 备注（最大200字符，可选） */
  remark?: string;
}

/**
 * 创建商户订单响应
 */
export interface CreateMerchantOrderResponse {
  /** 订单 ID */
  order_id: number;
  /** 支付 URL */
  pay_url: string;
}

/**
 * 支付商户订单请求参数
 */
export interface PayMerchantOrderRequest {
  /** 订单号（加密后的订单ID） */
  order_no: string;
  /** 支付密码（6位数字） */
  pay_key: string;
}

/**
 * 查询商户订单请求参数
 */
export interface GetMerchantOrderRequest {
  /** 订单号（加密后的订单ID） */
  order_no: string;
}

/**
 * 查询商户订单响应
 */
export interface GetMerchantOrderResponse {
  /** 订单信息 */
  order: {
    /** 订单ID */
    id: number;
    /** 订单号 */
    order_no: string;
    /** 订单名称 */
    order_name: string;
    /** 付款方用户名 */
    payer_username: string;
    /** 收款方用户名 */
    payee_username: string;
    /** 交易金额 */
    amount: string;
    /** 订单状态 */
    status: string;
    /** 订单类型 */
    type: string;
    /** 备注 */
    remark: string;
    /** 客户端ID */
    client_id: string;
    /** 交易时间 */
    trade_time: string | null;
    /** 创建时间 */
    created_at: string;
    /** 更新时间 */
    updated_at: string;
  };
  /** 用户支付配置信息 */
  user_pay_config: {
    /** 配置ID */
    id: number;
    /** 支付等级 */
    level: number;
    /** 最低分数 */
    min_score: number;
    /** 最高分数 */
    max_score: number | null;
    /** 每日限额 */
    daily_limit: number | null;
    /** 手续费率 */
    fee_rate: string;
    /** 创建时间 */
    created_at: string;
    /** 更新时间 */
    updated_at: string;
  };
  /** 商户信息 */
  merchant: {
    /** 应用名称 */
    app_name: string;
  };
}

