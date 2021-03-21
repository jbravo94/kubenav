import {
  IAppSettings,
  IBookmark,
  IClusterAuthProviderAWS,
  IClusterAuthProviderAzure,
  IClusterAuthProviderDigitalOcean,
  IClusterAuthProviderGoogle,
  IClusterAuthProviderOIDC,
  IClusterAuthProviderRancher,
  IClusters,
  TAuthProvider,
} from '../declarations';
import {
  DEFAULT_SETTINGS,
  STORAGE_BOOKMARKS,
  STORAGE_CLUSTER,
  STORAGE_CLUSTERS,
  STORAGE_SETTINGS,
  STORAGE_TEMPORARY_CREDENTIALS,
} from './constants';

// readBookmarks returns the saved bookmarks of a user from localStorage.
export const readBookmarks = (): IBookmark[] => {
  const bookmarks = localStorage.getItem(STORAGE_BOOKMARKS);

  if (bookmarks === null) {
    return [];
  }

  return JSON.parse(bookmarks);
};

// readCluster returns the saved active cluster from localStorage. If there is no value in the localStorage or the saved
// active cluster is not in the saved cluster, undefined is returned.
export const readCluster = (): string | undefined => {
  const clusters = readClusters();
  return localStorage.getItem(STORAGE_CLUSTER) !== null && localStorage.getItem(STORAGE_CLUSTER) !== ''
    ? (localStorage.getItem(STORAGE_CLUSTER) as string)
    : clusters && Object.keys(clusters).length > 0
    ? Object.keys(clusters)[0]
    : undefined;
};

// readClusters returns the saved clusters from localStorage. If there are no saved clusters, undefined is returned.
export const readClusters = (): IClusters | undefined => {
  // return localStorage.getItem(STORAGE_CLUSTERS) !== null && localStorage.getItem(STORAGE_CLUSTERS) !== ''
  //   ? (JSON.parse(localStorage.getItem(STORAGE_CLUSTERS) as string) as IClusters)
  //   : undefined;

  // DEPRECATED: Migrate old clusters to the new structure. This can be removed in one of the next version.
  const clusters =
    localStorage.getItem(STORAGE_CLUSTERS) !== null && localStorage.getItem(STORAGE_CLUSTERS) !== ''
      ? (JSON.parse(localStorage.getItem(STORAGE_CLUSTERS) as string) as IClusters)
      : undefined;

  if (clusters === undefined || localStorage.getItem('migrated') === 'true') {
    return clusters;
  }

  const azureCredentials = localStorage.getItem('azure');
  const awsCredentials = localStorage.getItem('aws');
  const googleCredentials = localStorage.getItem('google');
  const rancherCredentials = localStorage.getItem('rancher');
  const googleClientID = localStorage.getItem('google_clientid');
  const oidcCredentials = localStorage.getItem('oidc');

  for (const id in clusters) {
    if (clusters[id].authProvider === '') {
      clusters[id].authProvider = 'kubeconfig';
    } else if (clusters[id].authProvider === 'aws') {
      if (awsCredentials !== null) {
        const parsed = JSON.parse(awsCredentials);
        const parts = id.split('_');

        if (parts.length >= 3) {
          if (parsed.hasOwnProperty(parts[1])) {
            clusters[id].authProviderAWS = {
              clusterID: parts.slice(2, parts.length).join('_'),
              accessKeyID: parsed[parts[1]].accessKeyID,
              region: parts[1],
              secretKey: parsed[parts[1]].secretKey,
            };
          }
        }
      }
    } else if (clusters[id].authProvider === 'google') {
      if (googleCredentials !== null && googleClientID !== null) {
        const parsed = JSON.parse(googleCredentials);

        clusters[id].authProviderGoogle = {
          accessToken: parsed.access_token,
          clientID: googleClientID,
          expires: 0,
          idToken: parsed.id_token,
          refreshToken: parsed.refresh_token,
          tokenType: parsed.token_type,
        };
      }
    } else if (clusters[id].authProvider === 'rancher') {
      if (rancherCredentials !== null) {
        const parsed = JSON.parse(rancherCredentials);

        clusters[id].authProviderRancher = {
          rancherUrl: parsed.rancherUrl,
          username: parsed.username,
          password: parsed.password,
          bearerToken: parsed.bearerToken,
          expires: parsed.expires,
        };
      }
    } else if (clusters[id].authProvider === 'azure') {
      if (azureCredentials !== null) {
        clusters[id].authProviderAzure = JSON.parse(azureCredentials) as IClusterAuthProviderAzure;
      }
    } else if (clusters[id].authProvider.startsWith('oidc__')) {
      if (oidcCredentials !== null) {
        const authProvider = clusters[id].authProvider.replace('oidc__', '');
        const oidc = JSON.parse(oidcCredentials);

        clusters[id].authProvider = 'oidc';

        if (oidc.hasOwnProperty(authProvider)) {
          clusters[id].authProviderOIDC = {
            clientID: oidc[authProvider].clientID,
            clientSecret: oidc[authProvider].clientSecret,
            idToken: oidc[authProvider].idToken,
            idpIssuerURL: oidc[authProvider].idpIssuerURL,
            refreshToken: oidc[authProvider].refreshToken,
            certificateAuthority: oidc[authProvider].certificateAuthority,
            accessToken: oidc[authProvider].accessToken,
            expiry: oidc[authProvider].expiry,
          };
        }
      }
    }
  }

  localStorage.setItem(STORAGE_CLUSTERS, JSON.stringify(clusters));
  localStorage.setItem('migrated', 'true');
  localStorage.removeItem('aws');
  localStorage.removeItem('azure');
  localStorage.removeItem('google_clientid');
  localStorage.removeItem('google');
  localStorage.removeItem('rancher');
  localStorage.removeItem('oidc');
  localStorage.removeItem('oidc_last');

  return clusters;
};

