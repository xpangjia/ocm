# 贡献指南

感谢你对 OCM 的关注！欢迎提交 Issue 和 Pull Request。

## 开发环境

```bash
# 克隆仓库
git clone https://github.com/xpangjia/ocm.git
cd ocm

# 安装依赖（需要 Node.js >= 22）
npm install

# 构建
npm run build

# 本地运行
node dist/index.js --help

# 开发模式（自动编译）
npm run dev

# 类型检查
npm run typecheck

# 运行测试
npm test
```

## 项目结构

```
src/
├── index.ts          # CLI 入口，注册所有命令
├── commands/         # 命令实现（init, model, channel 等）
├── core/             # 核心逻辑（配置管理、进程管理、验证）
├── registry/         # 模型提供商注册表（国内/海外/本地）
├── channels/         # 聊天渠道模板（Telegram/Discord/飞书）
└── utils/            # 工具函数（日志、Shell、UI）
```

## 提交规范

提交信息使用以下前缀：

- `feat:` 新功能
- `fix:` Bug 修复
- `docs:` 文档更新
- `refactor:` 重构
- `test:` 测试
- `chore:` 构建/工具链变更

示例：`feat: 添加 Claude 4.6 模型支持`

## 添加新的模型提供商

1. 在 `src/registry/cn/`、`global/` 或 `local/` 下新建 `<provider>.ts`
2. 实现 `ProviderTemplate` 接口（参考 `src/registry/types.ts`）
3. 在 `src/registry/index.ts` 中导入并添加到对应分组
4. 运行 `npm run build` 确认编译通过

## 添加新的聊天渠道

1. 在 `src/channels/` 下新建 `<channel>.ts`
2. 实现 `ChannelTemplate` 接口（参考 `src/channels/types.ts`）
3. 在 `src/channels/index.ts` 中导入并添加到列表

## Pull Request 流程

1. Fork 仓库
2. 创建功能分支：`git checkout -b feat/my-feature`
3. 编写代码和测试
4. 确保 `npm run typecheck` 和 `npm test` 通过
5. 提交 PR，描述清楚改了什么、为什么改

## 报告问题

提 Issue 时请包含：

- OCM 版本（`ocm --version`）
- Node.js 版本（`node --version`）
- 操作系统和架构
- 完整的错误输出（加 `--verbose`）
- 复现步骤
