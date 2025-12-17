/*
Copyright 2025 linux.do

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package db

import (
	"context"
	"log"
	"net"
	"net/url"
	"strconv"
	"time"

	"github.com/linux-do/pay/internal/config"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"gorm.io/plugin/opentelemetry/tracing"
)

var (
	db *gorm.DB
)

func init() {
	if !config.Config.Database.Enabled {
		log.Println("[PostgreSQL] is disabled, skipping initialization")
		return
	}

	var err error

	dbConfig := config.Config.Database
	pqURL := &url.URL{
		Scheme: "postgres",
		Host:   net.JoinHostPort(dbConfig.Host, strconv.Itoa(dbConfig.Port)),
		Path:   dbConfig.Database,
	}
	if dbConfig.Username != "" {
		pqURL.User = url.UserPassword(dbConfig.Username, dbConfig.Password)
	}

	query := pqURL.Query()
	sslMode := dbConfig.SSLMode
	if sslMode == "" {
		sslMode = "disable"
	}
	query.Set("sslmode", sslMode)
	if dbConfig.ApplicationName != "" {
		query.Set("application_name", dbConfig.ApplicationName)
	}
	if dbConfig.SearchPath != "" {
		query.Set("search_path", dbConfig.SearchPath)
	}
	if dbConfig.DefaultQueryExecMode != "" {
		query.Set("default_query_exec_mode", dbConfig.DefaultQueryExecMode)
	}
	if dbConfig.StatementCacheCapacity > 0 {
		query.Set("statement_cache_capacity", strconv.Itoa(dbConfig.StatementCacheCapacity))
	}

	// 先编码其他参数
	rawQuery := query.Encode()
	// TimeZone 不进行 URL 编码
	timeZone := dbConfig.TimeZone
	if timeZone != "" {
		if rawQuery != "" {
			rawQuery += "&"
		}
		rawQuery += "TimeZone=" + timeZone
	}
	pqURL.RawQuery = rawQuery

	pgConfig := postgres.Config{
		DSN: pqURL.String(),
	}

	pgConfig.PreferSimpleProtocol = dbConfig.PreferSimpleProtocol

	// 配置 GORM Logger
	gormLogger := logger.New(
		log.New(log.Writer(), "\r\n", log.LstdFlags),
		logger.Config{
			SlowThreshold:             200 * time.Millisecond,
			LogLevel:                  logger.Warn,
			IgnoreRecordNotFoundError: config.Config.App.Env == "production",
			Colorful:                  config.Config.App.Env == "development",
		},
	)

	db, err = gorm.Open(postgres.New(pgConfig), &gorm.Config{
		DisableForeignKeyConstraintWhenMigrating: true,
		Logger:                                   gormLogger,
	})
	if err != nil {
		log.Fatalf("[PostgreSQL] init connection failed: %v\n", err)
	}

	// Trace 注入
	if err := db.Use(tracing.NewPlugin(tracing.WithoutMetrics())); err != nil {
		log.Fatalf("[PostgreSQL] init trace failed: %v\n", err)
	}

	// 获取通用数据库对象
	sqlDB, err := db.DB()
	if err != nil {
		log.Fatalf("[PostgreSQL] load sql db failed: %v\n", err)
	}

	// 设置连接池参数
	sqlDB.SetMaxIdleConns(dbConfig.MaxIdleConn)
	sqlDB.SetMaxOpenConns(dbConfig.MaxOpenConn)

	if dbConfig.ConnMaxLifetime > 0 {
		sqlDB.SetConnMaxLifetime(time.Duration(dbConfig.ConnMaxLifetime) * time.Second)
	}
	if dbConfig.ConnMaxIdleTime > 0 {
		sqlDB.SetConnMaxIdleTime(time.Duration(dbConfig.ConnMaxIdleTime) * time.Second)
	}
}

func DB(ctx context.Context) *gorm.DB {
	return db.WithContext(ctx)
}
