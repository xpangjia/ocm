#!/usr/bin/env bash
set -euo pipefail

# ===================================================================
# OCM — OpenClaw Manager 安装脚本
# 一行命令安装 OpenClaw + 配置模型
#
# 用法:
#   curl -fsSL https://raw.githubusercontent.com/xpangjia/ocm/main/install.sh | bash
#
# 环境变量（可选）:
#   OCM_MIRROR        自定义 npm 镜像
#   OCM_NODE_MIRROR   自定义 Node.js 二进制镜像
#   OCM_GITHUB_PROXY  自定义 GitHub 代理
#   OCM_DEBUG=0       关闭调试日志（默认开启）
#   NONINTERACTIVE=1  无人值守模式
# ===================================================================

VERSION="0.1.0"
REQUIRED_NODE_MAJOR=22
IS_CHINA=false
OCM_DEBUG="${OCM_DEBUG:-1}"

# ── 颜色 ──

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

# ── 输出函数（用 printf 替代 echo -e，兼容 sh）──

info()    { printf "  ${CYAN}ℹ${NC} %s\n" "$1"; }
success() { printf "  ${GREEN}✔${NC} %s\n" "$1"; }
warn()    { printf "  ${YELLOW}⚠${NC} %s\n" "$1"; }
fail()    { printf "  ${RED}✘${NC} %s\n" "$1"; }
step()    { printf "\n  ${BOLD}%s${NC}\n" "$1"; }

# 调试日志：OCM_DEBUG=1 时输出，OCM_DEBUG=0 关闭
debug() {
  if [ "$OCM_DEBUG" = "1" ]; then
    printf "  ${DIM}[debug] %s${NC}\n" "$1"
  fi
}

# ── 工具函数 ──

command_exists() {
  command -v "$1" > /dev/null 2>&1
}

retry() {
  local max_attempts=$1
  shift
  local attempt=1
  while [ $attempt -le $max_attempts ]; do
    if "$@" 2>/dev/null; then
      return 0
    fi
    if [ $attempt -lt $max_attempts ]; then
      warn "失败，重试中 ($attempt/$max_attempts)..."
      sleep 2
    fi
    attempt=$((attempt + 1))
  done
  return 1
}

# ── 0. 恢复上次安装的 PATH ──

debug "初始 PATH: $PATH"
debug "HOME: $HOME"
debug "SHELL: ${SHELL:-未设置}"
debug "当前用户: $(whoami)"

if [ -d "$HOME/.local/node/bin" ]; then
  export PATH="$HOME/.local/node/bin:$PATH"
  debug "检测到 ~/.local/node/bin，已加入 PATH"
else
  debug "~/.local/node/bin 不存在"
fi

# 检查已存在的 node/npm/ocm
debug "command -v node: $(command -v node 2>/dev/null || echo '未找到')"
debug "command -v npm: $(command -v npm 2>/dev/null || echo '未找到')"
debug "command -v ocm: $(command -v ocm 2>/dev/null || echo '未找到')"

# ── 1. 前置检查 ──

preflight_checks() {
  step "[1/5] 环境检测"

  local os
  os="$(uname -s)"
  local arch
  arch="$(uname -m)"

  debug "uname -s: $os"
  debug "uname -m: $arch"

  case "$os" in
    Darwin) info "系统: macOS ($arch)" ;;
    Linux)  info "系统: Linux ($arch)" ;;
    MINGW*|MSYS*|CYGWIN*)
      fail "检测到 Windows 环境（Git Bash / MSYS）"
      fail "请使用 PowerShell 安装脚本："
      info "  irm https://raw.githubusercontent.com/xpangjia/ocm/main/install.ps1 | iex"
      exit 1
      ;;
    *)
      fail "不支持的操作系统: $os"
      exit 1
      ;;
  esac

  if ! command_exists curl; then
    fail "未找到 curl，请先安装"
    exit 1
  fi

  debug "curl 路径: $(command -v curl)"
}

# ── 2. 网络检测 ──

