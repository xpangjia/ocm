import { Command } from "commander";
import { initCommand } from "./commands/init.js";
import { modelSwitch, modelAdd, modelList, modelRemove, modelCurrent } from "./commands/model.js";
import { statusCommand } from "./commands/status.js";
import { doctorCommand } from "./commands/doctor.js";
import { restartCommand, stopCommand } from "./commands/restart.js";
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

program.parse();
