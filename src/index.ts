import { Command } from "commander";
import { initCommand } from "./commands/init.js";
import { modelSwitch, modelAdd, modelList, modelRemove, modelCurrent } from "./commands/model.js";
import { statusCommand } from "./commands/status.js";
import { doctorCommand } from "./commands/doctor.js";
import { startCommand, restartCommand, stopCommand } from "./commands/restart.js";
import { updateCommand } from "./commands/update.js";
import { backupCommand, backupListCommand, backupRestoreCommand } from "./commands/backup.js";
import { configShowCommand, configGetCommand, configSetCommand } from "./commands/config.js";
import { logsCommand } from "./commands/logs.js";
import { channelAdd, channelRemove, channelList } from "./commands/channel.js";
import { setVerbose } from "./utils/logger.js";

const program = new Command();

program
  .name("ocm")
  .description("OCM — OpenClaw Manager\ncurl 一行装好 OpenClaw，一条命令切模型")
  .version("0.1.0")
  .option("--verbose", "输出详细日志")
  .hook("preAction", (thisCommand) => {
    if (thisCommand.opts().verbose) setVerbose(true);
  });

// ocm init
program
  .command("init")
  .description("首次安装向导：安装 OpenClaw + 配置模型")
  .action(initCommand);

// ocm model
const model = program
  .command("model")
  .description("模型管理（切换/添加/列表/移除）");

model
  .command("switch [provider]")
  .description("切换 AI 模型（不带参数进入交互模式）")
  .action((provider?: string) => modelSwitch(provider));

model
  .command("add")
  .description("添加新的模型提供商")
  .action(modelAdd);

model
  .command("list")
  .alias("ls")
  .description("列出所有已配置的模型")
  .action(modelList);

model
  .command("remove [provider]")
  .alias("rm")
  .description("移除一个模型提供商")
  .action((provider?: string) => modelRemove(provider));

model
  .command("current")
  .description("显示当前使用的模型")
  .action(modelCurrent);

// ocm status
program
  .command("status")
  .description("查看运行状态")
  .action(statusCommand);

// ocm doctor
program
  .command("doctor")
  .description("环境诊断")
  .action(doctorCommand);

// ocm start
program
  .command("start")
  .description("启动 Gateway（如果没有运行）")
  .action(startCommand);

// ocm restart
program
  .command("restart")
  .description("重启 Gateway")
  .action(restartCommand);

// ocm stop
program
  .command("stop")
  .description("停止 Gateway")
  .action(stopCommand);

// ocm update
program
  .command("update")
  .description("更新 OpenClaw 到最新版本")
  .action(updateCommand);

// ocm backup
const backup = program
  .command("backup")
  .description("备份当前配置")
  .action(backupCommand);

backup
  .command("list")
  .alias("ls")
  .description("列出所有备份")
  .action(backupListCommand);

backup
  .command("restore <id>")
  .description("从备份恢复（支持序号或时间戳关键词）")
  .action((id: string) => backupRestoreCommand(id));

// ocm config
const config = program
  .command("config")
  .description("配置管理");

config
  .command("show")
  .description("显示当前配置")
  .action(configShowCommand);

config
  .command("get <key>")
  .description("获取配置项（支持 dot notation）")
  .action((key: string) => configGetCommand(key));

config
  .command("set <key> <value>")
  .description("设置配置项")
  .action((key: string, value: string) => configSetCommand(key, value));

// ocm channel
const channel = program
  .command("channel")
  .description("渠道管理（添加/移除/列表）");

channel
  .command("add")
  .description("交互式添加聊天渠道（Telegram/Discord/飞书）")
  .action(channelAdd);

channel
  .command("remove [type]")
  .alias("rm")
  .description("移除一个聊天渠道")
  .action((type?: string) => channelRemove(type));

channel
  .command("list")
  .alias("ls")
  .description("列出已配置的渠道")
  .action(channelList);

// ocm logs
program
  .command("logs")
  .description("查看 Gateway 日志")
  .option("--tail <n>", "显示最后 N 行", "50")
  .action((options: { tail?: string }) => logsCommand(options));

program.parse();
