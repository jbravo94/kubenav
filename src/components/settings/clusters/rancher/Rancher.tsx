import {
  IonActionSheet,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonToast,
  IonToggle,
} from '@ionic/react';
import React, { useState, useEffect } from 'react';
import { RouteComponentProps, withRouter } from 'react-router-dom';
import { IClusterAuthProviderRancher } from '../../../../declarations';

import { readTemporaryCredentials, saveTemporaryCredentials } from '../../../../utils/storage';

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
  const [showActionSheet, setShowActionSheet] = useState(false);

  useEffect(() => {
    const credentials = readTemporaryCredentials('rancher') as undefined | IClusterAuthProviderRancher;

    if (credentials) {
      if (credentials.rancherHost) {
        setRancherHost(credentials.rancherHost);
      }
      if (credentials.rancherPort) {
        setRancherPort(credentials.rancherPort);
      }
      if (credentials.secure) {
        setSecure(credentials.secure);
      }
      if (credentials.username) {
        setUsername(credentials.username);
      }
      if (credentials.password) {
        setPassword(credentials.password);
      }
      if (credentials.bearerToken) {
        setBearerToken(credentials.bearerToken);
      }
    }
  }, []);

  const handleSecure = (event) => {
    const isSecure = event.target.checked;
    setSecure(isSecure);

    if (isSecure && rancherPort == 80) {
      setRancherPort(443);
    } else if (!isSecure && rancherPort == 443) {
      setRancherPort(80);
    }
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
            <IonToggle checked={secure} onIonChange={handleSecure} />
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
            <IonIcon slot="end" name="sync-circle" color="blue" size="large" onClick={() => setShowActionSheet(true)} />
          </IonItem>
        </IonList>
        <IonButton expand="block" onClick={() => handleSignIn()}>
          Sign In to Rancher
        </IonButton>
      </IonCardContent>

      <IonToast isOpen={error !== ''} onDidDismiss={() => setError('')} message={error} duration={3000} />
      <IonActionSheet
        isOpen={showActionSheet}
        onDidDismiss={() => setShowActionSheet(false)}
        cssClass="my-custom-class"
        buttons={[
          {
            text: 'Generate',
            role: 'destructive',
            handler: () => {
              console.log('Delete clicked');
            },
          },
          {
            text: 'Cancel',
            role: 'cancel',
            handler: () => {
              console.log('Cancel clicked');
            },
          },
        ]}
      ></IonActionSheet>
    </IonCard>
  );
};

export default withRouter(Rancher);
