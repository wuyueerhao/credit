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

package util

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
)

// Encrypt 使用 SignKey 加密字符串数据
// signKey: 64 字符 hex 编码的密钥（对应 32 字节，用于 AES-256）
// plaintext: 要加密的明文字符串
// return: base64 编码的密文
func Encrypt(signKey string, plaintext string) (string, error) {
	return encryptBytes(signKey, []byte(plaintext))
}

// Decrypt 使用 SignKey 解密字符串数据
// signKey: 64 字符 hex 编码的密钥（对应 32 字节，用于 AES-256）
// ciphertext: base64 编码的密文
// return: 解密后的明文字符串
func Decrypt(signKey string, ciphertext string) (string, error) {
	plaintext, err := decryptBytes(signKey, ciphertext)
	if err != nil {
		return "", err
	}
	return string(plaintext), nil
}

// encryptBytes 加密函数，处理字节数据
func encryptBytes(signKey string, plaintext []byte) (string, error) {
	// 将 hex 编码的密钥转换为字节
	key, err := hex.DecodeString(signKey)
	if err != nil {
		return "", fmt.Errorf("invalid sign key: %w", err)
	}
	if len(key) != 32 {
		return "", errors.New("sign key must be 32 bytes (64 hex characters)")
	}

	// 创建 AES cipher
	block, err := aes.NewCipher(key)
	if err != nil {
		return "", fmt.Errorf("failed to create cipher: %w", err)
	}

	// 使用 GCM 模式（Galois/Counter Mode）
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", fmt.Errorf("failed to create GCM: %w", err)
	}

	// 生成随机 nonce
	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", fmt.Errorf("failed to generate nonce: %w", err)
	}

	// 加密数据
	ciphertext := gcm.Seal(nonce, nonce, plaintext, nil)

	// 返回 base64 编码的密文
	return base64.StdEncoding.EncodeToString(ciphertext), nil
}

// decryptBytes 解密函数，处理字节数据
func decryptBytes(signKey string, ciphertext string) ([]byte, error) {
	// 将 hex 编码的密钥转换为字节
	key, err := hex.DecodeString(signKey)
	if err != nil {
		return nil, fmt.Errorf("invalid sign key: %w", err)
	}
	if len(key) != 32 {
		return nil, errors.New("sign key must be 32 bytes (64 hex characters)")
	}

	// 解码 base64 密文
	data, err := base64.StdEncoding.DecodeString(ciphertext)
	if err != nil {
		return nil, fmt.Errorf("failed to decode ciphertext: %w", err)
	}

	// 创建 AES cipher
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, fmt.Errorf("failed to create cipher: %w", err)
	}

	// 使用 GCM 模式
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, fmt.Errorf("failed to create GCM: %w", err)
	}

	// 提取 nonce
	nonceSize := gcm.NonceSize()
	if len(data) < nonceSize {
		return nil, errors.New("ciphertext too short")
	}

	nonce, ciphertextBytes := data[:nonceSize], data[nonceSize:]

	// 解密数据
	plaintext, err := gcm.Open(nil, nonce, ciphertextBytes, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to decrypt: %w", err)
	}

	return plaintext, nil
}
