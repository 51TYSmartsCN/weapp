-- 微信小店支付闭环：用 unionid 归并小程序用户与小店支付用户。
-- MySQL 8.0 的 ALTER TABLE ADD INDEX 不支持 IF NOT EXISTS，这里通过 information_schema 做幂等判断。

SET @idx_unionid_exists := (
  SELECT COUNT(1)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'users'
    AND index_name = 'idx_unionid'
);

SET @idx_unionid_sql := IF(
  @idx_unionid_exists = 0,
  'ALTER TABLE `users` ADD INDEX `idx_unionid` (`unionid`)',
  'SELECT 1'
);

PREPARE idx_unionid_stmt FROM @idx_unionid_sql;
EXECUTE idx_unionid_stmt;
DEALLOCATE PREPARE idx_unionid_stmt;
