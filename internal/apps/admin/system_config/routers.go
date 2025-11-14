/*
 * MIT License
 *
 * Copyright (c) 2025 linux.do
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

package system_config

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/linux-do/pay/internal/db"
	"github.com/linux-do/pay/internal/model"
	"github.com/linux-do/pay/internal/util"
	"gorm.io/gorm"
)

// CreateSystemConfigRequest 创建系统配置请求
type CreateSystemConfigRequest struct {
	Key         string `json:"key" binding:"required,max=64"`
	Value       string `json:"value" binding:"required,max=255"`
	Description string `json:"description" binding:"max=255"`
}

// UpdateSystemConfigRequest 更新系统配置请求
type UpdateSystemConfigRequest struct {
	Value       string `json:"value" binding:"required,max=255"`
	Description string `json:"description" binding:"max=255"`
}

// CreateSystemConfig 创建系统配置
// @Tags admin
// @Accept json
// @Produce json
// @Param request body CreateSystemConfigRequest true "request body"
// @Success 200 {object} util.ResponseAny
// @Router /api/v1/admin/system-configs [post]
func CreateSystemConfig(c *gin.Context) {
	var req CreateSystemConfigRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, util.Err(err.Error()))
		return
	}

	// 检查配置键是否已存在
	var existing model.SystemConfig
	if err := db.DB(c.Request.Context()).Where("key = ?", req.Key).First(&existing).Error; err == nil {
		c.JSON(http.StatusBadRequest, util.Err(ConfigKeyExists))
		return
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		c.JSON(http.StatusInternalServerError, util.Err(err.Error()))
		return
	}

	config := model.SystemConfig{
		Key:         req.Key,
		Value:       req.Value,
		Description: req.Description,
	}

	if err := db.DB(c.Request.Context()).Transaction(func(tx *gorm.DB) error {
		// 创建配置
		if err := tx.Create(&config).Error; err != nil {
			return err
		}

		if err := db.HSetJSON(c.Request.Context(), model.SystemConfigRedisHashKey, req.Key, &config); err != nil {
			return err
		}

		return nil
	}); err != nil {
		c.JSON(http.StatusInternalServerError, util.Err(err.Error()))
		return
	}

	c.JSON(http.StatusOK, util.OKNil())
}

// ListSystemConfigs 获取系统配置列表
// @Tags admin
// @Produce json
// @Success 200 {object} util.ResponseAny
// @Router /api/v1/admin/system-configs [get]
func ListSystemConfigs(c *gin.Context) {
	var configs []model.SystemConfig
	if err := db.DB(c.Request.Context()).
		Order("created_at DESC").
		Find(&configs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, util.Err(err.Error()))
		return
	}

	c.JSON(http.StatusOK, util.OK(configs))
}

// GetSystemConfig 获取单个系统配置
// @Tags admin
// @Produce json
// @Param key path string true "配置键"
// @Success 200 {object} util.ResponseAny
// @Router /api/v1/admin/system-configs/{key} [get]
func GetSystemConfig(c *gin.Context) {
	var config model.SystemConfig
	if err := db.DB(c.Request.Context()).Where("key = ?", c.Param("key")).First(&config).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, util.Err(SystemConfigNotFound))
		} else {
			c.JSON(http.StatusInternalServerError, util.Err(err.Error()))
		}
		return
	}

	c.JSON(http.StatusOK, util.OK(config))
}

// UpdateSystemConfig 更新系统配置
// @Tags admin
// @Accept json
// @Produce json
// @Param key path string true "配置键"
// @Param request body UpdateSystemConfigRequest true "request body"
// @Success 200 {object} util.ResponseAny
// @Router /api/v1/admin/system-configs/{key} [put]
func UpdateSystemConfig(c *gin.Context) {
	var req UpdateSystemConfigRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, util.Err(err.Error()))
		return
	}

	key := c.Param("key")

	// 检查配置是否存在
	var config model.SystemConfig
	if err := db.DB(c.Request.Context()).Where("key = ?", key).First(&config).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, util.Err(SystemConfigNotFound))
		} else {
			c.JSON(http.StatusInternalServerError, util.Err(err.Error()))
		}
		return
	}

	if err := db.DB(c.Request.Context()).Transaction(func(tx *gorm.DB) error {
		// 更新配置
		if err := tx.Model(&config).
			Updates(map[string]interface{}{
				"value":       req.Value,
				"description": req.Description,
			}).Error; err != nil {
			return err
		}

		if err := db.HSetJSON(c.Request.Context(), model.SystemConfigRedisHashKey, key, &config); err != nil {
			return err
		}

		return nil
	}); err != nil {
		c.JSON(http.StatusInternalServerError, util.Err(err.Error()))
		return
	}

	c.JSON(http.StatusOK, util.OKNil())
}

// DeleteSystemConfig 删除系统配置
// @Tags admin
// @Produce json
// @Param key path string true "配置键"
// @Success 200 {object} util.ResponseAny
// @Router /api/v1/admin/system-configs/{key} [delete]
func DeleteSystemConfig(c *gin.Context) {
	key := c.Param("key")

	// 检查配置是否存在
	var config model.SystemConfig
	if err := db.DB(c.Request.Context()).Where("key = ?", key).First(&config).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, util.Err(SystemConfigNotFound))
		} else {
			c.JSON(http.StatusInternalServerError, util.Err(err.Error()))
		}
		return
	}

	if err := db.DB(c.Request.Context()).Transaction(func(tx *gorm.DB) error {
		// 删除配置
		if err := tx.Delete(&config).Error; err != nil {
			return err
		}

		if err := db.Redis.HDel(c.Request.Context(), model.SystemConfigRedisHashKey, key).Err(); err != nil {
			return err
		}

		return nil
	}); err != nil {
		c.JSON(http.StatusInternalServerError, util.Err(err.Error()))
		return
	}

	c.JSON(http.StatusOK, util.OKNil())
}
