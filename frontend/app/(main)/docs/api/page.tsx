
import { MarkdownRenderer } from "@/components/common/docs/markdown-renderer";
import { TableOfContents } from "@/components/common/docs/toc";

const API_DOC = `
# 官方支付接口
> 官方支付接口暂未上限，敬请期待

---


# 易支付兼容接口
> 兼容易支付、CodePay、VPay 等支付接口

## 概览
- 协议：EasyPay / CodePay / VPay 兼容字段
- 支付方式：仅支持 \`type=epay\`
- 网关基址：\`https://pay.linux.do/api\`
- 订单有效期：取系统配置 \`merchant_order_expire_minutes\`（平台端设置）

## 常见错误速查
- \`不支持的请求类型\`：\`type\` 仅允许 \`epay\`
- \`签名验证失败\`：参与签名字段与请求体需一致，密钥直接拼接
- \`金额必须大于0\` / \`金额小数位数不能超过2位\`
- \`订单已过期\`：超出系统配置有效期
- \`订单不存在或已完成\`：订单号错误、已退款或已完成
- \`余额不足\`：收银台支付时用户余额不足

## 对接流程
1) 控制台创建 API Key，记录 \`pid\`、\`key\`，配置回调地址  
2) 按“签名算法”生成 \`sign\`，调用 \`/pay/submit.php\` 创建订单并跳转收银台  
3) 可通过 \`/api.php\` 轮询结果，或等待异步回调  
4) 需要退款时，携带同一 \`trade_no\` 和原金额调用退款接口  
5) 回调验签通过后返回 \`success\` 完成闭环

## 1. 鉴权与签名
### 1.1 API Key
- \`pid\`：商户 ClientID
- \`key\`：商户 ClientSecret（妥善保管）
- \`notify_url\`：商户回调地址, 使用创建的商户 APP 为 \`notify_url\`；请求体中的 \`notify_url\` 仅参与签名，不会覆盖后台配置。

### 1.2 签名算法
1) 取所有非空参数，排除 \`sign\`、\`sign_type\`  
2) 按参数名 ASCII 升序，拼成 \`k1=v1&k2=v2\`  
3) 在末尾**直接追加**商户密钥：\`k1=v1&k2=v2${"{secret}"}\`  
4) 对整体做 MD5，取小写十六进制作为 \`sign\`

示例：
\`\`\`bash
payload="money=10.00&name=月度会员&out_trade_no=M202501010001&pid=10001&type=epay"
sign=$(echo -n "\${payload}\${SECRET}" | md5)  # 输出小写
\`\`\`

## 2. 创建支付订单
- 方法：POST \`/pay/submit.php\`
- 编码：\`application/x-www-form-urlencoded\`
- 成功：验签通过后创建订单并跳转到收银台（Location=\`FrontendPayURL?order_no=...\`）
- 失败：返回 JSON \`{"error_msg":"...", "data":null}\`

| 参数 | 必填 | 说明 |
| :-- | :-- | :-- |
| \`pid\` | 是 | 商户 ClientID |
| \`type\` | 是 | 固定 \`epay\` |
| \`out_trade_no\` | 否 | 商户订单号，建议全局唯一 |
| \`name\` | 是 | 标题，≤64 字符 |
| \`money\` | 是 | >0，最多 2 位小数 |
| \`notify_url\` | 否 | 仅参与签名 |
| \`return_url\` | 否 | 仅参与签名 |
| \`device\` | 否 | 终端标识 |
| \`sign\` | 是 | MD5 签名 |
| \`sign_type\` | 否 | 仅支持 \`MD5\` |

请求示例：
\`\`\`bash
curl -X POST https://pay.linux.do/api/pay/submit.php \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -d "pid=10001" \\
  -d "type=epay" \\
  -d "out_trade_no=M202501010001" \\
  -d "name=月度会员" \\
  -d "money=10.00" \\
  -d "sign=\${SIGN}" \\
  -d "sign_type=MD5"
\`\`\`

## 3. 订单查询
- 方法：GET \`/api.php\`
- 认证：\`pid\` + \`key\`
- 说明：\`trade_no\`（系统订单号）必填；\`out_trade_no\` 兼容字段；\`act\` 可传 \`order\`，后端不强校验。

| 参数 | 必填 | 说明 |
| :-- | :-- | :-- |
| \`act\` | 否 | 兼容字段，建议 \`order\` |
| \`pid\` | 是 | 商户 ClientID |
| \`key\` | 是 | 商户 ClientSecret |
| \`trade_no\` | 是 | 系统订单号 |
| \`out_trade_no\` | 否 | 商户订单号 |

成功响应：
\`\`\`json
{
  "code": 1,
  "msg": "查询订单号成功！",
  "trade_no": "123456",
  "out_trade_no": "M202501010001",
  "type": "epay",
  "pid": "10001",
  "addtime": "2025-01-01 12:00:00",
  "endtime": "2025-01-01 12:01:30",
  "name": "月度会员",
  "money": "10.00",
  "status": 1
}
\`\`\`

补充：\`status\` 1=成功，0=未支付或不存在；不存在会返回 HTTP 404 且 \`{"code":-1,"msg":"订单不存在或已完成"}\`。

## 4. 订单退款
- 方法：POST \`/api.php\`
- 编码：\`application/json\` 或 \`application/x-www-form-urlencoded\`
- 限制：仅支持已支付订单的**全额退款**。

| 参数 | 必填 | 说明 |
| :-- | :-- | :-- |
| \`pid\` | 是 | 商户 ClientID |
| \`key\` | 是 | 商户 ClientSecret |
| \`trade_no\` | 是 | 系统订单号 |
| \`money\` | 是 | 必须等于原订单金额 |
| \`out_trade_no\` | 否 | 商户订单号（兼容） |

响应：
\`\`\`json
{ "code": 1, "msg": "退款成功" }
\`\`\`
常见失败：订单不存在/未支付、金额不合法（<=0 或小数超过 2 位）。

## 5. 异步通知（支付成功）
- 触发：支付成功后；失败自动重试，最多 5 次（单次 30s 超时）
- 目标：商户后台配置的 \`notify_url\`
- 方式：HTTP GET

| 参数 | 说明 |
| :-- | :-- |
| \`pid\` | 商户 ClientID |
| \`trade_no\` | 系统订单号 |
| \`out_trade_no\` | 商户订单号 |
| \`type\` | 固定 \`epay\` |
| \`name\` | 订单标题 |
| \`money\` | 订单金额（两位小数） |
| \`trade_status\` | 固定 \`TRADE_SUCCESS\` |
| \`sign_type\` | \`MD5\` |
| \`sign\` | 按“签名算法”生成 |

商户需返回 HTTP 200 且响应体为 \`success\`（大小写不敏感），否则视为失败并继续重试。
`;

export default function ApiDocPage() {
  return (
    <div className="container max-w-8xl mx-auto px-4 py-8 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-10">
        <main className="min-w-0 pb-[60vh]">
          <MarkdownRenderer content={API_DOC} />
        </main>
        <aside className="hidden lg:block relative">
          <div className="sticky top-24">
            <TableOfContents content={API_DOC} />
          </div>
        </aside>
      </div>
    </div>
  );
}
