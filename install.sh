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

# ── 输出函数 ──

info()    { echo -e "  ${CYAN}ℹ${NC} $1"; }
success() { echo -e "  ${GREEN}✔${NC} $1"; }
warn()    { echo -e "  ${YELLOW}⚠${NC} $1"; }
fail()    { echo -e "  ${RED}✘${NC} $1"; }
step()    { echo -e "\n  ${BOLD}$1${NC}"; }

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
    *)
      fail "不支持的操作系统: $os"
      fail "OCM 目前只支持 macOS 和 Linux"
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

  # 优先用 fnm
  if command_exists fnm; then
    info "使用 fnm 安装..."
    fnm install "$REQUIRED_NODE_MAJOR"
    fnm use "$REQUIRED_NODE_MAJOR"
    eval "$(fnm env)"
    success "Node.js $(node --version) 安装完成 (via fnm)"
    return
  fi

  # 其次用 nvm
  if command_exists nvm || [ -s "$HOME/.nvm/nvm.sh" ]; then
    [ -s "$HOME/.nvm/nvm.sh" ] && . "$HOME/.nvm/nvm.sh"
    info "使用 nvm 安装..."
    nvm install "$REQUIRED_NODE_MAJOR"
    nvm use "$REQUIRED_NODE_MAJOR"
    success "Node.js $(node --version) 安装完成 (via nvm)"
    return
  fi

  # 都没有，安装 fnm
  info "正在安装 fnm (Fast Node Manager)..."

  if [ "$(uname -s)" = "Darwin" ] && command_exists brew; then
    brew install fnm
  else
    local fnm_url="https://fnm.vercel.app/install"
    if [ "$IS_CHINA" = true ]; then
      local proxy="${OCM_GITHUB_PROXY:-https://ghfast.top/}"
      # fnm 安装脚本从 GitHub 下载，走代理
      curl -fsSL "$fnm_url" | bash -s -- --skip-shell
    else
      curl -fsSL "$fnm_url" | bash -s -- --skip-shell
    fi
  fi

  # 加载 fnm
  export PATH="$HOME/.local/share/fnm:$PATH"
  eval "$(fnm env)" 2>/dev/null || true

  if ! command_exists fnm; then
    fail "fnm 安装失败"
    fail "请手动安装 Node.js ≥ $REQUIRED_NODE_MAJOR: https://nodejs.org/"
    exit 1
  fi

  fnm install "$REQUIRED_NODE_MAJOR"
  fnm use "$REQUIRED_NODE_MAJOR"
  eval "$(fnm env)"
  success "Node.js $(node --version) 安装完成"
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

  # 优先从 GitHub 安装（无需 npm publish）
  if ! retry 3 npm install -g github:xpangjia/ocm; then
    fail "OCM 安装失败"
    fail "请检查网络连接，或手动运行: npm install -g github:xpangjia/ocm"
    exit 1
  fi

  success "OCM 安装完成"
}

# ── 6. 启动向导 ──

run_init() {
  echo ""
  echo -e "  ${GREEN}${BOLD}安装完成！${NC}正在启动配置向导..."
  echo ""
  exec ocm init
}

# ── 主函数 ──

main() {
  echo ""
  echo -e "  ${CYAN}${BOLD}OCM — OpenClaw Manager${NC} v${VERSION}"
  echo -e "  ${DIM}curl 一行装好 OpenClaw，一条命令切模型${NC}"
  echo ""

  preflight_checks
  detect_network
  setup_mirrors
  ensure_nodejs
  install_ocm
  run_init
}

main "$@"
