import { SIOP_KEY_ALGO } from "./DID";

export enum SIOPScope {
  OPENID_DIDAUTHN = 'openid did_authn'
}

export enum SIOPResponseMode {
  FORM_POST = 'form_post', 
  FRAGMENT = 'fragment'
}

export enum SIOPResponseType {
  ID_TOKEN = 'id_token'
}

export interface SIOPRegistration {
  jwks_uri: string;
  id_token_signed_response_alg: SIOP_KEY_ALGO[]
}

export interface SIOPRequestURI {
  response_type: SIOPResponseType;
  client_id: string;
  scope: SIOPScope;
  request?: string;
  request_uri?: string;
}

export interface SIOPRequest {
  iss: string;
  kid: string;
  response_type: SIOPResponseType;
  client_id: string;
  scope: SIOPScope;
  state: string;
  nonce: string;
  registration: SIOPRegistration;
  response_mode?: SIOPResponseMode
  did_doc?: string;
}