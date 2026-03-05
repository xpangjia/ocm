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
#   NONINTERACTIVE=1  无人值守模式
# ===================================================================

VERSION="0.1.0"
REQUIRED_NODE_MAJOR=22
IS_CHINA=false

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

# ── 0. 恢复上次安装的 PATH（重跑脚本时识别已装的 node/npm）──

if [ -d "$HOME/.local/node/bin" ]; then
  export PATH="$HOME/.local/node/bin:$PATH"
fi

# ── 1. 前置检查 ──

preflight_checks() {
  step "[1/5] 环境检测"

  # OS 检测
  local os
  os="$(uname -s)"
  local arch
  arch="$(uname -m)"

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
      fail "macOS/Linux 用此脚本，Windows 请用 PowerShell 脚本："
      info "  irm https://raw.githubusercontent.com/xpangjia/ocm/main/install.ps1 | iex"
      exit 1
      ;;
  esac

  # curl 检测
  if ! command_exists curl; then
    fail "未找到 curl，请先安装"
    exit 1
  fi
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
  else
    success "使用默认源"
  fi
}

# ── 4. Node.js ──

# 直接从镜像下载 Node.js 二进制（国内网络降级方案）
install_node_binary() {
  local node_mirror="${OCM_NODE_MIRROR:-https://npmmirror.com/mirrors/node/}"
  local os arch_name

  os="$(uname -s)"
  local machine
  machine="$(uname -m)"

  # 确定平台名
  case "$os" in
    Darwin) os="darwin" ;;
    Linux)  os="linux" ;;
  esac

  # 确定架构名
  case "$machine" in
    x86_64)  arch_name="x64" ;;
    aarch64|arm64) arch_name="arm64" ;;
    *)
      fail "不支持的架构: $machine"
      return 1
      ;;
  esac

  local node_ver="v${REQUIRED_NODE_MAJOR}.0.0"

  # 先获取实际最新 LTS 版本号
  info "查询 Node.js ${REQUIRED_NODE_MAJOR}.x 最新版本..."
  local latest_ver
  latest_ver=$(curl -fsSL "${node_mirror}index.json" 2>/dev/null \
    | grep -o "\"v${REQUIRED_NODE_MAJOR}\.[0-9]*\.[0-9]*\"" \
    | head -1 \
    | tr -d '"') || true

  if [ -n "$latest_ver" ]; then
    node_ver="$latest_ver"
  fi

  local tarball="node-${node_ver}-${os}-${arch_name}.tar.gz"
  local url="${node_mirror}${node_ver}/${tarball}"

  info "下载 Node.js ${node_ver} (${os}-${arch_name})..."
  info "来源: ${url}"

  local tmp_dir
  tmp_dir="$(mktemp -d)"

  if ! curl -fsSL --max-time 120 -o "${tmp_dir}/${tarball}" "$url"; then
    rm -rf "$tmp_dir"
    fail "Node.js 下载失败"
    return 1
  fi

  # 解压到临时目录
  tar -xzf "${tmp_dir}/${tarball}" -C "$tmp_dir"
  local extracted_dir="${tmp_dir}/node-${node_ver}-${os}-${arch_name}"

  # 整体移动到 ~/.local/node/（保持原始目录结构，避免符号链接断裂）
  local node_home="$HOME/.local/node"
  info "正在安装到 ${node_home}/ ..."

  # 清理旧安装
  rm -rf "$node_home" 2>/dev/null || true
  mkdir -p "$HOME/.local" 2>/dev/null || true

  if mv "$extracted_dir" "$node_home" 2>/dev/null; then
    # 将 node bin 目录加入 PATH
    export PATH="$node_home/bin:$PATH"

    # 写入 shell 配置以持久化
    local shell_rc=""

    # 检测用户使用的 shell，优先写对应的 rc 文件
    case "${SHELL:-/bin/zsh}" in
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

    # 文件不存在则创建
    if [ ! -f "$shell_rc" ]; then
      touch "$shell_rc"
      info "创建 ${shell_rc}"
    fi

    # 写入 PATH（如果还没写过）
    if ! grep -q '.local/node/bin' "$shell_rc" 2>/dev/null; then
      printf '\n# Node.js (installed by OCM)\nexport PATH="$HOME/.local/node/bin:$PATH"\n' >> "$shell_rc"
      info "已将 ~/.local/node/bin 添加到 ${shell_rc}"
    else
      info "PATH 已在 ${shell_rc} 中配置"
    fi

    # 验证写入成功
    if grep -q '.local/node/bin' "$shell_rc" 2>/dev/null; then
      success "shell 配置已更新"
    else
      warn "写入 ${shell_rc} 失败，请手动添加:"
      info "  export PATH=\"\$HOME/.local/node/bin:\$PATH\""
    fi

    rm -rf "$tmp_dir"

    # 验证
    if command_exists node && command_exists npm; then
      success "Node.js $(node --version) 安装完成"
      success "npm $(npm --version)"
      return 0
    else
      fail "Node.js 安装后验证失败"
      info "请手动将 ${node_home}/bin 添加到 PATH"
      return 1
    fi
  else
    rm -rf "$tmp_dir"
    fail "无法移动 Node.js 到 ${node_home}"
    info "请手动安装: brew install node@${REQUIRED_NODE_MAJOR} 或访问 https://nodejs.org/"
    return 1
  fi
}

