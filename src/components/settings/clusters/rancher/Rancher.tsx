import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonToast,
} from '@ionic/react';
import React, { useState, useEffect } from 'react';
import { RouteComponentProps, withRouter } from 'react-router-dom';

import {
  GOOGLE_OAUTH2_ENDPOINT,
  GOOGLE_REDIRECT_URI,
  GOOGLE_RESPONSE_TYPE,
  GOOGLE_SCOPE,
  IS_DEBUG_ENABLED,
} from '../../../../utils/constants';
import { RANCHER_BEARER_TOKEN, RANCHER_URL } from '../../../../utils/debugConstants';
import { saveTemporaryCredentials } from '../../../../utils/storage';

export interface IRancherProps extends RouteComponentProps {
  close: () => void;
}

const Rancher: React.FunctionComponent<IRancherProps> = ({ close, history }: IRancherProps) => {
  const [rancherUrl, setRancherUrl] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [bearerToken, setBearerToken] = useState<string>('');
  const [error, setError] = useState<string>('');

  if (IS_DEBUG_ENABLED) {
    useEffect(() => {
      setRancherUrl(RANCHER_URL);
      setBearerToken(RANCHER_BEARER_TOKEN);
    });
  }

  const handleRancherUrl = (event) => {
    setRancherUrl(event.target.value);
  };

  const handleUsername = (event) => {
    setUsername(event.target.value);
  };

  const handlePassword = (event) => {
    setPassword(event.target.value);
  };

  const handleBearerToken = (event) => {
    setBearerToken(event.target.value);
  };

  const handleSignIn = () => {
    if (rancherUrl === '') {
      setError('Rancher Url is required.');
    } else {
      saveTemporaryCredentials({
        rancherUrl: rancherUrl,
        username: username,
        password: password,
        bearerToken: bearerToken,
        expires: 0,
      });

      close();
      history.push('/settings/clusters/rancher');
    }
  };

  return (
    <IonCard>
      <div className="card-header-image">
        <img alt="Rancher" src="/assets/card-header-rancher.png" />
      </div>
      <IonCardHeader>
        <IonCardTitle>Import from Rancher Platform</IonCardTitle>
      </IonCardHeader>

      <IonCardContent>
        <p className="paragraph-margin-bottom">
          Choose this option to import your RKE clusters from the Rancher Platform.
        </p>

        <IonList className="paragraph-margin-bottom" lines="full">
          <IonItem>
            <IonLabel position="stacked">Rancher Url</IonLabel>
            <IonInput type="text" required={true} value={rancherUrl} onInput={handleRancherUrl} pattern="url" />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Username</IonLabel>
            <IonInput type="text" required={true} value={username} onInput={handleUsername} />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Password</IonLabel>
            <IonInput type="password" required={true} value={password} onInput={handlePassword} />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Bearer Token (optional)</IonLabel>
            <IonInput type="text" required={false} value={bearerToken} onInput={handleBearerToken} />
          </IonItem>
        </IonList>

        <IonButton expand="block" onClick={() => handleSignIn()}>
          Sign In to Rancher
        </IonButton>
      </IonCardContent>

      <IonToast isOpen={error !== ''} onDidDismiss={() => setError('')} message={error} duration={3000} />
    </IonCard>
  );
};

export default withRouter(Rancher);