detect_network() {
  step "[2/5] 网络检测"

  if curl -sI https://registry.npmjs.org --max-time 3 > /dev/null 2>&1; then
    IS_CHINA=false
    success "可直连国际源"
  else
    IS_CHINA=true
    warn "国际源不可达，自动切换国内镜像"
  fi
  debug "IS_CHINA=$IS_CHINA"
}

# ── 3. 配置镜像 ──

setup_mirrors() {
  step "[3/5] 配置镜像源"

  if [ "$IS_CHINA" = true ]; then
    local npm_mirror="${OCM_MIRROR:-https://registry.npmmirror.com}"
    local node_mirror="${OCM_NODE_MIRROR:-https://npmmirror.com/mirrors/node/}"

    npm config set registry "$npm_mirror" 2>/dev/null || true
    export NVM_NODEJS_ORG_MIRROR="$node_mirror"
    export FNM_NODE_DIST_MIRROR="$node_mirror"

    success "npm 镜像: $npm_mirror"
    success "Node.js 镜像: $node_mirror"

    debug "npm config get registry: $(npm config get registry 2>/dev/null || echo '失败')"
  else
    success "使用默认源"
  fi
}

# ── 4. Node.js ──

install_node_binary() {
  local node_mirror="${OCM_NODE_MIRROR:-https://npmmirror.com/mirrors/node/}"
  local os arch_name

  os="$(uname -s)"
  local machine
  machine="$(uname -m)"

  case "$os" in
    Darwin) os="darwin" ;;
    Linux)  os="linux" ;;
  esac

  case "$machine" in
    x86_64)  arch_name="x64" ;;
    aarch64|arm64) arch_name="arm64" ;;
    *)
      fail "不支持的架构: $machine"
      return 1
      ;;
  esac

  local node_ver="v${REQUIRED_NODE_MAJOR}.0.0"

  info "查询 Node.js ${REQUIRED_NODE_MAJOR}.x 最新版本..."
  local latest_ver
  latest_ver=$(curl -fsSL "${node_mirror}index.json" 2>/dev/null \
    | grep -o "\"v${REQUIRED_NODE_MAJOR}\.[0-9]*\.[0-9]*\"" \
    | head -1 \
    | tr -d '"') || true

  if [ -n "$latest_ver" ]; then
    node_ver="$latest_ver"
  fi
  debug "目标 Node.js 版本: $node_ver"

  local tarball="node-${node_ver}-${os}-${arch_name}.tar.gz"
  local url="${node_mirror}${node_ver}/${tarball}"

  info "下载 Node.js ${node_ver} (${os}-${arch_name})..."
  info "来源: ${url}"

  local tmp_dir
  tmp_dir="$(mktemp -d)"
  debug "临时目录: $tmp_dir"

  if ! curl -fsSL --max-time 120 -o "${tmp_dir}/${tarball}" "$url"; then
    rm -rf "$tmp_dir"
    fail "Node.js 下载失败"
    return 1
  fi

  local tarball_size
  tarball_size=$(wc -c < "${tmp_dir}/${tarball}" 2>/dev/null || echo "0")
  debug "tarball 大小: ${tarball_size} bytes"

  # 解压
  tar -xzf "${tmp_dir}/${tarball}" -C "$tmp_dir"
  local extracted_dir="${tmp_dir}/node-${node_ver}-${os}-${arch_name}"

  debug "解压目录: $extracted_dir"
  debug "解压内容: $(ls "$extracted_dir" 2>/dev/null || echo '目录不存在')"
  debug "bin 内容: $(ls -la "$extracted_dir/bin/" 2>/dev/null || echo 'bin 目录不存在')"

  # 整体移动到 ~/.local/node/
  local node_home="$HOME/.local/node"
  info "正在安装到 ${node_home}/ ..."

  rm -rf "$node_home" 2>/dev/null || true
  mkdir -p "$HOME/.local" 2>/dev/null || true

  if mv "$extracted_dir" "$node_home" 2>/dev/null; then
    debug "mv 成功: $extracted_dir -> $node_home"
    debug "node_home 内容: $(ls "$node_home" 2>/dev/null)"
    debug "node_home/bin 内容: $(ls -la "$node_home/bin/" 2>/dev/null)"

    # 将 node bin 目录加入 PATH
    export PATH="$node_home/bin:$PATH"
    debug "更新后 PATH: $PATH"

    # ── 写入 shell 配置 ──
    persist_path_to_shell_rc

    rm -rf "$tmp_dir"

    # 验证
    debug "验证 node: $(command -v node 2>/dev/null || echo '未找到')"
    debug "验证 npm: $(command -v npm 2>/dev/null || echo '未找到')"

    if command_exists node && command_exists npm; then
      success "Node.js $(node --version) 安装完成"
      success "npm $(npm --version)"
      debug "node 实际路径: $(command -v node)"
      debug "npm 实际路径: $(command -v npm)"
      debug "npm prefix -g: $(npm prefix -g 2>/dev/null || echo '失败')"
      return 0
    else
      fail "Node.js 安装后验证失败"
      debug "PATH: $PATH"
      debug "ls node_home/bin: $(ls -la "$node_home/bin/" 2>/dev/null || echo '不存在')"
      info "请手动将 ${node_home}/bin 添加到 PATH"
      return 1
    fi
  else
    rm -rf "$tmp_dir"
    fail "无法移动 Node.js 到 ${node_home}"
    debug "mv 失败: $extracted_dir -> $node_home"
    debug "权限: $(ls -la "$HOME/.local/" 2>/dev/null)"
    return 1
  fi
}

