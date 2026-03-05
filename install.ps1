#Requires -Version 5.1
# ===================================================================
# OCM — OpenClaw Manager Windows 安装脚本
# 一行命令安装 OpenClaw + 配置模型
#
# 用法:
#   irm https://raw.githubusercontent.com/xpangjia/ocm/main/install.ps1 | iex
#
# 环境变量（可选）:
#   OCM_MIRROR        自定义 npm 镜像
#   NONINTERACTIVE=1  无人值守模式
# ===================================================================

$ErrorActionPreference = "Stop"
$VERSION = "0.1.0"
$REQUIRED_NODE_MAJOR = 22
$IS_CHINA = $false

# ── 输出函数 ──

function Write-Step($msg)    { Write-Host "`n  $msg" -ForegroundColor White }
function Write-Success($msg) { Write-Host "  ✔ $msg" -ForegroundColor Green }
function Write-Warn($msg)    { Write-Host "  ⚠ $msg" -ForegroundColor Yellow }
function Write-Fail($msg)    { Write-Host "  ✘ $msg" -ForegroundColor Red }
function Write-Info($msg)    { Write-Host "  ℹ $msg" -ForegroundColor Cyan }

# ── 1. 环境检测 ──

function Test-Preflight {
    Write-Step "[1/4] 环境检测"

    $arch = if ([Environment]::Is64BitOperatingSystem) { "x64" } else { "x86" }
    $winVer = [Environment]::OSVersion.Version
    Write-Info "系统: Windows $winVer ($arch)"
    Write-Success "PowerShell $($PSVersionTable.PSVersion)"
}

# ── 2. 网络检测 ──

function Test-Network {
    Write-Step "[2/4] 网络检测"

    try {
        $null = Invoke-WebRequest -Uri "https://registry.npmjs.org" -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
        $script:IS_CHINA = $false
        Write-Success "可直连国际源"
    } catch {
        $script:IS_CHINA = $true
        Write-Warn "国际源不可达，自动切换国内镜像"
    }
}

# ── 3. 检测/安装 Node.js ──

function Install-NodeJS {
    Write-Step "[3/4] 检测 Node.js"

    # 检查现有安装
    try {
        $nodeVer = & node --version 2>$null
        if ($nodeVer) {
            $major = [int]($nodeVer -replace '^v(\d+)\..*', '$1')
            if ($major -ge $REQUIRED_NODE_MAJOR) {
                Write-Success "Node.js $nodeVer 已安装"
                return
            }
            Write-Warn "Node.js $nodeVer 版本过低（需要 >= $REQUIRED_NODE_MAJOR）"
        }
    } catch {
        Write-Warn "未找到 Node.js"
    }

    Write-Info "正在安装 Node.js $REQUIRED_NODE_MAJOR..."

    # 尝试 winget
    try {
        $null = Get-Command winget -ErrorAction Stop
        Write-Info "使用 winget 安装..."
        & winget install OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements 2>&1 | Out-Null
        # 刷新 PATH
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")

        try {
            $newVer = & node --version 2>$null
            if ($newVer) {
                Write-Success "Node.js $newVer 安装完成 (via winget)"
                return
            }
        } catch {}
    } catch {}

    # 尝试 nvm-windows
    try {
        $null = Get-Command nvm -ErrorAction Stop
        Write-Info "使用 nvm 安装..."
        & nvm install $REQUIRED_NODE_MAJOR 2>&1 | Out-Null
        & nvm use $REQUIRED_NODE_MAJOR 2>&1 | Out-Null
        Write-Success "Node.js 安装完成 (via nvm)"
        return
    } catch {}

    # 都不行
    Write-Fail "无法自动安装 Node.js"
    Write-Fail "请手动安装 Node.js >= $REQUIRED_NODE_MAJOR："
    Write-Fail "  方式 1: https://nodejs.org/en/download/"
    Write-Fail "  方式 2: winget install OpenJS.NodeJS.LTS"
    Write-Fail "  方式 3: 安装 nvm-windows → nvm install $REQUIRED_NODE_MAJOR"
    exit 1
}

# ── 4. 安装 OCM ──

function Install-OCM {
    Write-Step "[4/4] 安装 OCM"

    # 检查是否已安装
    try {
        $ocmVer = & ocm --version 2>$null
        if ($ocmVer) {
            Write-Success "OCM $ocmVer 已安装，跳过"
            return
        }
    } catch {}

    # 国内镜像
    if ($IS_CHINA) {
        $mirror = if ($env:OCM_MIRROR) { $env:OCM_MIRROR } else { "https://registry.npmmirror.com" }
        & npm config set registry $mirror 2>$null
        Write-Success "npm 镜像: $mirror"
    }

    Write-Info "正在安装 OCM..."

    $maxRetries = 3
    for ($i = 1; $i -le $maxRetries; $i++) {
        try {
            & npm install -g github:xpangjia/ocm 2>&1 | Out-Null
            if ($LASTEXITCODE -eq 0) {
                Write-Success "OCM 安装完成"
                return
            }
        } catch {}
        if ($i -lt $maxRetries) {
            Write-Warn "失败，重试中 ($i/$maxRetries)..."
            Start-Sleep -Seconds 2
        }
    }

    Write-Fail "OCM 安装失败"
    Write-Fail "请检查网络连接，或手动运行:"
    Write-Fail "  npm install -g github:xpangjia/ocm"
    exit 1
}

# ── 主流程 ──

function Main {
    Write-Host ""
    Write-Host "  OCM — OpenClaw Manager v$VERSION" -ForegroundColor Cyan
    Write-Host "  curl 一行装好 OpenClaw，一条命令切模型" -ForegroundColor DarkGray
    Write-Host ""

    Test-Preflight
    Test-Network
    Install-NodeJS
    Install-OCM

    Write-Host ""
    Write-Host "  安装完成！" -ForegroundColor Green -NoNewline
    Write-Host "正在启动配置向导..."
    Write-Host ""

    & ocm init
}

Main