// readSettings returns the settings set by the user. If the user had not modified the settings yet, return the default
// settings. We have to check the parsed settings from localStorage key by key, because on older version it is possible,
// that a key is missing.
export const readSettings = (): IAppSettings => {
  const settingsFromStorage = localStorage.getItem(STORAGE_SETTINGS);

  if (settingsFromStorage) {
    const settings = JSON.parse(settingsFromStorage);

    return {
      theme: settings.theme ? settings.theme : DEFAULT_SETTINGS.theme,
      authenticationEnabled: settings.hasOwnProperty('authenticationEnabled')
        ? settings.authenticationEnabled
        : DEFAULT_SETTINGS.authenticationEnabled,
      timeout: settings.timeout ? settings.timeout : DEFAULT_SETTINGS.timeout,
      terminalFontSize: settings.terminalFontSize ? settings.terminalFontSize : DEFAULT_SETTINGS.terminalFontSize,
      terminalScrollback: settings.terminalScrollback
        ? settings.terminalScrollback
        : DEFAULT_SETTINGS.terminalScrollback,
      enablePodMetrics: settings.hasOwnProperty('enablePodMetrics')
        ? settings.enablePodMetrics
        : DEFAULT_SETTINGS.enablePodMetrics,
      queryLimit: settings.queryLimit ? settings.queryLimit : DEFAULT_SETTINGS.queryLimit,
      queryRefetchInterval: settings.queryRefetchInterval
        ? settings.queryRefetchInterval
        : DEFAULT_SETTINGS.queryRefetchInterval,
      queryConfig: DEFAULT_SETTINGS.queryConfig,
      sshKey: settings.sshKey ? settings.sshKey : DEFAULT_SETTINGS.sshKey,
      sshPort: settings.sshPort ? settings.sshPort : DEFAULT_SETTINGS.sshPort,
      sshUser: settings.sshUser ? settings.sshUser : DEFAULT_SETTINGS.sshUser,
      prometheusEnabled: settings.hasOwnProperty('prometheusEnabled')
        ? settings.prometheusEnabled
        : DEFAULT_SETTINGS.prometheusEnabled,
      prometheusNamespace: settings.prometheusNamespace
        ? settings.prometheusNamespace
        : DEFAULT_SETTINGS.prometheusNamespace,
      prometheusSelector: settings.prometheusSelector
        ? settings.prometheusSelector
        : DEFAULT_SETTINGS.prometheusSelector,
      prometheusPort: settings.prometheusPort ? settings.prometheusPort : DEFAULT_SETTINGS.prometheusPort,
      prometheusUsername: settings.prometheusUsername
        ? settings.prometheusUsername
        : DEFAULT_SETTINGS.prometheusUsername,
      prometheusPassword: settings.prometheusPassword
        ? settings.prometheusPassword
        : DEFAULT_SETTINGS.prometheusPassword,
      prometheusAddress: '',
      prometheusDashboardsNamespace: settings.prometheusDashboardsNamespace
        ? settings.prometheusDashboardsNamespace
        : DEFAULT_SETTINGS.prometheusDashboardsNamespace,
      elasticsearchEnabled: settings.hasOwnProperty('elasticsearchEnabled')
        ? settings.elasticsearchEnabled
        : DEFAULT_SETTINGS.elasticsearchEnabled,
      elasticsearchNamespace: settings.elasticsearchNamespace
        ? settings.elasticsearchNamespace
        : DEFAULT_SETTINGS.elasticsearchNamespace,
      elasticsearchSelector: settings.elasticsearchSelector
        ? settings.elasticsearchSelector
        : DEFAULT_SETTINGS.elasticsearchSelector,
      elasticsearchPort: settings.elasticsearchPort ? settings.elasticsearchPort : DEFAULT_SETTINGS.elasticsearchPort,
      elasticsearchUsername: settings.elasticsearchUsername
        ? settings.elasticsearchUsername
        : DEFAULT_SETTINGS.elasticsearchUsername,
      elasticsearchPassword: settings.elasticsearchPassword
        ? settings.elasticsearchPassword
        : DEFAULT_SETTINGS.elasticsearchPassword,
      elasticsearchAddress: '',
      jaegerEnabled: settings.hasOwnProperty('jaegerEnabled') ? settings.jaegerEnabled : DEFAULT_SETTINGS.jaegerEnabled,
      jaegerNamespace: settings.jaegerNamespace ? settings.jaegerNamespace : DEFAULT_SETTINGS.jaegerNamespace,
      jaegerSelector: settings.jaegerSelector ? settings.jaegerSelector : DEFAULT_SETTINGS.jaegerSelector,
      jaegerPort: settings.jaegerPort ? settings.jaegerPort : DEFAULT_SETTINGS.jaegerPort,
      jaegerUsername: settings.jaegerUsername ? settings.jaegerUsername : DEFAULT_SETTINGS.jaegerUsername,
      jaegerPassword: settings.jaegerPassword ? settings.jaegerPassword : DEFAULT_SETTINGS.jaegerPassword,
      jaegerQueryBasePath: settings.jaegerQueryBasePath
        ? settings.jaegerQueryBasePath
        : DEFAULT_SETTINGS.jaegerQueryBasePath,
      jaegerAddress: '',
      proxyEnabled: settings.hasOwnProperty('proxyEnabled') ? settings.proxyEnabled : DEFAULT_SETTINGS.proxyEnabled,
      proxyAddress: settings.proxyAddress ? settings.proxyAddress : DEFAULT_SETTINGS.proxyAddress,
      helmShowAllVersions: settings.hasOwnProperty('helmShowAllVersions')
        ? settings.helmShowAllVersions
        : DEFAULT_SETTINGS.helmShowAllVersions,
    };
  }

  return DEFAULT_SETTINGS;
};

