import {
  IonButtons,
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonMenuButton,
  IonPage,
  IonTitle,
  IonToolbar,
  isPlatform,
} from '@ionic/react';
import React, { memo, useContext } from 'react';

import { IContext } from '../../declarations';
import { IS_DEBUG_ENABLED } from '../../utils/constants';
import { AppContext } from '../../utils/context';
import AddCluster from './clusters/AddCluster';
import ClusterItem from './clusters/ClusterItem';

const ClustersPage: React.FunctionComponent = () => {
  const context = useContext<IContext>(AppContext);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Clusters</IonTitle>
          {isPlatform('hybrid') || IS_DEBUG_ENABLED ? <AddCluster activator="button" /> : null}
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {context.clusters ? (
          Object.keys(context.clusters).map((key) => {
            return context.clusters ? <ClusterItem key={key} cluster={context.clusters[key]} /> : null;
          })
        ) : isPlatform('hybrid') || IS_DEBUG_ENABLED ? (
          <IonCard>
            <IonCardContent>
              <p className="paragraph-margin-bottom">
                It looks like you have not added a cluster yet. Click the button below to add your first cluster. You
                can choose between different options when adding a cluster. You can import your cluster directly from
                your cloud providers like Google, AWS or Azure. You can also import your clusters from an existing
                Kubeconfig file or you can choose the OIDC option.
              </p>
              <AddCluster activator="block-button" />
            </IonCardContent>
          </IonCard>
        ) : (
          <IonCard>
            <IonCardContent>
              <p className="paragraph-margin-bottom">
                It looks like you have not configured a cluster yet. kubenav loads your clusters from{' '}
                <code>~/.kube/config</code> or the <code>KUBECONFIG</code> environment variable. You can also pass a
                Kubeconfig to kubenav via the <code>--kubeconfig</code> flag.
              </p>
              <p>
                With the <code>--kubeconfig.include</code> and <code>--kubeconfig.exlude</code> flags you can specify a
                list of comma separated globs to load your Kubeconfig files from. The <code>--kubeconfig.sync</code>{' '}
                flags writes your cluster and namespace changes back to the loaded Kubeconfig file, so that the
                context/namespace is also changed in your terminal.
              </p>
            </IonCardContent>
          </IonCard>
        )}
      </IonContent>
    </IonPage>
  );
};

export default memo(ClustersPage, (): boolean => {
  return true;
});
