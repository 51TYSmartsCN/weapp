import mysql from 'mysql2/promise'
import { dbConfig } from './config'

// 创建连接池，支持 pool.execute(sql, params) 和 pool.query(sql, params)
export const pool = mysql.createPool(dbConfig)
