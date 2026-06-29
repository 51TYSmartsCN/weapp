module.exports = {
  apps: [
    {
      name: 'geo-course-server',
      cwd: '/opt/geo-course/weapp',
      script: '/opt/geo-course/weapp/deploy/t0ops/start-geo-course-server.sh',
      interpreter: 'bash',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '256M',
      out_file: '/opt/geo-course/logs/server.stdout.log',
      error_file: '/opt/geo-course/logs/server.stderr.log',
      time: true,
      autorestart: true,
      restart_delay: 5000,
    },
  ],
}
