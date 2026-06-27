#!/usr/bin/env bash
# GEO 课程项目开发环境管理脚本
# 用法：./scripts/dev.sh [command]
# 不传命令时默认执行 start
# 命令：
#   start     启动 Docker（MySQL）+ 后端服务 + admin 后台（前台）
#   stop      停止后端服务 + admin 后台 + Docker 容器
#   restart   重启后端服务 + admin 后台 + Docker 容器
#   status    查看运行状态
#   logs      查看后端日志（默认）/ 使用 logs-admin 查看 admin 日志
#   admin     单独启动 admin 后台服务
#   seed      导入初始数据到数据库
#   down      停止并删除 Docker 容器与数据卷（⚠️ 清空数据库）
#   help      显示帮助

set -e

# 项目根目录（脚本位于 scripts/ 下，向上取一层）
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVER_DIR="$PROJECT_ROOT/apps/server"
ADMIN_DIR="$PROJECT_ROOT/apps/admin"
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

# 查看日志：默认后端日志，传入 admin 查看 admin 日志
show_logs() {
  local target="${1:-server}"
  local log_file
  if [ "$target" = "admin" ]; then
    log_file="$ADMIN_LOG_FILE"
    log_info "admin 后台实时日志（Ctrl+C 退出）..."
  else
    log_file="$PROJECT_ROOT/.dev-server.log"
    log_info "后端实时日志（Ctrl+C 退出）..."
  fi
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
  stop_admin
  stop_server
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
  ${BLUE}start${NC}         启动 Docker（MySQL）+ 后端服务 + admin 后台
  ${BLUE}stop${NC}          停止 admin 后台 + 后端服务 + Docker 容器
  ${BLUE}restart${NC}       重启 admin 后台 + 后端服务 + Docker 容器
  ${BLUE}status${NC}        查看运行状态（含数据库连接测试）
  ${BLUE}logs${NC}          查看后端实时日志
  ${BLUE}logs-admin${NC}    查看 admin 后台实时日志
  ${BLUE}admin${NC}         单独启动 admin 后台服务
  ${BLUE}admin-stop${NC}    单独停止 admin 后台服务
  ${BLUE}seed${NC}          导入初始数据到数据库
  ${BLUE}down${NC}          停止并删除容器与数据卷（⚠️ 清空数据库）
  ${BLUE}help${NC}          显示此帮助

${GREEN}端口:${NC}
  MySQL      3307 → 3306 (Docker)
  后端服务    4000  (geo-course-server)
  admin 后台  $ADMIN_PORT  (Vite)

${GREEN}示例:${NC}
  # 首次启动（一次性拉起 MySQL + 后端 + admin）
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

  # 完全清理
  ./scripts/dev.sh down
EOF
}

# 主入口（无参数时默认 start）
case "${1:-start}" in
  start)
    start_docker
    start_server
    start_admin
    ;;
  stop)
    stop_admin
    stop_server
    stop_docker
    ;;
  restart)
    stop_admin
    stop_server
    stop_docker
    start_docker
    start_server
    start_admin
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
  admin)
    start_admin
    ;;
  admin-stop)
    stop_admin
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
