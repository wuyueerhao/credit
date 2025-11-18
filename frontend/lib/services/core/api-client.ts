import axios, { AxiosError, AxiosResponse, CancelTokenSource, InternalAxiosRequestConfig } from 'axios';
import { apiConfig } from './config';
import {
  ApiErrorBase,
  NetworkError,
  TimeoutError,
  ForbiddenError,
  NotFoundError,
  ServerError,
  ValidationError,
} from './errors';
import { ApiError, ApiResponse } from './types';

/**
 * API 客户端实例
 * 统一处理请求配置、响应解析和错误处理
 */
const apiClient = axios.create({
  baseURL: apiConfig.baseURL,
  timeout: apiConfig.timeout,
  withCredentials: apiConfig.withCredentials,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * 请求取消令牌存储
 */
const cancelTokens = new Map<string, CancelTokenSource>();

/**
 * 生成请求的唯一键
 * 包含方法、URL 和请求数据的哈希，确保不同参数的请求不会被误取消
 */
function getRequestKey(config: { method?: string; url?: string; data?: unknown }): string {
  const baseKey = `${config.method?.toUpperCase()}_${config.url}`;
  
  // 序列化加入键中
  if (config.data) {
    try {
      const dataHash = JSON.stringify(config.data);
      return `${baseKey}_${dataHash}`;
    } catch {
      // 失败使用基础键
      return baseKey;
    }
  }
  
  return baseKey;
}

/**
 * 请求拦截器
 * 添加取消令牌和其他配置
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 为每个请求创建取消令牌
    const requestKey = getRequestKey(config);
    
    // 如果存在相同的请求，取消之前的
    if (cancelTokens.has(requestKey)) {
      const source = cancelTokens.get(requestKey);
      source?.cancel('请求已被取消');
    }

    // 创建新的取消令牌
    const source = axios.CancelToken.source();
    config.cancelToken = source.token;
    cancelTokens.set(requestKey, source);

    return config;
  },
  (error: unknown) => Promise.reject(error),
);

/**
 * 直接启动登录流程
 * @param currentPath - 当前路径，用于登录成功后重定向回来
 */
function initiateLogin(currentPath: string): Promise<never> {
  // 防止循环重定向
  if (!currentPath.startsWith('/login') && !currentPath.startsWith('/callback')) {
    // 将当前路径保存到 sessionStorage，登录后重定向
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('redirect_after_login', currentPath);
      window.location.href = '/login';
    }
  }

  // 返回永不解决的 Promise
  return new Promise<never>(() => {});
}

/**
 * 响应拦截器
 * 处理 API 响应和统一错误处理
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    // 清除对应的取消令牌
    const requestKey = getRequestKey(response.config);
    cancelTokens.delete(requestKey);
    return response;
  },
  (error: AxiosError<ApiError>) => {
    // 清除对应的取消令牌
    if (error.config) {
      const requestKey = getRequestKey(error.config);
      cancelTokens.delete(requestKey);
    }

    // 请求被取消时静默处理
    if (axios.isCancel(error)) {
      // 特殊的取消错误对象
      const cancelError = new Error(error.message || '请求已被取消') as Error & { __CANCEL__?: boolean };
      cancelError.__CANCEL__ = true;
      return Promise.reject(cancelError);
    }

    // 401 未授权错误
    if (error.response?.status === 401) {
      return initiateLogin(window.location.pathname);
    }

    // 403 权限不足错误
    if (error.response?.status === 403) {
      return Promise.reject(
        new ForbiddenError(error.response.data?.error_msg || '权限不足'),
      );
    }

    // 404 资源未找到错误
    if (error.response?.status === 404) {
      return Promise.reject(
        new NotFoundError(error.response.data?.error_msg || '请求的资源不存在'),
      );
    }

    // 400 验证错误
    if (error.response?.status === 400) {
      return Promise.reject(
        new ValidationError(
          error.response.data?.error_msg || '请求参数验证失败',
          error.response.data?.details,
        ),
      );
    }

    // 5xx 服务器错误
    if (error.response && error.response.status >= 500) {
      return Promise.reject(
        new ServerError(
          error.response.data?.error_msg || '服务器内部错误，请稍后重试',
          error.response.status,
        ),
      );
    }

    // 网络超时错误
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return Promise.reject(new TimeoutError());
    }

    // 网络连接错误（ECONNREFUSED, ERR_NETWORK 等）
    if (
      !error.response ||
      error.code === 'ECONNREFUSED' ||
      error.code === 'ERR_NETWORK' ||
      error.message?.includes('Network Error') ||
      error.message?.includes('Failed to fetch')
    ) {
      return Promise.reject(
        new NetworkError('无法连接到服务器，请确认后端服务已启动'),
      );
    }

    // 其他后端返回的错误
    if (error.response?.data?.error_msg) {
      return Promise.reject(
        new ApiErrorBase(
          error.response.data.error_msg,
          error.response.data.error_code,
          error.response.status,
          error.response.data.details,
        ),
      );
    }

    // 兜底错误
    return Promise.reject(
      new ApiErrorBase(error.message || '网络请求失败'),
    );
  },
);

/**
 * 取消指定请求
 * @param method - 请求方法
 * @param url - 请求 URL
 */
export function cancelRequest(method: string, url: string): void {
  const requestKey = `${method.toUpperCase()}_${url}`;
  const source = cancelTokens.get(requestKey);
  if (source) {
    source.cancel('请求已被手动取消');
    cancelTokens.delete(requestKey);
  }
}

/**
 * 取消所有请求
 */
export function cancelAllRequests(): void {
  cancelTokens.forEach((source) => {
    source.cancel('所有请求已被取消');
  });
  cancelTokens.clear();
}

export default apiClient;

