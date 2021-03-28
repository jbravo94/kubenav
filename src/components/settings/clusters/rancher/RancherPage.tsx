import {
  IonAlert,
  IonButton,
  IonButtons,
  IonCheckbox,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonMenuButton,
  IonPage,
  IonProgressBar,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import yaml from 'js-yaml';
import React, { memo, useContext, useState } from 'react';
import { useQuery } from 'react-query';
import { RouteComponentProps } from 'react-router';

import {
  ICluster,
  IContext,
  IClusterAuthProviderGoogle,
  IClusterAuthProviderRancher,
  IKubeconfig,
  IKubeconfigClusterRef,
  IKubeconfigCluster,
  IKubeconfigUserRef,
  IKubeconfigUser,
  IRancherGeneratedKubeconfig,
} from '../../../../declarations';
import {
  getGoogleClusters,
  getGoogleProjects,
  getGoogleTokens,
  getRancherClusters,
  getRancherKubeconfig,
} from '../../../../utils/api';
import { AppContext } from '../../../../utils/context';
import { readTemporaryCredentials } from '../../../../utils/storage';
import ErrorCard from '../../../misc/ErrorCard';

const isChecked = (id: string, clusters: ICluster[]): boolean => {
  for (const cluster of clusters) {
    if (cluster.id === id) {
      return true;
    }
  }

  return false;
};

type IRancherPageProps = RouteComponentProps;

const RancherPage: React.FunctionComponent<IRancherPageProps> = ({ location, history }: IRancherPageProps) => {
  const context = useContext<IContext>(AppContext);

  const { isError, isFetching, data, error } = useQuery<ICluster[] | undefined, Error>(
    `RancherPage`,
    async () => {
      try {
        const credentials = readTemporaryCredentials('rancher') as undefined | IClusterAuthProviderRancher;

        if (
          credentials &&
          credentials.rancherHost &&
          credentials.rancherPort &&
          ((credentials.username && credentials.password) || credentials.bearerToken)
        ) {
          const rancherClusters = await getRancherClusters(
            credentials.rancherHost,
            credentials.rancherPort,
            credentials.secure,
            credentials.bearerToken,
          );

          const tmpClusters: ICluster[] = [];

          rancherClusters.data.map((cluster) => {
            tmpClusters.push({
              id: cluster.id,
              name: cluster.name,
              url: '',
              certificateAuthorityData: '',
              clientCertificateData: '',
              clientKeyData: '',
              token: '',
              username: '',
              password: '',
              insecureSkipTLSVerify: false,
              authProvider: 'rancher',
              namespace: 'default',
            });
          });

          return tmpClusters;
        }
      } catch (err) {
        throw err;
      }
    },
    context.settings.queryConfig,
  );

  const [selectedClusters, setSelectedClusters] = useState<ICluster[]>([]);

  const toggleSelectedCluster = (checked: boolean, cluster: ICluster) => {
    if (checked) {
      setSelectedClusters([...selectedClusters, cluster]);
    } else {
      setSelectedClusters(selectedClusters.filter((c) => c.id !== cluster.id));
    }
  };

  const getKubeconfigCluster = (name: string, clusters: IKubeconfigClusterRef[]): IKubeconfigCluster | null => {
    for (const cluster of clusters) {
      if (cluster.name === name) {
        return cluster.cluster;
      }
    }

    return null;
  };

  const getKubeconfigUser = (name: string, users: IKubeconfigUserRef[]): IKubeconfigUser | null => {
    for (const user of users) {
      if (user.name === name) {
        return user.user;
      }
    }

    return null;
  };

  const addClusterViaKubeconfig = (kubeconfig: string) => {
    if (kubeconfig === '') {
      throw 'Kubeconfig is required';
    } else {
      try {
        const clusters: ICluster[] = [];
        const config: IKubeconfig = yaml.load(kubeconfig) as IKubeconfig;

        for (const ctx of config.contexts) {
          const cluster = getKubeconfigCluster(ctx.context.cluster, config.clusters);
          const user = getKubeconfigUser(ctx.context.user, config.users);

          if (ctx.name === '' || cluster === null || user === null || !cluster.server) {
            throw new Error('Invalid kubeconfig');
          }

          if (
            !user['client-certificate-data'] &&
            !user['client-key-data'] &&
            !user.token &&
            !user.username &&
            !user.password &&
            !user['auth-provider']
          ) {
            throw new Error('Invalid kubeconfig');
          }

          if (user['auth-provider'] && user['auth-provider'].name !== 'oidc') {
            throw new Error('Invalid kubeconfig');
          } else if (user['auth-provider'] && user['auth-provider'].name === 'oidc') {
            clusters.push({
              id: '',
              name: ctx.name,
              url: cluster.server,
              certificateAuthorityData: cluster['certificate-authority-data']
                ? cluster['certificate-authority-data']
                : '',
              clientCertificateData: '',
              clientKeyData: '',
              token: '',
              username: '',
              password: '',
              insecureSkipTLSVerify: cluster['insecure-skip-tls-verify'] ? cluster['insecure-skip-tls-verify'] : false,
              authProvider: 'kubeconfig',
              authProviderOIDC: {
                clientID: user['auth-provider'].config['client-id'] ? user['auth-provider'].config['client-id'] : '',
                clientSecret: user['auth-provider'].config['client-secret']
                  ? user['auth-provider'].config['client-secret']
                  : '',
                idToken: user['auth-provider'].config['id-token'] ? user['auth-provider'].config['id-token'] : '',
                idpIssuerURL: user['auth-provider'].config['idp-issuer-url']
                  ? user['auth-provider'].config['idp-issuer-url']
                  : '',
                refreshToken: user['auth-provider'].config['refresh-token']
                  ? user['auth-provider'].config['refresh-token']
                  : '',
                certificateAuthority: user['auth-provider'].config['idp-certificate-authority-data']
                  ? user['auth-provider'].config['idp-certificate-authority-data']
                  : '',
                accessToken: '',
                expiry: Math.floor(Date.now() / 1000),
              },
              namespace: 'default',
            });
          } else {
            clusters.push({
              id: '',
              name: ctx.name,
              url: cluster.server,
              certificateAuthorityData: cluster['certificate-authority-data']
                ? cluster['certificate-authority-data']
                : '',
              clientCertificateData: user['client-certificate-data'] ? user['client-certificate-data'] : '',
              clientKeyData: user['client-key-data'] ? user['client-key-data'] : '',
              token: user.token ? user.token : '',
              username: user.username ? user.username : '',
              password: user.password ? user.password : '',
              insecureSkipTLSVerify: cluster['insecure-skip-tls-verify'] ? cluster['insecure-skip-tls-verify'] : false,
              authProvider: 'kubeconfig',
              namespace: 'default',
            });
          }
        }

        context.addCluster(clusters);
      } catch (err) {
        throw err;
      }
    }
  };

  const addClusters = () => {
    selectedClusters.forEach(async (cluster) => {
      const credentials = readTemporaryCredentials('rancher') as undefined | IClusterAuthProviderRancher;

      if (credentials) {
        const kubeconfig: IRancherGeneratedKubeconfig = await getRancherKubeconfig(
          credentials.rancherHost,
          credentials.rancherPort,
          credentials.secure,
          credentials.bearerToken,
          cluster.id,
        );

        addClusterViaKubeconfig(kubeconfig.config);
      }
    });

    history.push('/settings/clusters');
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Add Clusters</IonTitle>
          {isError ? null : (
            <IonButtons slot="primary">
              <IonButton onClick={() => addClusters()}>Add</IonButton>
            </IonButtons>
          )}
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {isFetching ? (
          <IonProgressBar slot="fixed" type="indeterminate" color="primary" />
        ) : isError || !data ? (
          <ErrorCard error={error} text="Could not load RKE clusters" icon="/assets/icons/kubernetes/kubernetes.png" />
        ) : (
          data.map((cluster, index) => {
            return (
              <IonItem key={index}>
                <IonCheckbox
                  slot="start"
                  checked={isChecked(cluster.id, selectedClusters)}
                  onIonChange={(e) => toggleSelectedCluster(e.detail.checked, cluster)}
                />
                <IonLabel>{cluster.name}</IonLabel>
              </IonItem>
            );
          })
        )}
      </IonContent>
    </IonPage>
  );
};

export default memo(RancherPage, (): boolean => {
  return true;
});
