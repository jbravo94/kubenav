import { V1ListMeta, V1ObjectMeta } from '@kubernetes/client-node';
import React from 'react';
import { QueryConfig } from 'react-query';
import { Terminal } from 'xterm';

export interface IAppPage {
  icon: string;
  singleText: string;
  pluralText: string;
  apiVersion: string;
  kind: string;
  listURL: (namespace: string) => string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  listItemComponent: React.FunctionComponent<any>;
  detailsURL: (namespace: string, name: string) => string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  detailsComponent: React.FunctionComponent<any>;
}

export interface IAppPages {
  [key: string]: IAppPage;
}

export interface IAppSection {
  title: string;
  pages: IAppPages;
}

export interface IAppSections {
  [key: string]: IAppSection;
}

export interface IAppSettings {
  theme: TTheme;
  authenticationEnabled: boolean;
  timeout: number;
  terminalFontSize: number;
  terminalScrollback: number;
  enablePodMetrics: boolean;
  queryLimit: number;
  queryRefetchInterval: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  queryConfig: QueryConfig<any, Error>;
  sshKey: string;
  sshPort: string;
  sshUser: string;
  prometheusEnabled: boolean;
  prometheusNamespace: string;
  prometheusSelector: string;
  prometheusPort: number;
  prometheusUsername: string;
  prometheusPassword: string;
  prometheusAddress: string;
  prometheusDashboardsNamespace: string;
  elasticsearchEnabled: boolean;
  elasticsearchNamespace: string;
  elasticsearchSelector: string;
  elasticsearchPort: number;
  elasticsearchUsername: string;
  elasticsearchPassword: string;
  elasticsearchAddress: string;
  jaegerEnabled: boolean;
  jaegerNamespace: string;
  jaegerSelector: string;
  jaegerPort: number;
  jaegerUsername: string;
  jaegerPassword: string;
  jaegerQueryBasePath: string;
  jaegerAddress: string;
  proxyEnabled: boolean;
  proxyAddress: string;
  helmShowAllVersions: boolean;
}

export interface IAWSCluster {
  CertificateAuthority: IAWSClusterCertificateAuthority;
  Endpoint: string;
  Name: string;
}

export interface IAWSClusterCertificateAuthority {
  Data: string;
}

export interface IAWSSSO {
  client: IAWSSSOClient;
  device: IAWSSSODevice;
}

export interface IAWSSSOClient {
  ClientId: string;
  ClientIdIssuedAt: number;
  ClientSecret: string;
  ClientSecretExpiresAt: number;
}

export interface IAWSSSOCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
  expire: number;
  region: string;
  ssoRegion: string;
  startURL: string;
  accountID: string;
  roleName: string;
  accessToken: string;
  accessTokenExpire: number;
  clusterID: string;
}

export interface IAWSSSODevice {
  DeviceCode: string;
  ExpiresIn: number;
  Interval: number;
  UserCode: string;
  VerificationUri: string;
  VerificationUriComplete: string;
}

export interface IAWSToken {
  accessKeyID: string;
  secretKey: string;
}

export interface IAWSTokens {
  [key: string]: IAWSToken;
}

export interface IAzureCluster {
  name: string;
  kubeconfig: IKubeconfig;
}

export interface IBookmark {
  title: string;
  url: string;
  namespace: string;
}

export interface ICluster {
  id: string;
  name: string;
  url: string;
  certificateAuthorityData: string;
  clientCertificateData: string;
  clientKeyData: string;
  token: string;
  username: string;
  password: string;
  insecureSkipTLSVerify: boolean;
  authProvider: TAuthProvider;
  authProviderAWS?: IClusterAuthProviderAWS;
  authProviderAWSSSO?: IAWSSSOCredentials;
  authProviderAzure?: IClusterAuthProviderAzure;
  authProviderDigitalOcean?: IClusterAuthProviderDigitalOcean;
  authProviderGoogle?: IClusterAuthProviderGoogle;
  authProviderRancher?: IClusterAuthProviderRancher;
  authProviderOIDC?: IClusterAuthProviderOIDC;
  namespace: string;
}

export interface IClusterAuthProviderAWS {
  accessKeyID: string;
  clusterID: string;
  region: string;
  secretKey: string;
  sessionToken?: string;
}

export interface IClusterAuthProviderAzure {
  admin: boolean;
  clientID: string;
  clientSecret: string;
  resourceGroupName: string;
  subscriptionID: string;
  tenantID: string;
}

export interface IClusterAuthProviderDigitalOcean {
  token: string;
  clusterID: string;
}

export interface IClusterAuthProviderGoogle {
  accessToken: string;
  clientID: string;
  expires: number;
  idToken: string;
  refreshToken: string;
  tokenType: string;
  clusterID?: string;
}

export interface IClusterAuthProviderRancher {
  rancherUrl: string;
  username: string;
  password: string;
  bearerToken: string;
  expires: number;
}

export interface IClusterAuthProviderOIDC {
  clientID: string;
  clientSecret: string;
  scopes?: string;
  idToken: string;
  idpIssuerURL: string;
  refreshToken: string;
  certificateAuthority: string;
  accessToken: string;
  expiry: number;
  clusterID?: string;
}

export interface IClusters {
  [key: string]: ICluster;
}

export interface IContainerMetrics {
  name?: string;
  usage?: IMetricsUsage;
}

export interface IContext {
  clusters?: IClusters;
  cluster?: string;
  settings: IAppSettings;
  bookmarks: IBookmark[];

