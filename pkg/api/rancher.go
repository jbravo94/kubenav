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
	Id          string `json:"id"`
}

type GenerateKubeconfig struct {
	BaseType string `json:"baseType"`
	Config   string `json:"config"`
	Type     string `json:"type"`
}

type TokenObject struct {
	Id    string `json:"id"`
	Token string `json:"token"`
}

func getAuthToken(url string, username string, password string) (token *TokenObject, err error) {

	cookie, err := loginToRancher(url, username, password)

	if err != nil {
		return nil, err
	}

	tokenResponse, err := createAuthToken(url, cookie)

	if err != nil {
		return nil, err
	}

	logoutFromRancher(url, cookie)

	if err != nil {
		return nil, err
	}

	return tokenResponse, err
}

// Flag secure

// This function is obsolete if token is stored
func deleteAuthToken(url string, token *TokenObject) (err error) {
	resp, err := resty.R().
		SetHeader("Authorization", "Bearer "+token.Token).
		Delete(url + "/v3/token/" + token.Id)

	if err != nil {
		logHttpError(resp, err)
		return err
	}
	return err
}

func createAuthToken(url string, cookie string) (token *TokenObject, err error) {

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
		logHttpError(resp, err)
		return nil, err
	}

	tokenResponse := TokenObject{}

	json.Unmarshal(resp.Body(), &tokenResponse)

	return &tokenResponse, err
}

func logHttpError(resp *resty.Response, err error) {
	rawReq := resp.Request.RawRequest

	fmt.Println("Error: ", err)
	fmt.Println("Request Trace Info: ", rawReq)
}

func logoutFromRancher(url string, cookie string) (err error) {

	resp, err := resty.R().
		SetHeader("Cookie", cookie).
		Post(url + "/v3/tokens?action=logout")

	if err != nil {
		logHttpError(resp, err)
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
		logHttpError(resp, err)
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
		logHttpError(resp, err)
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
		return
	}

	var tokenObject = &TokenObject{}

	if rancherRequest.BearerToken != "" {
		tokenObject.Token = rancherRequest.BearerToken
	} else {
		tokenObject, err = getAuthToken(rancherRequest.RancherUrl, rancherRequest.Username, rancherRequest.Password)

		if err != nil {
			middleware.Errorf(w, r, nil, http.StatusInternalServerError, "Error occured.")
			return
		}

	}

	kubeconfig, err := getKubeConfig(rancherRequest.RancherUrl, tokenObject.Token)

	if err != nil {
		middleware.Errorf(w, r, nil, http.StatusInternalServerError, "Error occured.")
		return
	}

	if rancherRequest.BearerToken == "" {
		err := deleteAuthToken(rancherRequest.RancherUrl, tokenObject)

		if err != nil {
			middleware.Errorf(w, r, nil, http.StatusInternalServerError, "Error occured.")
			return
		}
	}

	middleware.Write(w, r, kubeconfig)
}
