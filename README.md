# 校园微信小程序商城（单商家版）

本项目包含完整的校园商城实现，支持用户端与商家端两种角色：

- 后端：Node.js + Express + MySQL 5.7+
- 前端：微信小程序原生（WXML + WXSS + JavaScript）
- 数据库：`campus_shop`

## 目录结构

```text
wxwssc4
├─ backend                      # Node.js 后端
│  ├─ src
│  │  ├─ config                 # 数据库配置
│  │  ├─ middleware             # 认证与错误处理中间件
│  │  ├─ routes                 # RESTful 路由
│  │  ├─ utils                  # 工具函数
│  │  ├─ app.js
│  │  └─ server.js
│  ├─ .env.example
│  └─ package.json
├─ miniprogram                  # 微信小程序项目
│  ├─ pages                     # 用户端 + 商家端页面
│  ├─ utils                     # request/auth 工具
│  ├─ app.js
│  ├─ app.json
│  └─ app.wxss
└─ database
   └─ campus_shop.sql           # 建表 + 初始化数据
```

## 1. 数据库初始化

1. 创建数据库并导入 SQL：

```sql
source /你的路径/wxwssc4/database/campus_shop.sql;
```

2. 已预置商家账号：

- 账号：`admin`
- 密码：`123456`

## 2. 启动后端

1. 进入后端目录并安装依赖：

```bash
cd backend
npm install
```

2. 配置环境变量：

- 复制 `backend/.env.example` 为 `backend/.env`
- 按本机 MySQL 账号密码修改：
  - `DB_HOST`
  - `DB_PORT`
  - `DB_USER`
  - `DB_PASSWORD`
  - `DB_NAME`
  - `JWT_SECRET`

3. 启动服务：

```bash
npm run dev
```

默认端口：`3000`，健康检查：`GET http://localhost:3000/health`

## 3. 导入小程序

1. 打开微信开发者工具，导入 `miniprogram` 目录。
2. 在开发者工具中勾选“不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书”。
3. 默认请求地址在 `miniprogram/app.js`：

```js
baseURL: 'http://localhost:3000'
```

如后端端口有变化，请同步修改。

## 4. 功能清单

### 用户端

- 注册/登录
- 商品浏览、分类筛选、搜索、商品详情
- 购物车增删改查、全选/多选结算
- 下单、模拟支付、取消订单、订单详情
- 订单评价（按商品评价，支持最多9图路径）
- 在线客服消息与商家回复查看

### 商家端

- 固定账号登录（admin/123456）
- 商品管理（增删改查、上下架、库存）
- 订单管理（列表筛选、详情、状态流转）
- 数据统计（今日收入、订单数、总商品数、热销、品类销量、近7天趋势）
- 客服管理（待回复优先、回复用户消息）

## 5. 后端 API 概览

- 认证：
  - `POST /api/auth/register`
  - `POST /api/auth/login`
- 用户端（token + role=user）：
  - 商品：`GET /api/products`、`GET /api/products/:id`、`GET /api/categories`
  - 购物车：`POST /api/cart`、`GET /api/cart`、`PUT /api/cart`、`DELETE /api/cart`
  - 订单：`POST /api/orders`、`GET /api/orders`、`GET /api/orders/:id`、`PUT /api/orders/:id/pay`、`PUT /api/orders/:id/cancel`
  - 评价：`POST /api/reviews`、`GET /api/products/:id/reviews`
  - 客服：`POST /api/messages`、`GET /api/messages`
- 商家端（token + role=merchant）：
  - 商品管理：`GET/POST /api/admin/products`、`PUT/DELETE /api/admin/products/:id`
  - 订单管理：`GET /api/admin/orders`、`GET /api/admin/orders/:id`、`PUT /api/admin/orders/:id/status`
  - 统计：`GET /api/admin/stats`
  - 客服：`GET /api/admin/messages`、`POST /api/admin/messages/:id/reply`

## 6. 状态流转说明

- 用户下单：`待支付`
- 用户支付：`待配送`（记录支付时间）
- 商家发货：`配送中`（记录配送开始时间）
- 商家完成：`已完成`（记录送达时间）

## 7. 注意事项

- 后端已做常见错误处理：参数缺失、权限不足、token 无效、状态非法。
- 商品销量在商家将订单更新为“已完成”时累计。
- 购物车仅结算勾选商品，成功下单后会移除对应购物车项。
