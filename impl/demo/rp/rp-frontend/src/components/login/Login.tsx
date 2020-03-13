import React from 'react';
import DIDSIOPLoginButton from '../did-siop/LoginButton';
import { doPostCall } from '../../util/Util';

function Welcome(props: any) {
  return <h1>Hello, {props.name}</h1>;
}

function ShowWelcome() {
  return (
    <div>
      <Welcome name="Sara" />
      <DIDSIOPLoginButton onClick={() => userSignIn()}>
        <span>DID-SIOP Sign-In</span>
      </DIDSIOPLoginButton>
    </div>
  );
}

async function userSignIn(): Promise<void> {
  console.log('Going to Sign-In...')

  const data = { 
    clientUriRedirect: 'http://localhost:9001/siop/request-urls'
  };
  const url = 'http://localhost:9003/siop/user-sessions';

  const response = await doPostCall(data, url)

  console.log('Response:' + response)
}

export default ShowWelcome;