export const mysqlSchema=[
  `CREATE TABLE IF NOT EXISTS leads (
    id CHAR(36) PRIMARY KEY, name VARCHAR(100) NOT NULL, phone VARCHAR(20) NOT NULL,
    vehicle VARCHAR(100) NOT NULL, category VARCHAR(80) NOT NULL, services TEXT NOT NULL,
    date VARCHAR(10) NOT NULL, time VARCHAR(5) NOT NULL, message TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Novo', notes TEXT NOT NULL,
    created_at VARCHAR(32) NOT NULL, consented_at VARCHAR(32) NOT NULL,
    INDEX idx_leads_created_at (created_at), INDEX idx_leads_status (status),
    INDEX idx_leads_agenda (date,time)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  'CREATE TABLE IF NOT EXISTS sessions (token CHAR(64) PRIMARY KEY, expires BIGINT NOT NULL, INDEX idx_sessions_expires (expires)) ENGINE=InnoDB',
  'CREATE TABLE IF NOT EXISTS attempts (`key` VARCHAR(191) PRIMARY KEY, `count` INT NOT NULL, expires BIGINT NOT NULL, INDEX idx_attempts_expires (expires)) ENGINE=InnoDB',
  'CREATE TABLE IF NOT EXISTS push_subscriptions (id CHAR(64) PRIMARY KEY, endpoint TEXT NOT NULL, p256dh VARCHAR(256) NOT NULL, auth VARCHAR(128) NOT NULL, created_at VARCHAR(32) NOT NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
];
export const sqliteSchema=[
  `CREATE TABLE IF NOT EXISTS leads (id TEXT PRIMARY KEY,name TEXT NOT NULL,phone TEXT NOT NULL,vehicle TEXT NOT NULL,category TEXT NOT NULL,services TEXT NOT NULL,date TEXT NOT NULL,time TEXT NOT NULL,message TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'Novo',notes TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL,consented_at TEXT NOT NULL)`,
  'CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY,expires INTEGER NOT NULL)',
  'CREATE TABLE IF NOT EXISTS attempts (key TEXT PRIMARY KEY,count INTEGER NOT NULL,expires INTEGER NOT NULL)',
  'CREATE TABLE IF NOT EXISTS push_subscriptions (id TEXT PRIMARY KEY,endpoint TEXT NOT NULL,p256dh TEXT NOT NULL,auth TEXT NOT NULL,created_at TEXT NOT NULL)',
  'CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at)',
  'CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status)',
  'CREATE INDEX IF NOT EXISTS idx_leads_agenda ON leads(date,time)',
];
