# 常见问题 (FAQ)

## 安装相关

### 国内网络安装慢或超时

安装脚本会自动检测网络环境并切换镜像。如果仍有问题，手动指定：

```bash
OCM_MIRROR=https://registry.npmmirror.com \
OCM_NODE_MIRROR=https://npmmirror.com/mirrors/node/ \
curl -fsSL https://raw.githubusercontent.com/xpangjia/ocm/main/install.sh | bash
```

也可以使用 Gitee 镜像源：

```bash
curl -fsSL https://gitee.com/xpangjia/ocm/raw/main/install.sh | bash
```

### Node.js 版本不满足要求

OCM 需要 Node.js >= 22。安装脚本会自动通过 fnm 安装。手动升级：

```bash
# 如果你用 fnm
fnm install 22 && fnm use 22

# 如果你用 nvm
nvm install 22 && nvm use 22
```

### npm install -g ocm 报权限错误

```bash
# 方式一：使用 sudo（不推荐）
sudo npm install -g ocm

# 方式二：修改 npm 全局目录（推荐）
mkdir -p ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.zshrc
source ~/.zshrc
npm install -g ocm
```

### macOS 安装时 sharp 编译失败

OCM 本身不依赖 sharp，这通常是 OpenClaw 的问题。安装脚本已自动设置 `SHARP_IGNORE_GLOBAL_LIBVIPS=1` 环境变量来跳过此问题。

## 模型相关

### 如何切换模型

```bash
# 交互式选择（推荐）
ocm model switch

# 直接切换到指定提供商
ocm model switch deepseek

# 查看当前使用的模型
ocm model current
```

### 如何添加新的模型提供商

```bash
ocm model add
# 按照交互引导选择提供商、填入 API Key
```

### API Key 验证失败

1. 确认 Key 格式正确（无多余空格）
2. 确认 Key 未过期且余额充足
3. 确认网络能访问对应的 API 地址
4. 使用 `ocm doctor` 诊断网络连通性

### 模型切换后没有生效

切换会自动重启 Gateway。如果仍未生效，手动重启：

```bash
ocm restart
```

## 渠道相关

### Telegram Bot Token 在哪获取

1. 在 Telegram 中找到 [@BotFather](https://t.me/BotFather)
2. 发送 `/newbot`，按提示设置名称
3. 获取 Token（格式：`123456:ABC-DEF...`）
4. 运行 `ocm channel add` 并选择 Telegram

### Discord Bot Token 在哪获取

1. 访问 [Discord Developer Portal](https://discord.com/developers/applications)
2. 创建 Application → Bot
3. 复制 Token
4. 将 Bot 邀请到你的服务器

### 飞书机器人怎么配置

1. 访问 [飞书开放平台](https://open.feishu.cn/)
2. 创建自建应用
3. 获取 App ID 和 App Secret
4. 运行 `ocm channel add` 并选择飞书

## 运维相关

### 如何查看 Gateway 日志

```bash
# 查看最近 50 行
ocm logs

# 查看最近 200 行
ocm logs --tail 200
```

### 如何备份和恢复配置

```bash
# 创建备份
ocm backup

# 查看备份列表
ocm backup list

# 恢复（支持序号或时间戳关键词）
ocm backup restore 0
```

### Gateway 端口被占用

```bash
# 检查谁占用了端口
lsof -i :18789

# 强制停止后重启
ocm stop
ocm restart
```

### 配置文件在哪里

- OCM 配置：`~/.ocm/config.json`
- 提供商配置：`~/.ocm/providers.json`
- 渠道配置：`~/.ocm/channels.json`
- OpenClaw 配置：`~/.openclaw/openclaw.json`
- 备份目录：`~/.ocm/backups/`

### 如何完全卸载

```bash
# 卸载 OCM
npm uninstall -g ocm

# 删除 OCM 配置（可选）
rm -rf ~/.ocm

# 卸载 OpenClaw（可选）
npm uninstall -g openclaw
rm -rf ~/.openclaw
```

## 支持的操作系统

- macOS（Apple Silicon / Intel）
- Linux（x64 / arm64）
- Windows：通过 WSL 使用
