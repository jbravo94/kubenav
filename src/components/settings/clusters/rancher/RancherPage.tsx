import {
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
import React, { memo, useContext, useState } from 'react';
import { useQuery } from 'react-query';
import { RouteComponentProps } from 'react-router';

import { ICluster, IContext, IClusterAuthProviderGoogle, IClusterAuthProviderRancher } from '../../../../declarations';
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

  const addClusters = () => {
    // Add secure flag in frontend
    // Make this function fetch kubeconfig and add it as cluster
    // Add Login Method
    // Store api token

    selectedClusters.forEach(async (cluster) => {
      const credentials = readTemporaryCredentials('rancher') as undefined | IClusterAuthProviderRancher;

      if (credentials) {
        const kubeconfig = await getRancherKubeconfig(
          credentials.rancherHost,
          credentials.rancherPort,
          credentials.secure,
          credentials.bearerToken,
          cluster.id,
        );
      }
    });

    context.addCluster(selectedClusters);
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
