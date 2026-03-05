# OCM — OpenClaw Manager

> curl 一行装好 OpenClaw，一条命令切模型。

OCM 是 [OpenClaw](https://github.com/xpangjia/ocm) 的一站式安装和管理工具，专为**中文用户和国内网络**优化。自动检测网络环境、配置镜像源，内置 19 个模型提供商，支持 Telegram / Discord / 飞书渠道管理。

## 安装

### macOS / Linux 一键安装

```bash
curl -fsSL https://raw.githubusercontent.com/xpangjia/ocm/main/install.sh | bash
```

### Windows 一键安装

```powershell
irm https://raw.githubusercontent.com/xpangjia/ocm/main/install.ps1 | iex
```

安装脚本会自动完成：
- 检测操作系统和架构
- 判断网络环境，国内自动切换镜像源
- 检测或安装 Node.js >= 22
- 全局安装 OCM 并启动配置向导

国内网络可通过环境变量自定义镜像：

```bash
# macOS / Linux
OCM_MIRROR=https://registry.npmmirror.com \
curl -fsSL https://raw.githubusercontent.com/xpangjia/ocm/main/install.sh | bash
```

```powershell
# Windows
$env:OCM_MIRROR="https://registry.npmmirror.com"; irm https://raw.githubusercontent.com/xpangjia/ocm/main/install.ps1 | iex
```

### 手动安装（全平台）

```bash
npm install -g github:xpangjia/ocm
```

## 快速开始

```bash
# 首次配置向导 — 选择模型、填入 API Key、一步到位
ocm init

# 查看当前使用的模型
ocm model current

# 切换模型（交互式）
ocm model switch

# 查看运行状态
ocm status

# 环境诊断
ocm doctor
```

## 命令参考

| 命令 | 说明 |
| --- | --- |
| `ocm init` | 首次安装向导：安装 OpenClaw + 配置模型 |
| `ocm model switch [provider]` | 切换 AI 模型（不带参数进入交互模式） |
| `ocm model add` | 添加新的模型提供商 |
| `ocm model list` | 列出所有已配置的模型 |
| `ocm model remove [provider]` | 移除一个模型提供商 |
| `ocm model current` | 显示当前使用的模型 |
| `ocm status` | 查看运行状态 |
| `ocm doctor` | 环境诊断 |
| `ocm restart` | 重启 Gateway |
| `ocm stop` | 停止 Gateway |
| `ocm update` | 更新 OpenClaw 到最新版本 |
| `ocm backup` | 备份当前配置 |
| `ocm backup list` | 列出所有备份 |
| `ocm backup restore <id>` | 从备份恢复（支持序号或时间戳） |
| `ocm config show` | 显示当前配置 |
| `ocm config get <key>` | 获取配置项（支持 dot notation） |
| `ocm config set <key> <value>` | 设置配置项 |
| `ocm channel add` | 交互式添加聊天渠道（Telegram/Discord/飞书） |
| `ocm channel remove [type]` | 移除一个聊天渠道 |
| `ocm channel list` | 列出已配置的渠道 |
| `ocm logs [--tail N]` | 查看 Gateway 日志（默认最后 50 行） |

所有命令支持 `--help` 查看详细用法，支持 `--verbose` 输出调试日志。

## 模型支持

### 国内直连

| 提供商 | 模型 | 认证方式 |
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

### 海外

| 提供商 | 模型 | 认证方式 |
| --- | --- | --- |
| Anthropic | Claude Opus 4.6, Claude Sonnet 4.5 | API Key |
| OpenAI | GPT-5.2, GPT-5.1 Codex | API Key |
| Google Gemini | Gemini 3 Pro | API Key |
| OpenRouter | Claude Sonnet 4.5 等 | API Key |
| xAI | Grok 3 | API Key |
| Groq | Llama 3.1 8B | API Key |
| Mistral AI | Mistral Large | API Key |

### 本地部署

| 提供商 | 说明 |
| --- | --- |
| Ollama | 支持 Llama 3.3、Qwen 2.5 Coder 等，默认端口 11434 |
| vLLM | 高性能推理引擎，默认端口 8000 |
| LM Studio | 图形化本地模型管理，默认端口 1234 |

也支持**自定义 OpenAI / Anthropic 兼容端点**，可接入任何兼容 API。

## 渠道管理

OCM 支持将 OpenClaw 连接到聊天平台：

```bash
# 添加渠道（交互式引导）
ocm channel add

# 查看已配置的渠道
ocm channel list

# 移除渠道
ocm channel remove telegram
```

目前支持：**Telegram**、**Discord**、**飞书**。

## 常见问题

### 国内网络安装慢或失败

安装脚本会自动检测网络环境并切换镜像。如果仍有问题，手动指定镜像：

```bash
OCM_MIRROR=https://registry.npmmirror.com \
curl -fsSL https://raw.githubusercontent.com/xpangjia/ocm/main/install.sh | bash
```

### Node.js 版本要求

OCM 需要 Node.js >= 22。安装脚本会自动通过 fnm 或 nvm 安装合适版本。手动安装时请确认版本：

```bash
node --version  # 应 >= v22.0.0
```

### 如何切换模型

```bash
# 交互式选择
ocm model switch

# 直接指定
ocm model switch deepseek
```

### 如何备份和恢复配置

```bash
# 备份
ocm backup

# 查看备份列表
ocm backup list

# 恢复
ocm backup restore 1
```

### 支持哪些操作系统

支持 macOS、Linux 和 Windows。Windows 用户可以原生安装（PowerShell），也可以通过 WSL 使用。

## License

MIT
