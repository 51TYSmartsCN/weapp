#!/usr/bin/env bash
# GEO 课程项目开发环境管理脚本
# 用法：./scripts/dev.sh [command]
# 不传命令时默认执行 start
# 命令：
#   start     一键启动 Docker（MySQL）+ shared + 后端 + admin + miniapp
#   stop      停止 miniapp + admin + 后端 + shared + Docker 容器
#   restart   重启 miniapp + admin + 后端 + shared + Docker 容器
#   status    查看运行状态
#   logs      查看后端日志（默认）/ logs-admin / logs-miniapp / logs-shared
#   admin     单独启动 admin 后台服务
#   miniapp   单独启动小程序 watch 构建
#   shared    单独启动 @geo/shared watch 构建
#   seed      导入初始数据到数据库
#   down      停止并删除 Docker 容器与数据卷（⚠️ 清空数据库）
#   help      显示帮助

set -e

# 项目根目录（脚本位于 scripts/ 下，向上取一层）
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVER_DIR="$PROJECT_ROOT/apps/server"
ADMIN_DIR="$PROJECT_ROOT/apps/admin"
MINIAPP_DIR="$PROJECT_ROOT/apps/miniapp"
SHARED_DIR="$PROJECT_ROOT/packages/shared"
COMPOSE_FILE="$PROJECT_ROOT/docker-compose.yml"

# admin 后台服务端口（与 apps/admin/vite.config.ts 中 server.port 保持一致）
ADMIN_PORT=4005

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step()  { echo -e "${BLUE}==>${NC} $1"; }

# 后端进程 PID 文件
PID_FILE="$PROJECT_ROOT/.dev-server.pid"

# admin 后台进程 PID 文件与日志
ADMIN_PID_FILE="$PROJECT_ROOT/.dev-admin.pid"
ADMIN_LOG_FILE="$PROJECT_ROOT/.dev-admin.log"

# miniapp watch 进程 PID 文件与日志
MINIAPP_PID_FILE="$PROJECT_ROOT/.dev-miniapp.pid"
MINIAPP_LOG_FILE="$PROJECT_ROOT/.dev-miniapp.log"

# shared watch 进程 PID 文件与日志
SHARED_PID_FILE="$PROJECT_ROOT/.dev-shared.pid"
SHARED_LOG_FILE="$PROJECT_ROOT/.dev-shared.log"

# 启动 Docker MySQL 容器
start_docker() {
  log_step "启动 Docker MySQL 容器..."
  docker compose -f "$COMPOSE_FILE" up -d
  log_info "等待 MySQL 就绪..."
  # 等待健康检查通过
  for i in $(seq 1 30); do
    local status
    status=$(docker inspect --format='{{.State.Health.Status}}' geo-mysql 2>/dev/null || echo "starting")
    if [ "$status" = "healthy" ]; then
      log_info "MySQL 已就绪"
      return 0
    fi
    printf "." >&2
    sleep 2
  done
  echo "" >&2
  log_error "MySQL 启动超时"
  return 1
}

# 停止 Docker 容器
stop_docker() {
  log_step "停止 Docker 容器..."
  docker compose -f "$COMPOSE_FILE" stop
  log_info "Docker 容器已停止"
}

# 检查后端是否在运行
is_server_running() {
  if [ -f "$PID_FILE" ]; then
    local pid
    pid=$(cat "$PID_FILE")
    if kill -0 "$pid" 2>/dev/null; then
      return 0
    fi
    # 进程不存在，清理 stale pid 文件
    rm -f "$PID_FILE"
  fi
  return 1
}

# 启动后端服务（后台运行，PID 写入文件）
start_server() {
  if is_server_running; then
    log_warn "后端服务已在运行 (PID: $(cat "$PID_FILE"))"
    return 0
  fi

  log_step "启动后端服务..."
  cd "$SERVER_DIR"

  # 确保依赖已安装
  if [ ! -d "node_modules" ]; then
    log_info "首次运行，安装依赖..."
    pnpm install
  fi

  # 后台启动，日志重定向到文件
  nohup pnpm run dev > "$PROJECT_ROOT/.dev-server.log" 2>&1 &
  local pid=$!
  echo "$pid" > "$PID_FILE"

  # 等待服务就绪（最多 20 秒）
  log_info "等待后端服务就绪..."
  for i in $(seq 1 20); do
    if curl -s http://localhost:4000/api/health > /dev/null 2>&1; then
      log_info "后端服务已启动 (PID: $pid)"
      log_info "  地址: http://localhost:4000"
      log_info "  日志: tail -f $PROJECT_ROOT/.dev-server.log"
      return 0
    fi
    sleep 1
  done
  log_error "后端服务启动超时，请查看日志: $PROJECT_ROOT/.dev-server.log"
  return 1
}

