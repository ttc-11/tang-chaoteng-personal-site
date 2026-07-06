# Cloudflare Pages Setup

这个站点已经准备好部署到 Cloudflare Pages，并保留企业留言 -> 飞书的能力。

## 重要说明

你的当前 API token 不能直接用于 Pages API 自动部署。

我测试到：

- 账号查询可以返回结果
- 但 Pages API 返回 `Authentication error`

所以最快的方式不是继续走 token 自动化，而是直接用 Cloudflare Dashboard 里的 **Pages + Git integration**。

## 为什么不用 Dashboard 的 drag and drop

Cloudflare 官方文档说明：

- Pages Functions 通过项目根目录下的 `/functions` 目录进行文件路由
- Dashboard 的 direct upload / drag and drop 当前**不支持带 Functions 的项目**

所以你这个站点如果要保留“企业留言发飞书”，最稳的是：

1. 把这个目录推到 GitHub
2. 在 Cloudflare Dashboard 里用 Pages 导入 GitHub 仓库

## 需要上传的目录

把这个目录作为仓库内容即可：

`outputs/personal-intro-site/`

## Dashboard 配置

1. 打开 Cloudflare Dashboard
2. 进入 `Workers & Pages`
3. 选择 `Create application`
4. 选择 `Pages`
5. 选择 `Import an existing Git repository`
6. 选中你的 GitHub 仓库

构建配置：

- Framework preset: `None`
- Build command: 留空
- Build output directory: `.`
- Root directory: 仓库根目录如果就是本站点则留空；如果它是子目录，就填对应子目录

环境变量：

- `FEISHU_WEBHOOK_URL` = 你的飞书 webhook

## 部署完成后

Cloudflare 会给你一个类似下面的公开网址：

`https://your-project-name.pages.dev`

这个网址可以直接发给别人，电脑和手机都能打开。

## 相关官方文档

- Direct Upload: https://developers.cloudflare.com/pages/get-started/direct-upload/
- Pages Functions: https://developers.cloudflare.com/pages/functions/
- Functions Routing: https://developers.cloudflare.com/pages/functions/routing/
- Functions Get Started: https://developers.cloudflare.com/pages/functions/get-started/
- Environment Variables / Bindings: https://developers.cloudflare.com/pages/functions/bindings/
- Git integration: https://developers.cloudflare.com/pages/configuration/git-integration/

