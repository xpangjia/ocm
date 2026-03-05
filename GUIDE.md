# OCM 使用与操作指南

> OCM (OpenClaw Manager) — 一站式安装和管理 OpenClaw 的命令行工具
> 支持 macOS / Linux / Windows 三平台

---

## 目录

- [安装](#安装)
- [快速开始](#快速开始)
- [命令详解](#命令详解)
  - [ocm init — 首次安装向导](#ocm-init)
  - [ocm model — 模型管理](#ocm-model)
  - [ocm channel — 渠道管理](#ocm-channel)
  - [ocm status — 运行状态](#ocm-status)
  - [ocm doctor — 环境诊断](#ocm-doctor)
  - [ocm restart / stop — 进程管理](#ocm-restart--stop)
  - [ocm update — 更新 OpenClaw](#ocm-update)
  - [ocm backup — 备份与恢复](#ocm-backup)
  - [ocm config — 配置管理](#ocm-config)
  - [ocm logs — 日志查看](#ocm-logs)
- [支持的模型提供商](#支持的模型提供商)
- [支持的聊天渠道](#支持的聊天渠道)
- [配置文件说明](#配置文件说明)
- [常见问题排查](#常见问题排查)
- [卸载](#卸载)

---

## 安装

OCM 提供三种安装方式，任选其一。

### 方式一：一键安装脚本（推荐）

脚本会自动完成：检测操作系统 → 检测网络环境 → 配置镜像源 → 安装 Node.js → 安装 OCM → 启动配置向导。

**macOS / Linux：**

```bash
curl -fsSL https://raw.githubusercontent.com/xpangjia/ocm/main/install.sh | bash
```

**Windows（PowerShell，以管理员身份运行）：**

```powershell
irm https://raw.githubusercontent.com/xpangjia/ocm/main/install.ps1 | iex
```

> Windows 提示"禁止运行脚本"时，先执行：
> ```powershell
> Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
> ```

**国内网络可指定镜像：**

```bash
# macOS / Linux
OCM_MIRROR=https://registry.npmmirror.com \
curl -fsSL https://raw.githubusercontent.com/xpangjia/ocm/main/install.sh | bash
```

```powershell
# Windows
$env:OCM_MIRROR="https://registry.npmmirror.com"; irm https://raw.githubusercontent.com/xpangjia/ocm/main/install.ps1 | iex
```

### 方式二：从 GitHub 安装（全平台通用）

前提：已安装 Node.js >= 22 和 npm。

```bash
npm install -g github:xpangjia/ocm
```

npm 会自动：克隆仓库 → 安装依赖 → 运行 prepare 脚本（自动构建）→ 全局安装。

### 方式三：npm link（本地开发用）

适用于有 OCM 源码、需要频繁修改测试的场景：

```bash
# 进入 OCM 项目目录
cd ~/path/to/ocm

# 构建
npm run build

# 全局链接
npm link

# 验证
ocm --version
```

修改代码后只需重新 `npm run build`，ocm 命令立刻生效，无需重新 link。

卸载：`npm unlink -g ocm`

### 验证安装

```bash
ocm --version    # 应显示 0.1.0
ocm --help       # 列出所有可用命令
```

---

## 快速开始

```bash
# 1. 首次配置向导 — 安装 OpenClaw + 选择模型 + 填入 API Key
ocm init

# 2. 查看运行状态
ocm status

# 3. 查看当前使用的模型
ocm model current

# 4. 切换模型（交互式）
ocm model switch

# 5. 环境诊断（有问题先跑这个）
ocm doctor
```

---

## 命令详解

所有命令支持 `--help` 查看详细用法，支持 `--verbose` 输出调试日志。

### ocm init

首次安装向导，交互式引导完成全部配置。

```bash
ocm init
```

向导流程：
1. 检测是否已安装 OpenClaw，未安装则自动安装
2. 选择模型提供商（国内直连 / 海外 / 本地部署）
3. 填入 API Key
4. 可选：添加聊天渠道（Telegram / Discord / 飞书）
5. 启动 Gateway

### ocm model

模型管理，包含 5 个子命令。

#### 切换模型

```bash
# 交互式选择（推荐）
ocm model switch

# 直接指定提供商
ocm model switch deepseek
```

切换后会自动重启 Gateway 使配置生效。

#### 添加模型提供商

```bash
ocm model add
```

交互式引导：选择提供商 → 填入 API Key → 自动验证 → 保存配置。

#### 列出已配置的模型

```bash
ocm model list
# 别名
ocm model ls
```

显示所有已配置的提供商及其状态（当前使用中会标记）。

#### 查看当前模型

```bash
ocm model current
```

显示当前正在使用的模型提供商和模型名称。

#### 移除模型提供商

```bash
# 交互式选择
ocm model remove

# 直接指定
ocm model remove deepseek
# 别名
ocm model rm deepseek
```

### ocm channel

渠道管理，将 OpenClaw 连接到聊天平台。包含 3 个子命令。

#### 添加渠道

```bash
ocm channel add
```

交互式引导：选择渠道类型 → 填入对应凭据 → 保存配置。

目前支持：
- **Telegram** — 需要 Bot Token（从 @BotFather 获取）
- **Discord** — 需要 Bot Token（从 Developer Portal 获取）
- **飞书** — 需要 App ID + App Secret（从飞书开放平台获取）

#### 列出已配置的渠道

```bash
ocm channel list
# 别名
ocm channel ls
```

#### 移除渠道

```bash
# 交互式选择
ocm channel remove

# 直接指定
ocm channel remove telegram
# 别名
ocm channel rm telegram
```

### ocm status

查看 OpenClaw Gateway 的运行状态。

```bash
ocm status
```

显示内容：
- Gateway 是否运行中（含 PID）
- 当前使用的模型
- 已配置的渠道
- OpenClaw 版本

### ocm doctor

环境诊断，检查各项依赖和配置是否正常。

```bash
ocm doctor
```

检查项目：
- Node.js 版本是否满足要求（>= 22）
- npm 是否可用
- OpenClaw 是否已安装及版本
- Gateway 是否运行中
- 配置文件是否存在且有效
- 网络连通性

### ocm restart / stop

Gateway 进程管理。

```bash
# 重启 Gateway
ocm restart

# 停止 Gateway
ocm stop
```

跨平台支持：
- macOS / Linux：使用 pgrep/pkill/nohup
- Windows：使用 wmic/taskkill + detached spawn

### ocm update

更新 OpenClaw 到最新版本。

```bash
ocm update
```

自动检测当前版本 → 拉取最新版 → 安装更新 → 重启 Gateway。

### ocm backup

配置备份与恢复。

#### 创建备份

```bash
ocm backup
```

将当前所有配置（OCM 配置 + 提供商 + 渠道 + OpenClaw 配置）打包备份，带时间戳命名。

#### 列出备份

```bash
ocm backup list
# 别名
ocm backup ls
```

显示所有历史备份，含序号、时间戳、文件大小。

#### 恢复备份

```bash
# 按序号恢复（序号来自 backup list）
ocm backup restore 1

# 按时间戳关键词恢复
ocm backup restore 20260305
```

### ocm config

OCM 自身配置管理。

#### 显示全部配置

```bash
ocm config show
```

#### 获取单个配置项

支持 dot notation 访问嵌套属性：

```bash
ocm config get network.mirror
# → "auto"

ocm config get autoRestart
# → "true"
```

#### 设置配置项

```bash
ocm config set autoRestart false
ocm config set network.mirror https://registry.npmmirror.com
```

### ocm logs

查看 Gateway 运行日志。

```bash
# 查看最近 50 行（默认）
ocm logs

# 查看最近 200 行
ocm logs --tail 200
```

---

## 支持的模型提供商

### 国内直连（9 家）

| 提供商 | 代表模型 | 认证方式 |
| --- | --- | --- |
| DeepSeek（深度求索） | DeepSeek V3, DeepSeek R1 | API Key |
| Z.AI（智谱 GLM） | GLM-5 | API Key |
| Moonshot（月之暗面 Kimi） | Kimi K2.5, Kimi K2 Thinking | API Key |
| Kimi Coding（编程版） | Kimi K2.5 Coding | API Key |
| MiniMax | ABAB 6.5s | API Key |
| Qwen Portal（阿里通义） | Qwen3 Max | OAuth |
| 百炼 Coding Plan | Qwen 3.5 Plus | API Key |
| 火山引擎（豆包） | 豆包 Seed 1.8 | API Key |
| 小米 MiMo | - | API Key |

### 海外（7 家）

| 提供商 | 代表模型 | 认证方式 |
| --- | --- | --- |
| Anthropic | Claude Opus 4.6, Claude Sonnet 4.5 | API Key |
| OpenAI | GPT-5.2, GPT-5.1 Codex | API Key |
| Google Gemini | Gemini 3 Pro | API Key |
| OpenRouter | Claude Sonnet 4.5 等 | API Key |
| xAI | Grok 3 | API Key |
| Groq | Llama 3.1 8B | API Key |
| Mistral AI | Mistral Large | API Key |

### 本地部署（3 家）

| 提供商 | 说明 |
| --- | --- |
| Ollama | 支持 Llama 3.3、Qwen 2.5 Coder 等，默认端口 11434 |
| vLLM | 高性能推理引擎，默认端口 8000 |
| LM Studio | 图形化本地模型管理，默认端口 1234 |

### 自定义端点

支持任何 OpenAI / Anthropic 兼容 API 端点，可自定义 Base URL 和模型名称。

---

## 支持的聊天渠道

| 渠道 | 需要的凭据 | 获取方式 |
| --- | --- | --- |
| Telegram | Bot Token | 在 Telegram 找 @BotFather，发送 /newbot |
| Discord | Bot Token | Discord Developer Portal → Application → Bot |
| 飞书 | App ID + App Secret | 飞书开放平台 → 创建自建应用 |

---

## 配置文件说明

| 文件 | 路径 | 说明 |
| --- | --- | --- |
| OCM 配置 | `~/.ocm/config.json` | OCM 自身设置（镜像、自动重启等） |
| 提供商配置 | `~/.ocm/providers.json` | 已添加的模型提供商及 API Key |
| 渠道配置 | `~/.ocm/channels.json` | 已配置的聊天渠道凭据 |
| OpenClaw 配置 | `~/.openclaw/openclaw.json` | OpenClaw 运行时配置 |
| 备份目录 | `~/.ocm/backups/` | 配置备份存放位置 |

> Windows 上 `~` 对应 `%USERPROFILE%`（通常是 `C:\Users\<用户名>`）。

---

## 常见问题排查

### 安装后找不到 ocm 命令

**macOS / Linux：**

```bash
npm config get prefix
echo $PATH | tr ':' '\n' | grep npm
# 确认 npm 全局 bin 目录在 PATH 中
```

**Windows：**

```powershell
npm config get prefix
# 确认输出路径在系统 Path 环境变量中
```

### 国内网络安装慢或失败

安装脚本会自动切换镜像。手动指定：

```bash
OCM_MIRROR=https://registry.npmmirror.com \
curl -fsSL https://raw.githubusercontent.com/xpangjia/ocm/main/install.sh | bash
```

或使用 Gitee 镜像：

```bash
curl -fsSL https://gitee.com/xpangjia/ocm/raw/main/install.sh | bash
```

### Node.js 版本不满足要求

OCM 需要 Node.js >= 22。手动升级：

```bash
# fnm 用户
fnm install 22 && fnm use 22

# nvm 用户
nvm install 22 && nvm use 22
```

```powershell
# Windows 用户
winget install OpenJS.NodeJS.LTS
```

### npm 权限错误

```bash
# 修改 npm 全局目录（推荐）
mkdir -p ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.zshrc
source ~/.zshrc
```

### API Key 验证失败

1. 确认 Key 格式正确（无多余空格或换行）
2. 确认 Key 未过期且账户有余额
3. 确认网络能访问对应 API 地址
4. 运行 `ocm doctor` 诊断网络连通性

### 模型切换后没有生效

切换命令会自动重启 Gateway。如果仍未生效：

```bash
ocm stop
ocm restart
```

### Gateway 端口被占用

```bash
# macOS / Linux
lsof -i :18789

# Windows
netstat -ano | findstr 18789
```

```bash
# 强制停止后重启
ocm stop
ocm restart
```

### 想从头重新配置

```bash
# macOS / Linux
rm -rf ~/.ocm
ocm init
```

```powershell
# Windows
Remove-Item -Recurse -Force "$env:USERPROFILE\.ocm"
ocm init
```

---

## 卸载

### 卸载 OCM

```bash
# npm link 安装的
npm unlink -g ocm

# npm install 安装的
npm uninstall -g ocm
```

### 清除配置文件（可选）

```bash
# macOS / Linux
rm -rf ~/.ocm

# Windows
Remove-Item -Recurse -Force "$env:USERPROFILE\.ocm"
```

### 卸载 OpenClaw（可选）

```bash
npm uninstall -g openclaw
rm -rf ~/.openclaw        # macOS / Linux
```

```powershell
npm uninstall -g openclaw
Remove-Item -Recurse -Force "$env:USERPROFILE\.openclaw"   # Windows
```

---

## 命令速查表

```
ocm init                       首次安装向导
ocm status                     查看运行状态
ocm doctor                     环境诊断

ocm model switch [provider]    切换模型
ocm model add                  添加模型提供商
ocm model list                 列出已配置模型
ocm model remove [provider]    移除模型提供商
ocm model current              查看当前模型

ocm channel add                添加聊天渠道
ocm channel remove [type]      移除渠道
ocm channel list               列出已配置渠道

ocm restart                    重启 Gateway
ocm stop                       停止 Gateway
ocm update                     更新 OpenClaw
ocm logs [--tail N]            查看日志

ocm backup                     创建备份
ocm backup list                列出备份
ocm backup restore <id>        恢复备份

ocm config show                显示配置
ocm config get <key>           获取配置项
ocm config set <key> <value>   设置配置项

ocm --version                  查看版本
ocm --help                     查看帮助
ocm <command> --help           查看子命令帮助
ocm <command> --verbose        输出调试日志
```
