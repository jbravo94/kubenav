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
  IonToggle,
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
  const [rancherHost, setRancherHost] = useState<string>('');
  const [rancherPort, setRancherPort] = useState<number>(443);
  const [secure, setSecure] = useState<boolean>(true);
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [bearerToken, setBearerToken] = useState<string>('');
  const [error, setError] = useState<string>('');

  if (IS_DEBUG_ENABLED) {
    useEffect(() => {
      setRancherHost(RANCHER_URL);
      setBearerToken(RANCHER_BEARER_TOKEN);
    });
  }

  const handleSecure = (event) => {
    setSecure(event.target.value);
  };

  const handleRancherHost = (event) => {
    setRancherHost(event.target.value);
  };

  const handleRancherPort = (event) => {
    setRancherPort(event.target.value);
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
    if (rancherHost === '') {
      setError('Rancher Host is required.');
    } else {
      saveTemporaryCredentials({
        rancherHost: rancherHost,
        rancherPort: rancherPort,
        secure: secure,
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
            <IonLabel position="stacked">Rancher Host</IonLabel>
            <IonInput type="text" required={true} value={rancherHost} onInput={handleRancherHost} />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Rancher Port</IonLabel>
            <IonInput type="number" required={true} value={rancherPort} onInput={handleRancherPort} />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Secure</IonLabel>
            <IonToggle checked={secure} onInput={handleSecure} />
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