# 将 PATH 持久化写入 shell 配置文件
persist_path_to_shell_rc() {
  local shell_rc=""

  # 检测用户使用的 shell
  local user_shell="${SHELL:-/bin/zsh}"
  debug "用户 SHELL: $user_shell"

  case "$user_shell" in
    */zsh)  shell_rc="$HOME/.zshrc" ;;
    */bash)
      if [ -f "$HOME/.bashrc" ]; then
        shell_rc="$HOME/.bashrc"
      else
        shell_rc="$HOME/.bash_profile"
      fi
      ;;
  esac

  # 兜底：macOS 默认 zsh
  if [ -z "$shell_rc" ]; then
    shell_rc="$HOME/.zshrc"
  fi

  debug "目标 rc 文件: $shell_rc"
  debug "rc 文件是否存在: $([ -f "$shell_rc" ] && echo '是' || echo '否')"

  # 文件不存在则创建
  if [ ! -f "$shell_rc" ]; then
    touch "$shell_rc"
    info "创建 ${shell_rc}"
    debug "touch 结果: $(ls -la "$shell_rc" 2>/dev/null)"
  fi

  # 写入前：检查文件当前内容
  debug "rc 文件当前行数: $(wc -l < "$shell_rc" 2>/dev/null || echo '0')"
  debug "rc 文件中是否有 .local/node: $(grep '.local/node' "$shell_rc" 2>/dev/null || echo '无')"

  # 写入 PATH（如果还没写过）
  if ! grep -q '.local/node/bin' "$shell_rc" 2>/dev/null; then
    printf '\n# Node.js (installed by OCM)\nexport PATH="$HOME/.local/node/bin:$PATH"\n' >> "$shell_rc"
    info "已将 ~/.local/node/bin 添加到 ${shell_rc}"
    debug "写入后验证: $(grep '.local/node' "$shell_rc" 2>/dev/null || echo '写入失败！')"
  else
    info "PATH 已在 ${shell_rc} 中配置"
  fi

  # 最终验证
  if grep -q '.local/node/bin' "$shell_rc" 2>/dev/null; then
    success "shell 配置已更新"
    debug "rc 文件最后 3 行: $(tail -3 "$shell_rc" 2>/dev/null)"
  else
    warn "写入 ${shell_rc} 失败"
    debug "rc 文件权限: $(ls -la "$shell_rc" 2>/dev/null)"
    debug "磁盘空间: $(df -h "$HOME" 2>/dev/null | tail -1)"
    info "请手动添加: export PATH=\"\$HOME/.local/node/bin:\$PATH\""
  fi
}

