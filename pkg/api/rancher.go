package api

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"

	"github.com/kubenav/kubenav/pkg/api/middleware"
	"gopkg.in/resty.v1"
)

const restyRetry int = 3

type RancherRequest struct {
	RancherHost string `json:"rancherHost"`
	RancherPort int    `json:"rancherPort"`
	Secure      bool   `json:"secure"`
	Username    string `json:"username"`
	Password    string `json:"password"`
	BearerToken string `json:"bearerToken"`
	ClusterId   string `json:"clusterId"`
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

type Clusters struct {
	Data []struct {
		Id   string `json:"id"`
		Name string `json:"name"`
	} `json:"data"`
}

func listClusters(url string, token *TokenObject) (clusters *Clusters, err error) {
	resp, err := resty.SetRetryCount(restyRetry).R().
		SetHeader("Authorization", "Bearer "+token.Token).
		Get(url + "/v3/clusters")

	if err != nil {
		logHttpError(resp, err)
		return nil, err
	}

	json.Unmarshal(resp.Body(), &clusters)

	return clusters, err
}

func deleteAuthToken(url string, token *TokenObject) (err error) {
	resp, err := resty.SetRetryCount(restyRetry).R().
		SetHeader("Authorization", "Bearer "+token.Token).
		Delete(url + "/v3/token/" + token.Id)

	if err != nil {
		logHttpError(resp, err)
		return err
	}
	return err
}

func createAuthToken(url string, sessionToken *TokenObject) (token *TokenObject, err error) {

	apiTokenRequest := ApiTokenRequest{
		Current:     false,
		Enabled:     true,
		Expired:     false,
		IsDerived:   false,
		TTL:         0,
		Type:        "token",
		Description: "kubenav",
	}

	resp, err := resty.SetRetryCount(restyRetry).R().
		SetHeader("Authorization", "Bearer "+token.Token).
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

func loginToRancher(url string, username string, password string) (sessionToken *TokenObject, err error) {

	rancherCredentials := RancherCredentialsRequest{
		Username:    username,
		Password:    password,
		Description: "kubenav Session",
		TTL:         57600000,
	}

	resp, err := resty.SetRetryCount(restyRetry).R().
		SetBody(rancherCredentials).
		Post(url + "/v3-public/localProviders/local?action=login")

	if err != nil {
		logHttpError(resp, err)
		return nil, err
	}

	tokenResponse := TokenObject{}

	json.Unmarshal(resp.Body(), &tokenResponse)

	return &tokenResponse, err
}

// Use this function to remove sessionToken
func logoutFromRancher(url string, sessionToken *TokenObject) (err error) {

	resp, err := resty.SetRetryCount(restyRetry).R().
		SetHeader("Authorization", "Bearer "+sessionToken.Token).
		Post(url + "/v3/tokens?action=logout")

	if err != nil {
		logHttpError(resp, err)
		return err
	}
	return err
}

func getKubeConfig(url string, token *TokenObject, clusterId string) (kubeconfig *GenerateKubeconfig, err error) {

	resp, err := resty.SetRetryCount(restyRetry).R().
		SetHeader("Authorization", "Bearer "+token.Token).
		Post(url + "/v3/clusters/" + clusterId + "?action=generateKubeconfig")

	if err != nil {
		logHttpError(resp, err)
		return nil, err
	}

	generateKubeconfig := GenerateKubeconfig{}

	json.Unmarshal(resp.Body(), &generateKubeconfig)

	return &generateKubeconfig, err
}

func generateRancherUrl(rancherRequest RancherRequest) (rancherUrl string) {
	var scheme string

	if rancherRequest.Secure {
		scheme = "https"
	} else {
		scheme = "http"
	}

	return scheme + "://" + rancherRequest.RancherHost + ":" + strconv.Itoa(rancherRequest.RancherPort)
}

func (c *Client) rancherGenerateApiTokenHandler(w http.ResponseWriter, r *http.Request) {

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

	sessionTokenObject, err := loginToRancher(generateRancherUrl(rancherRequest), rancherRequest.Username, rancherRequest.Password)

	if err != nil {
		middleware.Errorf(w, r, nil, http.StatusInternalServerError, "Error occured.")
		return
	}

	// deleteAuthToken(generateRancherUrl(rancherRequest), sessionTokenObject)

	apiTokenObject, err := createAuthToken(generateRancherUrl(rancherRequest), sessionTokenObject)

	if err != nil {
		middleware.Errorf(w, r, nil, http.StatusInternalServerError, "Error occured.")
		return
	}

	middleware.Write(w, r, apiTokenObject)
}

func (c *Client) rancherListClustersHandler(w http.ResponseWriter, r *http.Request) {

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
		tokenObject, err = loginToRancher(generateRancherUrl(rancherRequest), rancherRequest.Username, rancherRequest.Password)

		if err != nil {
			middleware.Errorf(w, r, nil, http.StatusInternalServerError, "Error occured.")
			return
		}
	}

	clusters, err := listClusters(generateRancherUrl(rancherRequest), tokenObject)

	if err != nil {
		middleware.Errorf(w, r, nil, http.StatusInternalServerError, "Error occured.")
		return
	}

	if rancherRequest.BearerToken == "" {
		err := logoutFromRancher(generateRancherUrl(rancherRequest), tokenObject)

		if err != nil {
			middleware.Errorf(w, r, nil, http.StatusInternalServerError, "Error occured.")
			return
		}
	}

	middleware.Write(w, r, clusters)
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
		tokenObject, err = loginToRancher(generateRancherUrl(rancherRequest), rancherRequest.Username, rancherRequest.Password)

		if err != nil {
			middleware.Errorf(w, r, nil, http.StatusInternalServerError, "Error occured.")
			return
		}

	}

	kubeconfig, err := getKubeConfig(generateRancherUrl(rancherRequest), tokenObject, rancherRequest.ClusterId)

	if err != nil {
		middleware.Errorf(w, r, nil, http.StatusInternalServerError, "Error occured.")
		return
	}

	if rancherRequest.BearerToken == "" {
		err := logoutFromRancher(generateRancherUrl(rancherRequest), tokenObject)

		if err != nil {
			middleware.Errorf(w, r, nil, http.StatusInternalServerError, "Error occured.")
			return
		}
	}

	middleware.Write(w, r, kubeconfig)
}