# 停止后端服务
stop_server() {
  if ! is_server_running; then
    log_warn "后端服务未运行"
    return 0
  fi

  local pid
  pid=$(cat "$PID_FILE")
  log_step "停止后端服务 (PID: $pid)..."
  kill "$pid" 2>/dev/null || true
  # 等待进程退出
  for i in $(seq 1 10); do
    if ! kill -0 "$pid" 2>/dev/null; then
      break
    fi
    sleep 0.5
  done
  # 强制清理 ts-node-dev 子进程
  pkill -P "$pid" 2>/dev/null || true
  rm -f "$PID_FILE"
  log_info "后端服务已停止"
}

# 检查 admin 后台是否在运行
is_admin_running() {
  if [ -f "$ADMIN_PID_FILE" ]; then
    local pid
    pid=$(cat "$ADMIN_PID_FILE")
    if kill -0 "$pid" 2>/dev/null; then
      return 0
    fi
    # 进程不存在，清理 stale pid 文件
    rm -f "$ADMIN_PID_FILE"
  fi
  return 1
}

# 启动 admin 后台服务（后台运行，PID 写入文件）
start_admin() {
  if is_admin_running; then
    log_warn "admin 后台已在运行 (PID: $(cat "$ADMIN_PID_FILE"))"
    return 0
  fi

  if [ ! -d "$ADMIN_DIR" ]; then
    log_error "admin 目录不存在: $ADMIN_DIR"
    return 1
  fi

  log_step "启动 admin 后台服务..."
  cd "$ADMIN_DIR"

  # 确保依赖已安装
  if [ ! -d "node_modules" ]; then
    log_info "首次运行，安装依赖..."
    pnpm install
  fi

  # 后台启动，日志重定向到文件
  nohup pnpm run dev > "$ADMIN_LOG_FILE" 2>&1 &
  local pid=$!
  echo "$pid" > "$ADMIN_PID_FILE"

  # 等待服务就绪（最多 30 秒）
  log_info "等待 admin 后台就绪..."
  for i in $(seq 1 30); do
    if curl -s "http://localhost:$ADMIN_PORT" > /dev/null 2>&1; then
      log_info "admin 后台已启动 (PID: $pid)"
      log_info "  地址: http://localhost:$ADMIN_PORT"
      log_info "  日志: tail -f $ADMIN_LOG_FILE"
      return 0
    fi
    sleep 1
  done
  log_error "admin 后台启动超时，请查看日志: $ADMIN_LOG_FILE"
  return 1
}

# 停止 admin 后台服务
stop_admin() {
  if ! is_admin_running; then
    log_warn "admin 后台未运行"
    return 0
  fi

  local pid
  pid=$(cat "$ADMIN_PID_FILE")
  log_step "停止 admin 后台服务 (PID: $pid)..."
  kill "$pid" 2>/dev/null || true
  # 等待进程退出
  for i in $(seq 1 10); do
    if ! kill -0 "$pid" 2>/dev/null; then
      break
    fi
    sleep 0.5
  done
  # 强制清理 vite 子进程
  pkill -P "$pid" 2>/dev/null || true
  rm -f "$ADMIN_PID_FILE"
  log_info "admin 后台服务已停止"
}

# 检查 shared watch 是否在运行
is_shared_running() {
  if [ -f "$SHARED_PID_FILE" ]; then
    local pid
    pid=$(cat "$SHARED_PID_FILE")
    if kill -0 "$pid" 2>/dev/null; then
      return 0
    fi
    rm -f "$SHARED_PID_FILE"
  fi
  return 1
}

# 启动 @geo/shared watch 构建（tsc --watch）
start_shared() {
  if is_shared_running; then
    log_warn "shared watch 已在运行 (PID: $(cat "$SHARED_PID_FILE"))"
    return 0
  fi

  if [ ! -d "$SHARED_DIR" ]; then
    log_error "shared 目录不存在: $SHARED_DIR"
    return 1
  fi

  log_step "启动 @geo/shared watch 构建..."
  cd "$SHARED_DIR"

  if [ ! -d "node_modules" ]; then
    log_info "首次运行，安装依赖..."
    pnpm install
  fi

  # 首次构建产物不存在时先同步构建一次，避免下游消费方拿到空 dist
  if [ ! -f "dist/index.js" ]; then
    log_info "首次构建 shared 产物..."
    pnpm run build
  fi

  nohup pnpm run dev > "$SHARED_LOG_FILE" 2>&1 &
  local pid=$!
  echo "$pid" > "$SHARED_PID_FILE"

  # 等待 watch 进程稳定（最多 10 秒）
  for i in $(seq 1 10); do
    if ! kill -0 "$pid" 2>/dev/null; then
      log_error "shared watch 进程意外退出，请查看日志: $SHARED_LOG_FILE"
      rm -f "$SHARED_PID_FILE"
      return 1
    fi
    if [ -f "dist/index.js" ]; then
      log_info "shared watch 已启动 (PID: $pid)"
      log_info "  日志: tail -f $SHARED_LOG_FILE"
      return 0
    fi
    sleep 1
  done
  log_info "shared watch 已启动 (PID: $pid)"
  log_info "  日志: tail -f $SHARED_LOG_FILE"
}

