import React from 'react';
import DIDSIOPLoginButton from '../did-siop/LoginButton';

function Welcome(props: any) {
  return <h1>Hello, {props.name}</h1>;
}

function ShowWelcome() {
  return (
    <div>
      <Welcome name="Sara" />
      <DIDSIOPLoginButton onClick={() => alert("Well done!")}>
        <span>Login using DID-SIOP</span>
      </DIDSIOPLoginButton>
    </div>
  );
}

export default ShowWelcome;