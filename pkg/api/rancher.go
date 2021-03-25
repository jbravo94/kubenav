package api

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/kubenav/kubenav/pkg/api/middleware"
	"gopkg.in/resty.v1"
)

type RancherCredentialsRequest struct {
	Username     string `json:"username"`
	Password     string `json:"password"`
	Description  string `json:"description"`
	ResponseType string `json:"responseType"`
	TTL          int    `json:"ttl"`
}

type ApiTokenRequest struct {
	Current     bool   `json:"current"`
	Enabled     bool   `json:"enabled"`
	Expired     bool   `json:"expired"`
	IsDerived   bool   `json:"isDerived"`
	TTL         int    `json:"ttl"`
	Type        string `json:"type"`
	Description string `json:"description"`
}

type TokenResponse struct {
	Token string `json:"token"`
}

func getAuthToken(url string, username string, password string) (token string, err error) {

	resp, err := resty.R().
		SetBody(RancherCredentialsRequest{Username: username, Password: password, Description: "kubenav Session", ResponseType: "cookie", TTL: 57600000}).
		Post(url + "/v3-public/localProviders/local?action=login")
	if err != nil {
		// Explore trace info
		fmt.Println("Request Trace Info:")
		ti := resp.Request.RawRequest

		fmt.Println("  TLSHandshake  :", ti)

		return "", err
	}

	cookie := resp.Header().Get("Set-Cookie")

	resp2, err2 := resty.R().
		SetHeader("Cookie", cookie).
		SetBody(ApiTokenRequest{Current: false, Enabled: true, Expired: false, IsDerived: false, TTL: 0, Type: "token", Description: "kubenav"}).
		Post(url + "/v3/token")

	if err2 != nil {
		// Explore trace info
		fmt.Println("Request Trace Info:")
		ti := resp.Request.RawRequest

		fmt.Println("  TLSHandshake  :", ti)

		return "", err
	}

	res3 := TokenResponse{}

	json.Unmarshal(resp2.Body(), &res3)

	return res3.Token, err
}

func getKubeConfig(url string, token string) (kubeconfig string, err error) {
	resp, err := resty.R().
		SetHeader("Authorization", "Bearer "+token).
		Post(url + "/v3/clusters/c-lk2zk?action=generateKubeconfig")

	if err != nil {
		// Explore trace info
		fmt.Println("Request Trace Info:")
		ti := resp.Request.RawRequest

		fmt.Println("  TLSHandshake  :", ti)

		return "", err
	}

	return string(resp.Body()), err
}

func (c *Client) rancherKubeconfigHandler(w http.ResponseWriter, r *http.Request) {

	token, err := getAuthToken("https://rancher.heinzl.dev", "admin", "***REMOVED***")

	if token == "" || err != nil {
		middleware.Errorf(w, r, nil, http.StatusInternalServerError, "Error occured.")
		fmt.Println(err)
		return
	}

	kubeconfig, err := getKubeConfig("https://rancher.heinzl.dev", token)

	middleware.Write(w, r, kubeconfig)
}
