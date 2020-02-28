import { SIOP_KEY_ALGO } from "./DID";
import { JWTHeader, JWTClaims } from "./JWT";
import { DIDDocument } from './DIDDocument'
import { JWK } from "jose";

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

interface SIOPRegistration {
  id_token_signed_response_alg: SIOP_KEY_ALGO[]
}

export interface SIOPDirectRegistration extends SIOPRegistration {
  jwks: string;
}

export interface SIOPIndirectRegistration extends SIOPRegistration {
  jwks_uri: string;
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
  registration: SIOPIndirectRegistration | SIOPDirectRegistration;
  response_mode?: SIOPResponseMode
  did_doc?: DIDDocument;
}

export interface SIOPRequestHeader extends JWTHeader {
  kid: string;
}

export interface SIOPRequestPayload extends JWTClaims {
  iss: string;
  response_type: SIOPResponseType;
  client_id: string;
  scope: SIOPScope;
  state: string;
  nonce: string;
  registration: SIOPIndirectRegistration | SIOPDirectRegistration
  response_mode?: SIOPResponseMode
  did_doc?: string;
}

export interface SIOPRequestCall{
  iss: string;
  client_id: string;
  key: JWK.Key;
  alg: string[];
  kid?: string;
  response_mode?: SIOPResponseMode
  did_doc?: DIDDocument;
}