# 停止 shared watch
stop_shared() {
  if ! is_shared_running; then
    log_warn "shared watch 未运行"
    return 0
  fi

  local pid
  pid=$(cat "$SHARED_PID_FILE")
  log_step "停止 shared watch (PID: $pid)..."
  kill "$pid" 2>/dev/null || true
  for i in $(seq 1 10); do
    if ! kill -0 "$pid" 2>/dev/null; then
      break
    fi
    sleep 0.5
  done
  pkill -P "$pid" 2>/dev/null || true
  rm -f "$SHARED_PID_FILE"
  log_info "shared watch 已停止"
}

# 检查 miniapp watch 是否在运行
is_miniapp_running() {
  if [ -f "$MINIAPP_PID_FILE" ]; then
    local pid
    pid=$(cat "$MINIAPP_PID_FILE")
    if kill -0 "$pid" 2>/dev/null; then
      return 0
    fi
    rm -f "$MINIAPP_PID_FILE"
  fi
  return 1
}

# 启动小程序 watch 构建（taro build --type weapp --watch）
start_miniapp() {
  if is_miniapp_running; then
    log_warn "miniapp watch 已在运行 (PID: $(cat "$MINIAPP_PID_FILE"))"
    return 0
  fi

  if [ ! -d "$MINIAPP_DIR" ]; then
    log_error "miniapp 目录不存在: $MINIAPP_DIR"
    return 1
  fi

  log_step "启动小程序 watch 构建..."
  cd "$MINIAPP_DIR"

  if [ ! -d "node_modules" ]; then
    log_info "首次运行，安装依赖..."
    pnpm install
  fi

  nohup pnpm run dev:weapp > "$MINIAPP_LOG_FILE" 2>&1 &
  local pid=$!
  echo "$pid" > "$MINIAPP_PID_FILE"

  # Taro 首次构建较慢，最多等待 120 秒，以 dist/app.json 出现为就绪标志
  log_info "等待小程序首次构建完成（最多 120 秒）..."
  for i in $(seq 1 120); do
    if ! kill -0 "$pid" 2>/dev/null; then
      log_error "miniapp watch 进程意外退出，请查看日志: $MINIAPP_LOG_FILE"
      rm -f "$MINIAPP_PID_FILE"
      return 1
    fi
    if [ -f "$MINIAPP_DIR/dist/app.json" ]; then
      log_info "miniapp watch 已启动 (PID: $pid)"
      log_info "  产物: $MINIAPP_DIR/dist/"
      log_info "  日志: tail -f $MINIAPP_LOG_FILE"
      log_info "  预览: 用微信开发者工具导入 $MINIAPP_DIR 目录"
      return 0
    fi
    sleep 1
  done
  log_warn "miniapp watch 仍在构建中，可在微信开发者工具中等待产物生成"
  log_info "  日志: tail -f $MINIAPP_LOG_FILE"
}

# 停止 miniapp watch
stop_miniapp() {
  if ! is_miniapp_running; then
    log_warn "miniapp watch 未运行"
    return 0
  fi

  local pid
  pid=$(cat "$MINIAPP_PID_FILE")
  log_step "停止 miniapp watch (PID: $pid)..."
  kill "$pid" 2>/dev/null || true
  for i in $(seq 1 10); do
    if ! kill -0 "$pid" 2>/dev/null; then
      break
    fi
    sleep 0.5
  done
  # 强制清理 webpack/taro 子进程
  pkill -P "$pid" 2>/dev/null || true
  rm -f "$MINIAPP_PID_FILE"
  log_info "miniapp watch 已停止"
}