ensure_nodejs() {
  step "[4/5] 检测 Node.js"

  debug "检查 node 命令..."
  if command_exists node; then
    local node_version
    node_version="$(node --version)"
    local node_major
    node_major="$(echo "$node_version" | sed 's/v\([0-9]*\).*/\1/')"

    debug "已安装 Node.js: $node_version (major=$node_major), 路径: $(command -v node)"

    if [ "$node_major" -ge "$REQUIRED_NODE_MAJOR" ]; then
      success "Node.js $node_version 已安装"
      debug "npm 版本: $(npm --version 2>/dev/null || echo '未找到')"
      debug "npm prefix -g: $(npm prefix -g 2>/dev/null || echo '未知')"
      return
    else
      warn "Node.js $node_version 版本过低（需要 ≥ $REQUIRED_NODE_MAJOR）"
    fi
  else
    warn "未找到 Node.js"
    debug "PATH 中无 node: $PATH"
  fi

  info "正在安装 Node.js $REQUIRED_NODE_MAJOR..."

  # 检查已有的版本管理器
  debug "fnm: $(command -v fnm 2>/dev/null || echo '未安装')"
  debug "nvm: $(command -v nvm 2>/dev/null || echo '未安装') | ~/.nvm/nvm.sh 存在: $([ -s "$HOME/.nvm/nvm.sh" ] && echo '是' || echo '否')"
  debug "brew: $(command -v brew 2>/dev/null || echo '未安装')"

  # 优先用已有的 fnm
  if command_exists fnm; then
    info "使用 fnm 安装..."
    fnm install "$REQUIRED_NODE_MAJOR"
    fnm use "$REQUIRED_NODE_MAJOR"
    eval "$(fnm env)"
    success "Node.js $(node --version) 安装完成 (via fnm)"
    return
  fi

  # 其次用已有的 nvm
  if command_exists nvm || [ -s "$HOME/.nvm/nvm.sh" ]; then
    [ -s "$HOME/.nvm/nvm.sh" ] && . "$HOME/.nvm/nvm.sh"
    info "使用 nvm 安装..."
    nvm install "$REQUIRED_NODE_MAJOR"
    nvm use "$REQUIRED_NODE_MAJOR"
    success "Node.js $(node --version) 安装完成 (via nvm)"
    return
  fi

  # macOS 有 brew → 用 brew 装 fnm
  if [ "$(uname -s)" = "Darwin" ] && command_exists brew; then
    info "使用 Homebrew 安装 fnm..."
    brew install fnm
    eval "$(fnm env)"
    fnm install "$REQUIRED_NODE_MAJOR"
    fnm use "$REQUIRED_NODE_MAJOR"
    eval "$(fnm env)"
    success "Node.js $(node --version) 安装完成 (via brew + fnm)"
    return
  fi

  # 国内网络：直接下载二进制
  if [ "$IS_CHINA" = true ]; then
    info "国内网络，直接下载 Node.js 二进制..."
    if install_node_binary; then
      return
    fi
    warn "二进制安装失败，尝试 fnm..."
  fi

  # 海外网络（或国内降级）：安装 fnm
  info "正在安装 fnm (Fast Node Manager)..."
  local fnm_url="https://fnm.vercel.app/install"
  if curl -fsSL --max-time 15 "$fnm_url" 2>/dev/null | bash -s -- --skip-shell; then
    export PATH="$HOME/.local/share/fnm:$PATH"
    eval "$(fnm env)" 2>/dev/null || true
    if command_exists fnm; then
      fnm install "$REQUIRED_NODE_MAJOR"
      fnm use "$REQUIRED_NODE_MAJOR"
      eval "$(fnm env)"
      success "Node.js $(node --version) 安装完成 (via fnm)"
      return
    fi
  fi

  # 最后降级：海外也尝试直接下载二进制
  if [ "$IS_CHINA" = false ]; then
    warn "fnm 安装失败，尝试直接下载 Node.js..."
    export OCM_NODE_MIRROR="https://nodejs.org/dist/"
    if install_node_binary; then
      return
    fi
  fi

  fail "Node.js 安装失败"
  fail "请手动安装 Node.js ≥ $REQUIRED_NODE_MAJOR: https://nodejs.org/"
  info "macOS: brew install node@$REQUIRED_NODE_MAJOR"
  exit 1
}

# ── 5. 安装 OCM ──

