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

	resp4, err4 := resty.R().
		SetHeader("Cookie", cookie).
		Post(url + "/v3/tokens?action=logout")
	if err4 != nil {
		// Explore trace info
		fmt.Println("Request Trace Info:")
		ti := resp.Request.RawRequest

		fmt.Println("  TLSHandshake  :", ti)

		return "", err
	}

	resp4.Body()

	return res3.Token, err
}

func getKubeConfig(url string, token string) (kubeconfig *GenerateKubeconfig, err error) {
	resp, err := resty.R().
		SetHeader("Authorization", "Bearer "+token).
		SetResult(&GenerateKubeconfig{}).
		Post(url + "/v3/clusters/c-lk2zk?action=generateKubeconfig")

	if err != nil {
		// Explore trace info
		fmt.Println("Request Trace Info:")
		ti := resp.Request.RawRequest

		fmt.Println("  TLSHandshake  :", ti)

		return nil, err
	}

	return resp.Result().(*GenerateKubeconfig), err
}

func (c *Client) rancherKubeconfigHandler(w http.ResponseWriter, r *http.Request) {

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

	//var token string

	//if rancherRequest.BearerToken == "" {

	token, err := getAuthToken(rancherRequest.RancherUrl, rancherRequest.Username, rancherRequest.Password)

	if token == "" || err != nil {
		middleware.Errorf(w, r, nil, http.StatusInternalServerError, "Error occured.")
		fmt.Println(err)
		return
	}
	//} else {
	//	token = rancherRequest.BearerToken
	//}

	kubeconfig, err := getKubeConfig(rancherRequest.RancherUrl, token)

	middleware.Write(w, r, kubeconfig)
}