# 显示状态
show_status() {
  echo -e "${BLUE}=== GEO 课程开发环境状态 ===${NC}"
  echo ""

  # Docker 状态
  echo -e "${BLUE}[Docker MySQL]${NC}"
  local docker_status
  docker_status=$(docker inspect --format='{{.State.Status}} ({{.State.Health.Status}})' geo-mysql 2>/dev/null || echo "未创建")
  echo "  容器: $docker_status"
  echo "  端口: 3307 → 3306"
  echo ""

  # 后端状态
  echo -e "${BLUE}[后端服务]${NC}"
  if is_server_running; then
    local pid
    pid=$(cat "$PID_FILE")
    echo "  状态: 运行中 (PID: $pid)"
    echo "  地址: http://localhost:4000"
    # 测试健康检查
    if curl -s http://localhost:4000/api/health > /dev/null 2>&1; then
      echo "  健康: OK"
    else
      echo "  健康: 无响应"
    fi
  else
    echo "  状态: 未运行"
  fi
  echo ""

  # admin 后台状态
  echo -e "${BLUE}[admin 后台]${NC}"
  if is_admin_running; then
    local admin_pid
    admin_pid=$(cat "$ADMIN_PID_FILE")
    echo "  状态: 运行中 (PID: $admin_pid)"
    echo "  地址: http://localhost:$ADMIN_PORT"
    if curl -s "http://localhost:$ADMIN_PORT" > /dev/null 2>&1; then
      echo "  健康: OK"
    else
      echo "  健康: 无响应"
    fi
  else
    echo "  状态: 未运行"
  fi
  echo ""

  # shared watch 状态
  echo -e "${BLUE}[@geo/shared watch]${NC}"
  if is_shared_running; then
    local shared_pid
    shared_pid=$(cat "$SHARED_PID_FILE")
    echo "  状态: 运行中 (PID: $shared_pid)"
    if [ -f "$SHARED_DIR/dist/index.js" ]; then
      echo "  产物: 已构建"
    else
      echo "  产物: 缺失"
    fi
  else
    echo "  状态: 未运行"
  fi
  echo ""

  # miniapp watch 状态
  echo -e "${BLUE}[小程序 watch]${NC}"
  if is_miniapp_running; then
    local miniapp_pid
    miniapp_pid=$(cat "$MINIAPP_PID_FILE")
    echo "  状态: 运行中 (PID: $miniapp_pid)"
    if [ -f "$MINIAPP_DIR/dist/app.json" ]; then
      echo "  产物: 已构建"
    else
      echo "  产物: 构建中"
    fi
    echo "  产物目录: $MINIAPP_DIR/dist/"
  else
    echo "  状态: 未运行"
  fi
  echo ""

  # 数据库连接测试
  echo -e "${BLUE}[数据库连接]${NC}"
  if docker exec geo-mysql mysql -uroot -pgeo_root_2024 -e "SELECT COUNT(*) AS courses FROM geo_course.courses;" 2>/dev/null | grep -q courses; then
    local count
    count=$(docker exec geo-mysql mysql -uroot -pgeo_root_2024 -N -e "SELECT COUNT(*) FROM geo_course.courses;" 2>/dev/null)
    echo "  连接: OK"
    echo "  courses 表: $count 条"
  else
    echo "  连接: 失败或未初始化"
  fi
}

# 执行 seed 脚本
run_seed() {
  if ! docker inspect geo-mysql > /dev/null 2>&1; then
    log_error "MySQL 容器未运行，请先执行: ./scripts/dev.sh start"
    exit 1
  fi
  log_step "导入初始数据..."
  cd "$SERVER_DIR"
  pnpm exec ts-node src/seed.ts
}

# 查看日志：默认后端日志，传入 admin/miniapp/shared 查看对应日志
show_logs() {
  local target="${1:-server}"
  local log_file
  case "$target" in
    admin)
      log_file="$ADMIN_LOG_FILE"
      log_info "admin 后台实时日志（Ctrl+C 退出）..."
      ;;
    miniapp)
      log_file="$MINIAPP_LOG_FILE"
      log_info "小程序 watch 实时日志（Ctrl+C 退出）..."
      ;;
    shared)
      log_file="$SHARED_LOG_FILE"
      log_info "shared watch 实时日志（Ctrl+C 退出）..."
      ;;
    *)
      log_file="$PROJECT_ROOT/.dev-server.log"
      log_info "后端实时日志（Ctrl+C 退出）..."
      ;;
  esac
  if [ ! -f "$log_file" ]; then
    log_warn "日志文件不存在: $log_file"
    exit 1
  fi
  tail -f "$log_file"
}