install_ocm() {
  step "[5/5] 安装 OCM"

  debug "检查 ocm 命令: $(command -v ocm 2>/dev/null || echo '未找到')"

  if command_exists ocm; then
    local current_ver
    current_ver="$(ocm --version 2>/dev/null || echo '未知')"
    success "OCM $current_ver 已安装，跳过"
    return
  fi

  info "正在安装 OCM..."
  debug "npm 路径: $(command -v npm 2>/dev/null || echo '未找到')"
  debug "npm prefix -g: $(npm prefix -g 2>/dev/null || echo '未知')"
  debug "npm config get registry: $(npm config get registry 2>/dev/null || echo '未知')"

  # 海外网络：直接从 GitHub 安装
  if [ "$IS_CHINA" = false ]; then
    if retry 3 npm install -g github:xpangjia/ocm; then
      success "OCM 安装完成"
      return
    fi
    warn "GitHub 安装失败，尝试 tarball 方式..."
  fi

  # 国内网络：tarball 方式
  install_ocm_from_tarball
}

install_ocm_from_tarball() {
  local repo_url="https://github.com/xpangjia/ocm/archive/refs/heads/main.tar.gz"

  local proxies=(
    "https://ghfast.top/"
    "https://gh-proxy.com/"
    "https://github.moeyy.xyz/"
  )

  local tmp_dir
  tmp_dir="$(mktemp -d)"
  local downloaded=false

  debug "tarball 临时目录: $tmp_dir"

  # 国内：依次尝试多个代理
  if [ "$IS_CHINA" = true ]; then
    if [ -n "${OCM_GITHUB_PROXY:-}" ]; then
      proxies=("$OCM_GITHUB_PROXY" "${proxies[@]}")
    fi

    for proxy in "${proxies[@]}"; do
      local proxy_url="${proxy}${repo_url}"
      info "尝试下载: ${proxy_url}"
      if curl -fsSL --max-time 30 -o "${tmp_dir}/ocm.tar.gz" "$proxy_url" 2>/dev/null; then
        downloaded=true
        success "下载成功 (via ${proxy})"
        break
      fi
      warn "代理 ${proxy} 失败，尝试下一个..."
    done
  fi

  # 海外（或代理全部失败）：直接访问 GitHub
  if [ "$downloaded" = false ]; then
    info "尝试直接下载: ${repo_url}"
    if curl -fsSL --max-time 60 -o "${tmp_dir}/ocm.tar.gz" "$repo_url" 2>/dev/null; then
      downloaded=true
      success "下载成功"
    fi
  fi

  if [ "$downloaded" = false ]; then
    rm -rf "$tmp_dir"
    fail "OCM 源码下载失败（所有源均不可达）"
    fail "请手动下载并安装："
    info "  1. 浏览器打开 https://github.com/xpangjia/ocm"
    info "  2. 点击 Code → Download ZIP"
    info "  3. 解压后进入目录，运行: npm install && npm run build && npm install -g ."
    exit 1
  fi

  local tarball_size
  tarball_size=$(wc -c < "${tmp_dir}/ocm.tar.gz" 2>/dev/null || echo "0")
  debug "OCM tarball 大小: ${tarball_size} bytes"

  # 解压
  tar -xzf "${tmp_dir}/ocm.tar.gz" -C "$tmp_dir"
  local src_dir="${tmp_dir}/ocm-main"

  debug "OCM 源码目录: $src_dir"
  debug "源码内容: $(ls "$src_dir" 2>/dev/null || echo '目录不存在')"

  # npm registry
  local npm_reg_flag=""
  if [ "$IS_CHINA" = true ]; then
    local npm_reg="${OCM_MIRROR:-https://registry.npmmirror.com}"
    npm_reg_flag="--registry=${npm_reg}"
    info "使用 npm 镜像: ${npm_reg}"
  fi

  # 安装依赖
  info "正在安装依赖..."
  cd "$src_dir"
  debug "当前目录: $(pwd)"
  debug "package.json 存在: $([ -f package.json ] && echo '是' || echo '否')"

  # shellcheck disable=SC2086
  if ! npm install $npm_reg_flag 2>&1; then
    fail "依赖安装失败（上方有详细错误信息）"
    debug "npm 版本: $(npm --version 2>/dev/null || echo '未知')"
    debug "node 版本: $(node --version 2>/dev/null || echo '未知')"
    rm -rf "$tmp_dir"
    exit 1
  fi
  success "依赖安装完成"
  debug "node_modules 大小: $(du -sh node_modules 2>/dev/null || echo '未知')"

  # 构建
  info "正在构建..."
  if ! npm run build 2>&1; then
    fail "构建失败（上方有详细错误信息）"
    rm -rf "$tmp_dir"
    exit 1
  fi
  success "构建完成"
  debug "dist 内容: $(ls -la dist/ 2>/dev/null || echo 'dist 不存在')"

  # 全局安装（用 npm pack 打包再安装，避免符号链接指向临时目录）
  info "正在打包..."
  local packed_file
  packed_file="$(npm pack 2>/dev/null | tail -1)"
  debug "npm pack 输出: $packed_file"

  if [ -z "$packed_file" ] || [ ! -f "$src_dir/$packed_file" ]; then
    fail "npm pack 失败"
    debug "pack 结果文件: $packed_file"
    debug "ls *.tgz: $(ls -la "$src_dir"/*.tgz 2>/dev/null || echo '无 tgz 文件')"
    rm -rf "$tmp_dir"
    exit 1
  fi
  debug "打包文件: $src_dir/$packed_file ($(wc -c < "$src_dir/$packed_file" 2>/dev/null) bytes)"

  info "正在全局安装..."
  local npm_global_prefix
  npm_global_prefix="$(npm prefix -g 2>/dev/null || echo '')"
  debug "npm prefix -g: $npm_global_prefix"

  # 回到 HOME 目录，避免删除临时目录后 cwd 失效
  local pack_path="$src_dir/$packed_file"
  cd "$HOME"

  if ! npm install -g "$pack_path" 2>&1; then
    warn "无权限，尝试 sudo..."
    if ! sudo npm install -g "$pack_path" 2>&1; then
      fail "全局安装失败"
      rm -rf "$tmp_dir"
      exit 1
    fi
  fi

  # 清理临时目录
  rm -rf "$tmp_dir"

  # 确保 npm 全局 bin 在 PATH 中
  local npm_global_bin="${npm_global_prefix}/bin"
  debug "npm 全局 bin 目录: $npm_global_bin"
  debug "该目录是否存在: $([ -d "$npm_global_bin" ] && echo '是' || echo '否')"

  if [ -d "$npm_global_bin" ]; then
    export PATH="$npm_global_bin:$PATH"
    info "npm 全局目录: ${npm_global_bin}"
  fi

  debug "该目录内容: $(ls -la "$npm_global_bin/" 2>/dev/null || echo '不存在')"

  # 验证 ocm 安装结果
  debug "安装后 command -v ocm: $(command -v ocm 2>/dev/null || echo '未找到')"

  # 检查全局 node_modules 中 ocm 是否是真实文件而非断裂的符号链接
  local ocm_global_dir="${npm_global_prefix}/lib/node_modules/ocm"
  debug "ocm 全局目录: $ocm_global_dir"
  debug "ocm 全局目录类型: $(file "$ocm_global_dir" 2>/dev/null || echo '不存在')"
  if [ -d "$ocm_global_dir" ]; then
    debug "ocm dist/index.js 存在: $([ -f "$ocm_global_dir/dist/index.js" ] && echo '是' || echo '否')"
    debug "ocm dist/index.js 首行: $(head -1 "$ocm_global_dir/dist/index.js" 2>/dev/null || echo '读取失败')"
  else
    debug "ocm 全局目录详情: $(ls -la "${npm_global_prefix}/lib/node_modules/" 2>/dev/null | grep ocm || echo 'ocm 不在 node_modules 中')"
  fi

  # 验证 ocm 命令可用
  if command_exists ocm; then
    success "OCM $(ocm --version 2>/dev/null || echo '') 安装完成"
  else
    warn "OCM 文件已安装，但命令暂时不可用（需要刷新终端环境）"
  fi
}