ensure_nodejs() {
  step "[4/5] 检测 Node.js"

  if command_exists node; then
    local node_version
    node_version="$(node --version)"
    local node_major
    node_major="$(echo "$node_version" | sed 's/v\([0-9]*\).*/\1/')"

    if [ "$node_major" -ge "$REQUIRED_NODE_MAJOR" ]; then
      success "Node.js $node_version 已安装"
      return
    else
      warn "Node.js $node_version 版本过低（需要 ≥ $REQUIRED_NODE_MAJOR）"
    fi
  else
    warn "未找到 Node.js"
  fi

  info "正在安装 Node.js $REQUIRED_NODE_MAJOR..."

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

  # macOS 有 brew → 用 brew 装 fnm 然后装 Node
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

  # 国内网络：直接从 npmmirror 下载 Node.js 二进制（不依赖 fnm.vercel.app）
  if [ "$IS_CHINA" = true ]; then
    info "国内网络，直接下载 Node.js 二进制..."
    if install_node_binary; then
      return
    fi
    # 降级：尝试 fnm
    warn "二进制安装失败，尝试 fnm..."
  fi

  # 海外网络（或国内降级）：安装 fnm
  info "正在安装 fnm (Fast Node Manager)..."

  local fnm_url="https://fnm.vercel.app/install"
  if curl -fsSL --max-time 15 "$fnm_url" 2>/dev/null | bash -s -- --skip-shell; then
    # 加载 fnm
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
  info "Ubuntu/Debian: curl -fsSL https://deb.nodesource.com/setup_${REQUIRED_NODE_MAJOR}.x | sudo -E bash - && sudo apt-get install -y nodejs"
  exit 1
}

# ── 5. 安装 OCM ──

install_ocm() {
  step "[5/5] 安装 OCM"

  if command_exists ocm; then
    local current_ver
    current_ver="$(ocm --version 2>/dev/null || echo '未知')"
    success "OCM $current_ver 已安装，跳过"
    return
  fi

  info "正在安装 OCM..."

  # 海外网络：直接从 GitHub 安装
  if [ "$IS_CHINA" = false ]; then
    if retry 3 npm install -g github:xpangjia/ocm; then
      success "OCM 安装完成"
      return
    fi
    warn "GitHub 安装失败，尝试 tarball 方式..."
  fi

  # 国内网络（或海外降级）：下载 tarball → 本地构建 → 全局安装
  install_ocm_from_tarball
}