# 完全销毁（停止 + 删除容器 + 删除数据卷）
down_all() {
  log_warn "⚠️  此操作将删除所有数据！"
  read -p "确认删除？(y/N) " confirm
  if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
    log_info "已取消"
    exit 0
  fi
  stop_miniapp
  stop_admin
  stop_server
  stop_shared
  log_step "删除 Docker 容器与数据卷..."
  docker compose -f "$COMPOSE_FILE" down -v
  log_info "已清理，重新开始请执行: ./scripts/dev.sh start && ./scripts/dev.sh seed"
}

# 显示帮助
show_help() {
  cat <<EOF
${BLUE}GEO 课程项目开发环境管理脚本${NC}

${GREEN}用法:${NC}
  ./scripts/dev.sh [command]   # 不传 command 时默认执行 start

${GREEN}命令:${NC}
  ${BLUE}start${NC}            一键启动 Docker + shared + 后端 + admin + miniapp
  ${BLUE}stop${NC}             停止 miniapp + admin + 后端 + shared + Docker 容器
  ${BLUE}restart${NC}          重启 miniapp + admin + 后端 + shared + Docker 容器
  ${BLUE}status${NC}           查看运行状态（含数据库连接测试）
  ${BLUE}logs${NC}             查看后端实时日志
  ${BLUE}logs-admin${NC}       查看 admin 后台实时日志
  ${BLUE}logs-miniapp${NC}     查看小程序 watch 实时日志
  ${BLUE}logs-shared${NC}      查看 shared watch 实时日志
  ${BLUE}admin${NC}            单独启动 admin 后台服务
  ${BLUE}admin-stop${NC}       单独停止 admin 后台服务
  ${BLUE}miniapp${NC}          单独启动小程序 watch 构建
  ${BLUE}miniapp-stop${NC}     单独停止小程序 watch 构建
  ${BLUE}shared${NC}           单独启动 @geo/shared watch 构建
  ${BLUE}shared-stop${NC}      单独停止 @geo/shared watch 构建
  ${BLUE}seed${NC}             导入初始数据到数据库
  ${BLUE}down${NC}             停止并删除容器与数据卷（⚠️ 清空数据库）
  ${BLUE}help${NC}             显示此帮助

${GREEN}端口:${NC}
  MySQL      3307 → 3306 (Docker)
  后端服务    4000  (geo-course-server)
  admin 后台  $ADMIN_PORT  (Vite)
  miniapp    产物输出到 apps/miniapp/dist/（用微信开发者工具导入）

${GREEN}示例:${NC}
  # 一键拉起全部服务（MySQL + shared + 后端 + admin + 小程序）
  ./scripts/dev.sh start

  # 导入测试数据
  ./scripts/dev.sh seed

  # 查看状态
  ./scripts/dev.sh status

  # 重启
  ./scripts/dev.sh restart

  # 单独管理 admin
  ./scripts/dev.sh admin         # 启动
  ./scripts/dev.sh admin-stop    # 停止
  ./scripts/dev.sh logs-admin    # 查看日志

  # 单独管理小程序
  ./scripts/dev.sh miniapp         # 启动
  ./scripts/dev.sh miniapp-stop    # 停止
  ./scripts/dev.sh logs-miniapp    # 查看日志

  # 单独管理 shared
  ./scripts/dev.sh shared         # 启动
  ./scripts/dev.sh shared-stop    # 停止
  ./scripts/dev.sh logs-shared    # 查看日志

  # 完全清理
  ./scripts/dev.sh down
EOF
}

# 主入口（无参数时默认 start）
case "${1:-start}" in
  start)
    start_docker
    start_shared
    start_server
    start_admin
    start_miniapp
    ;;
  stop)
    stop_miniapp
    stop_admin
    stop_server
    stop_shared
    stop_docker
    ;;
  restart)
    stop_miniapp
    stop_admin
    stop_server
    stop_shared
    stop_docker
    start_docker
    start_shared
    start_server
    start_admin
    start_miniapp
    ;;
  status)
    show_status
    ;;
  logs)
    show_logs server
    ;;
  logs-admin)
    show_logs admin
    ;;
  logs-miniapp)
    show_logs miniapp
    ;;
  logs-shared)
    show_logs shared
    ;;
  admin)
    start_admin
    ;;
  admin-stop)
    stop_admin
    ;;
  miniapp)
    start_miniapp
    ;;
  miniapp-stop)
    stop_miniapp
    ;;
  shared)
    start_shared
    ;;
  shared-stop)
    stop_shared
    ;;
  seed)
    run_seed
    ;;
  down)
    down_all
    ;;
  help|--help|-h)
    show_help
    ;;
  *)
    log_error "未知命令: $1"
    echo ""
    show_help
    exit 1
    ;;
esac
