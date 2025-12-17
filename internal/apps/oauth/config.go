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

package oauth

import (
	"github.com/linux-do/pay/internal/config"
	"golang.org/x/oauth2"
)

var oauthConf *oauth2.Config

func init() {
	oauthConf = &oauth2.Config{
		ClientID:     config.Config.OAuth2.ClientID,
		ClientSecret: config.Config.OAuth2.ClientSecret,
		RedirectURL:  config.Config.OAuth2.RedirectURI,
		Scopes:       []string{"user:email:profile"},
		Endpoint: oauth2.Endpoint{
			AuthURL:   config.Config.OAuth2.AuthorizationEndpoint,
			TokenURL:  config.Config.OAuth2.TokenEndpoint,
			AuthStyle: 0,
		},
	}
}