  addCluster: (newCluster: ICluster[]) => void;
  changeCluster: (id: string) => void;
  currentCluster: () => ICluster | undefined;
  deleteCluster: (id: string) => void;
  editBookmarks: (editBookmarks: IBookmark[]) => void;
  editCluster: (editCluster: ICluster) => void;
  editSettings: (settings: IAppSettings) => void;
  setNamespace: (namespace: string) => void;
  kubernetesAuthWrapper: (clusterID: string) => Promise<ICluster>;
}

export interface IDigitalOceanCluster {
  id: string;
  name: string;
  region: string;
}

export interface IGoogleTokensAPIResponse {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  access_token: string;
  error: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  error_description: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  expires_in: number;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  id_token: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  refresh_token: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  token_type: string;
}

export interface IRancherLoginRequest {
  username: string,
  password: string,
  description: string,
  responseType: string
}

export interface IGoogleProject {
  projectId: string;
}

export interface IGoogleCluster {
  name: string;
  masterAuth: IGoogleClusterMasterAuth;
  endpoint: string;
  location: string;
}

export interface IGoogleClusterMasterAuth {
  username?: string;
  password?: string;
  clusterCaCertificate: string;
  clientCertificate?: string;
  clientKey?: string;
}

// IInclusterSettings must have the same structure as the Config struct from the plugins package.
// See: pkg/handlers/plugins/plugins.go
export interface IInclusterSettings {
  prometheus: IInclusterSettingsPrometheus;
  elasticsearch: IInclusterSettingsElasticsearch;
  jaeger: IInclusterSettingsJaeger;
}

export interface IInclusterSettingsElasticsearch {
  enabled: boolean;
  address: string;
}

export interface IInclusterSettingsJaeger {
  enabled: boolean;
  address: string;
}

export interface IInclusterSettingsPrometheus {
  enabled: boolean;
  address: string;
  dashboardsNamespace: string;
}

export interface IJsonData {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export interface IKubeconfig {
  clusters: IKubeconfigClusterRef[];
  contexts: IKubeconfigContextRef[];
  users: IKubeconfigUserRef[];
}

export interface IKubeconfigCluster {
  'certificate-authority-data': string;
  'insecure-skip-tls-verify': boolean;
  server: string;
}

export interface IKubeconfigClusterRef {
  cluster: IKubeconfigCluster;
  name: string;
}

export interface IKubeconfigContextRef {
  context: IKubeconfigContext;
  name: string;
}

export interface IKubeconfigContext {
  cluster: string;
  user: string;
}

export interface IKubeconfigUser {
  'client-certificate-data'?: string;
  'client-key-data'?: string;
  token?: string;
  username?: string;
  password?: string;
  'auth-provider'?: IKubeconfigUserAuthProvider;
}

export interface IKubeconfigUserAuthProvider {
  name: string;
  config: IKubeconfigUserAuthProviderOIDC;
}

export interface IKubeconfigUserAuthProviderOIDC {
  'client-id'?: string;
  'client-secret'?: string;
  'id-token'?: string;
  'idp-issuer-url'?: string;
  'refresh-token'?: string;
  'idp-certificate-authority-data'?: string;
}

export interface IKubeconfigUserRef {
  name: string;
  user: IKubeconfigUser;
}

export interface IMetricsUsage {
  [key: string]: string;
}

export interface INodeMetrics {
  apiVersion?: string;
  metadata?: V1ObjectMeta;
  timestamp?: Date;
  window?: number;
  usage?: IMetricsUsage;
}

export interface INodeMetricsList {
  apiVersion?: string;
  items: Array<INodeMetrics>;
  kind?: string;
  metadata?: V1ListMeta;
}

export interface IOIDCProvider {
  name: string;
  clientID: string;
  clientSecret: string;
  idToken: string;
  idpIssuerURL: string;
  refreshToken: string;
  certificateAuthority: string;
  accessToken: string;
  expiry: number;
}

export interface IOIDCProviders {
  [key: string]: IOIDCProvider;
}

export interface IOIDCProviderTokenAPIResponse {
  error: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  id_token: string;
  message: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  refresh_token: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  access_token: string;
  expiry: number;
}

export interface IPluginPrometheus {
  enabled: boolean;
  namespace: string;
  selector: string;
}

export interface IPodMetrics {
  apiVersion?: string;
  metadata?: V1ObjectMeta;
  timestamp?: Date;
  window?: number;
  containers?: Array<IContainerMetrics>;
}

export interface IPodMetricsList {
  apiVersion?: string;
  items: Array<IPodMetrics>;
  kind?: string;
  metadata?: V1ListMeta;
}

export interface IPortForwarding {
  id: string;
  podName: string;
  podNamespace: string;
  podPort: number;
  localPort: number;
}

export interface IPortForwardingContext {
  portForwardings: IPortForwarding[];
  add: (portForwarding: IPortForwarding) => Promise<void>;
}

export interface IPortForwardingResponse {
  id: string;
  podName: string;
  podNamespace: string;
  podPort: number;
  localPort: number;
}

export interface ITerminal {
  name: string;
  shell?: Terminal;
  eventSource?: EventSource;
  webSocket?: WebSocket;
}

export interface ITerminalContext {
  terminals: ITerminal[];

  add: (term: ITerminal) => void;
}

export interface ITerminalResponse {
  id: string;
}

export type TActivator = 'block-button' | 'button' | 'item' | 'item-option';

// DEPRECATED: The value '' can be removed when the migration is done.
export type TAuthProvider = '' | 'aws' | 'awssso' | 'azure' | 'digitalocean' | 'google' | 'rancher' | 'kubeconfig' | 'oidc';

export type TSyncType = 'context' | 'namespace';

export type TTheme = 'system' | 'dark' | 'light';