# ── 6. 启动向导 ──

run_init() {
  debug "=== run_init 开始 ==="

  # 确保各种 bin 目录在 PATH 中
  local npm_global_bin
  npm_global_bin="$(npm prefix -g 2>/dev/null)/bin"
  if [ -d "$npm_global_bin" ]; then
    export PATH="$npm_global_bin:$PATH"
  fi
  if [ -d "$HOME/.local/node/bin" ]; then
    export PATH="$HOME/.local/node/bin:$PATH"
  fi

  debug "最终 PATH: $PATH"
  debug "command -v node: $(command -v node 2>/dev/null || echo '未找到')"
  debug "command -v npm: $(command -v npm 2>/dev/null || echo '未找到')"
  debug "command -v ocm: $(command -v ocm 2>/dev/null || echo '未找到')"

  # 查找 ocm 实际路径
  local ocm_bin
  ocm_bin="$(command -v ocm 2>/dev/null || echo "")"

  # 常见位置搜索
  if [ -z "$ocm_bin" ]; then
    debug "PATH 中未找到 ocm，搜索常见位置..."
    for try_path in \
      "$npm_global_bin/ocm" \
      "$HOME/.local/node/bin/ocm" \
      "$HOME/.local/node/lib/node_modules/ocm/dist/index.js" \
      "/usr/local/bin/ocm"; do
      debug "  检查: $try_path -> $([ -e "$try_path" ] && echo '存在' || echo '不存在') $([ -x "$try_path" ] && echo '(可执行)' || echo '')"
      if [ -x "$try_path" ]; then
        ocm_bin="$try_path"
        debug "  找到 ocm: $try_path"
        break
      fi
    done
  fi

  # 检查 rc 文件状态
  debug "~/.zshrc 存在: $([ -f "$HOME/.zshrc" ] && echo '是' || echo '否')"
  if [ -f "$HOME/.zshrc" ]; then
    debug "~/.zshrc 中的 PATH 配置: $(grep -n 'PATH' "$HOME/.zshrc" 2>/dev/null || echo '无')"
  fi
  debug "~/.bashrc 存在: $([ -f "$HOME/.bashrc" ] && echo '是' || echo '否')"
  debug "~/.bash_profile 存在: $([ -f "$HOME/.bash_profile" ] && echo '是' || echo '否')"

  printf "\n"
  printf "  ${GREEN}${BOLD}安装完成！${NC}\n"
  printf "\n"

  if [ -n "$ocm_bin" ]; then
    info "ocm 路径: ${ocm_bin}"
    printf "  正在启动配置向导...\n"
    printf "\n"
    exec "$ocm_bin" init
  else
    success "OCM 已安装，但需要刷新终端环境才能使用"
    printf "\n"
    info "请执行以下操作："
    info "  1. 关闭当前终端"
    info "  2. 打开新终端"
    info "  3. 运行: ocm init"
    printf "\n"
    info "或者在当前终端运行:"
    info "  source ~/.zshrc && ocm init"
    printf "\n"

    debug "=== 诊断信息 ==="
    debug "npm prefix -g: $(npm prefix -g 2>/dev/null || echo '未知')"
    debug "ls npm_global_bin: $(ls -la "$npm_global_bin/" 2>/dev/null | grep ocm || echo 'ocm 不在 npm 全局目录')"
    debug "ls ~/.local/node/bin: $(ls -la "$HOME/.local/node/bin/" 2>/dev/null | grep ocm || echo 'ocm 不在 node bin')"
    debug "find ocm: $(find "$HOME/.local" -name "ocm" -type f 2>/dev/null | head -5 || echo '未找到')"
  fi
}

# ── 主函数 ──

main() {
  printf "\n"
  printf "  ${CYAN}${BOLD}OCM — OpenClaw Manager${NC} v${VERSION}\n"
  printf "  ${DIM}curl 一行装好 OpenClaw，一条命令切模型${NC}\n"
  if [ "$OCM_DEBUG" = "1" ]; then
    printf "  ${DIM}[调试模式已开启，设置 OCM_DEBUG=0 关闭]${NC}\n"
  fi
  printf "\n"

  preflight_checks
  detect_network
  setup_mirrors
  ensure_nodejs
  install_ocm
  run_init
}

main "$@"