# 通过 tarball 下载安装 OCM（不直接依赖 git clone GitHub）
install_ocm_from_tarball() {
  local repo_url="https://github.com/xpangjia/ocm/archive/refs/heads/main.tar.gz"

  # GitHub 代理列表（国内可用的镜像）
  local proxies=(
    "https://ghfast.top/"
    "https://gh-proxy.com/"
    "https://github.moeyy.xyz/"
  )

  local tmp_dir
  tmp_dir="$(mktemp -d)"
  local downloaded=false

  # 国内：依次尝试多个代理
  if [ "$IS_CHINA" = true ]; then
    # 允许用户自定义代理
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

  # 解压
  tar -xzf "${tmp_dir}/ocm.tar.gz" -C "$tmp_dir"
  local src_dir="${tmp_dir}/ocm-main"

  # 确定 npm registry（国内显式指定，避免配置丢失）
  local npm_reg_flag=""
  if [ "$IS_CHINA" = true ]; then
    local npm_reg="${OCM_MIRROR:-https://registry.npmmirror.com}"
    npm_reg_flag="--registry=${npm_reg}"
    info "使用 npm 镜像: ${npm_reg}"
  fi

  # 安装依赖
  info "正在安装依赖..."
  cd "$src_dir"
  # shellcheck disable=SC2086
  if ! npm install $npm_reg_flag 2>&1; then
    fail "依赖安装失败（上方有详细错误信息）"
    info "请检查网络连接后重试"
    rm -rf "$tmp_dir"
    exit 1
  fi
  success "依赖安装完成"

  # 构建
  info "正在构建..."
  if ! npm run build 2>&1; then
    fail "构建失败（上方有详细错误信息）"
    rm -rf "$tmp_dir"
    exit 1
  fi
  success "构建完成"

  # 全局安装
  info "正在全局安装..."
  if ! npm install -g . 2>&1; then
    # 无权限时尝试 sudo
    warn "无权限，尝试 sudo..."
    if ! sudo npm install -g . 2>&1; then
      fail "全局安装失败"
      info "请手动运行: cd ${src_dir} && npm install -g ."
      exit 1
    fi
  fi

  # 确保 npm 全局 bin 在 PATH 中
  local npm_global_bin
  npm_global_bin="$(npm prefix -g 2>/dev/null)/bin"
  if [ -d "$npm_global_bin" ]; then
    export PATH="$npm_global_bin:$PATH"
    info "npm 全局目录: ${npm_global_bin}"
  fi

  rm -rf "$tmp_dir"
  success "OCM 安装完成"
}

# ── 6. 启动向导 ──

run_init() {
  # 确保 npm 全局 bin 目录在 PATH 中
  local npm_global_bin
  npm_global_bin="$(npm prefix -g 2>/dev/null)/bin"
  if [ -d "$npm_global_bin" ]; then
    export PATH="$npm_global_bin:$PATH"
  fi

  # 也确保 node home 在 PATH 中
  if [ -d "$HOME/.local/node/bin" ]; then
    export PATH="$HOME/.local/node/bin:$PATH"
  fi

  # 查找 ocm 实际路径
  local ocm_bin
  ocm_bin="$(command -v ocm 2>/dev/null || echo "")"

  # 常见位置搜索
  if [ -z "$ocm_bin" ]; then
    for try_path in \
      "$npm_global_bin/ocm" \
      "$HOME/.local/node/bin/ocm" \
      "$HOME/.local/node/lib/node_modules/.bin/ocm" \
      "/usr/local/bin/ocm"; do
      if [ -x "$try_path" ]; then
        ocm_bin="$try_path"
        break
      fi
    done
  fi

  printf "\n"
  printf "  ${GREEN}${BOLD}安装完成！${NC}\n"
  printf "\n"

  if [ -n "$ocm_bin" ]; then
    info "ocm 路径: ${ocm_bin}"
    printf "  正在启动配置向导...\n"
    printf "\n"
    exec "$ocm_bin" init
  else
    success "OCM 已安装，但需要打开新终端才能使用"
    printf "\n"
    info "请执行以下操作："
    info "  1. 关闭当前终端"
    info "  2. 打开新终端"
    info "  3. 运行: ocm init"
    printf "\n"
    info "或者在当前终端运行: source ~/.zshrc && ocm init"
  fi
}

# ── 主函数 ──

main() {
  printf "\n"
  printf "  ${CYAN}${BOLD}OCM — OpenClaw Manager${NC} v${VERSION}\n"
  printf "  ${DIM}curl 一行装好 OpenClaw，一条命令切模型${NC}\n"
  printf "\n"

  preflight_checks
  detect_network
  setup_mirrors
  ensure_nodejs
  install_ocm
  run_init
}

main "$@"
