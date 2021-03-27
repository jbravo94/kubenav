package api

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/kubenav/kubenav/pkg/api/middleware"
	"gopkg.in/resty.v1"
)

type RancherRequest struct {
	RancherUrl  string `json:"rancherUrl"`
	Username    string `json:"username"`
	Password    string `json:"password"`
	BearerToken string `json:"bearerToken"`
}

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

type GenerateKubeconfig struct {
	BaseType string `json:"baseType"`
	Config   string `json:"config"`
	Type     string `json:"type"`
}

type TokenResponse struct {
	Token string `json:"token"`
}

func getAuthToken(url string, username string, password string) (token string, err error) {

	cookie, err := loginToRancher(url, username, password)

	if err != nil {
		return "", err
	}

	apiTokenRequest := ApiTokenRequest{
		Current:     false,
		Enabled:     true,
		Expired:     false,
		IsDerived:   false,
		TTL:         0,
		Type:        "token",
		Description: "kubenav",
	}

	resp, err := resty.R().
		SetHeader("Cookie", cookie).
		SetBody(apiTokenRequest).
		Post(url + "/v3/token")

	if err != nil {

		rawReq := resp.Request.RawRequest

		fmt.Println("Error: ", err)
		fmt.Println("Request Trace Info: ", rawReq)

		return "", err
	}

	logoutFromRancher(url, cookie)

	if err != nil {
		return "", err
	}

	tokenResponse := TokenResponse{}

	json.Unmarshal(resp.Body(), &tokenResponse)

	return tokenResponse.Token, err
}

func logoutFromRancher(url string, cookie string) (err error) {

	resp, err := resty.R().
		SetHeader("Cookie", cookie).
		Post(url + "/v3/tokens?action=logout")

	if err != nil {
		rawReq := resp.Request.RawRequest

		fmt.Println("Error: ", err)
		fmt.Println("Request Trace Info: ", rawReq)

		return err
	}
	return err
}

func loginToRancher(url string, username string, password string) (cookie string, err error) {

	rancherCredentials := RancherCredentialsRequest{
		Username:     username,
		Password:     password,
		Description:  "kubenav Session",
		ResponseType: "cookie",
		TTL:          57600000,
	}

	resp, err := resty.R().
		SetBody(rancherCredentials).
		Post(url + "/v3-public/localProviders/local?action=login")

	if err != nil {
		rawReq := resp.Request.RawRequest

		fmt.Println("Error: ", err)
		fmt.Println("Request Trace Info: ", rawReq)

		return "", err
	}

	cookie = resp.Header().Get("Set-Cookie")

	return cookie, err
}

func getKubeConfig(url string, token string) (kubeconfig *GenerateKubeconfig, err error) {

	resp, err := resty.R().
		SetHeader("Authorization", "Bearer "+token).
		Post(url + "/v3/clusters/c-lk2zk?action=generateKubeconfig")

	if err != nil {
		rawReq := resp.Request.RawRequest

		fmt.Println("Error: ", err)
		fmt.Println("Request Trace Info: ", rawReq)

		return nil, err
	}

	generateKubeconfig := GenerateKubeconfig{}

	json.Unmarshal(resp.Body(), &generateKubeconfig)

	return &generateKubeconfig, err
}

func (c *Client) rancherKubeconfigHandler(w http.ResponseWriter, r *http.Request) {

	if r.Method != http.MethodPost {
		middleware.Write(w, r, nil)
		return
	}

	if r.Body == nil {
		middleware.Errorf(w, r, nil, http.StatusBadRequest, "Request body is empty")
		return
	}

	var rancherRequest RancherRequest
	err := json.NewDecoder(r.Body).Decode(&rancherRequest)

	if err != nil {
		middleware.Errorf(w, r, nil, http.StatusInternalServerError, "Error occured.")
		fmt.Println(err)
		return
	}

	var token = rancherRequest.BearerToken

	if token == "" {

		token, err = getAuthToken(rancherRequest.RancherUrl, rancherRequest.Username, rancherRequest.Password)

		if err != nil {
			middleware.Errorf(w, r, nil, http.StatusInternalServerError, "Error occured.")
			fmt.Println(err)
			return
		}
	}

	kubeconfig, err := getKubeConfig(rancherRequest.RancherUrl, token)

	if err != nil {
		middleware.Errorf(w, r, nil, http.StatusInternalServerError, "Error occured.")
		fmt.Println(err)
		return
	}

	middleware.Write(w, r, kubeconfig)
}