// readTemporaryCredentials returns the temporary stored creedentials for a cloud provider or ODIC from localStorage.
export const readTemporaryCredentials = (
  authProvider: TAuthProvider,
):
  | undefined
  | IClusterAuthProviderAWS
  | IClusterAuthProviderAzure
  | IClusterAuthProviderDigitalOcean
  | IClusterAuthProviderGoogle
  | IClusterAuthProviderRancher
  | IClusterAuthProviderOIDC => {
  const credentials = localStorage.getItem(STORAGE_TEMPORARY_CREDENTIALS);

  if (credentials === null) {
    return undefined;
  } else if (authProvider === 'aws') {
    return JSON.parse(credentials) as IClusterAuthProviderAWS;
  } else if (authProvider === 'azure') {
    return JSON.parse(credentials) as IClusterAuthProviderAzure;
  } else if (authProvider === 'digitalocean') {
    return JSON.parse(credentials) as IClusterAuthProviderDigitalOcean;
  } else if (authProvider === 'google') {
    return JSON.parse(credentials) as IClusterAuthProviderGoogle;
  } else if (authProvider === 'rancher') {
    return JSON.parse(credentials) as IClusterAuthProviderRancher;
  } else if (authProvider === 'oidc') {
    return JSON.parse(credentials) as IClusterAuthProviderOIDC;
  } else {
    return undefined;
  }
};

// removeCluster removes the saved cluster from localStorage.
export const removeCluster = (): void => {
  localStorage.removeItem(STORAGE_CLUSTER);
};

// removeClusters removes the saved clusters from localStorage.
export const removeClusters = (): void => {
  localStorage.removeItem(STORAGE_CLUSTERS);
};

// removeTemporaryCredentials removes the temporary saved credentials from localStorage.
export const removeTemporaryCredentials = (): void => {
  localStorage.removeItem(STORAGE_TEMPORARY_CREDENTIALS);
};

// saveBookmarks saves the given bookmarks to localStorage.
export const saveBookmarks = (bookmarks: IBookmark[]): void => {
  localStorage.setItem(STORAGE_BOOKMARKS, JSON.stringify(bookmarks));
};

// saveCluster saves the given cluster id to localStorage.
export const saveCluster = (cluster: string): void => {
  localStorage.setItem(STORAGE_CLUSTER, cluster);
};

// saveClusters saves the given clusters object to localStorage.
export const saveClusters = (clusters: IClusters): void => {
  localStorage.setItem(STORAGE_CLUSTERS, JSON.stringify(clusters));
};

// saveSettings saves the users settings to the localStorage.
export const saveSettings = (settings: IAppSettings): void => {
  localStorage.setItem(STORAGE_SETTINGS, JSON.stringify(settings));
};

// saveTemporaryCredentials saves the credentials for a cloud provider or OIDC temporary to the localStorage.
export const saveTemporaryCredentials = (
  credentials:
    | IClusterAuthProviderAWS
    | IClusterAuthProviderAzure
    | IClusterAuthProviderDigitalOcean
    | IClusterAuthProviderGoogle
    | IClusterAuthProviderRancher
    | IClusterAuthProviderOIDC,
): void => {
  localStorage.setItem(STORAGE_TEMPORARY_CREDENTIALS, JSON.stringify(credentials));
};
