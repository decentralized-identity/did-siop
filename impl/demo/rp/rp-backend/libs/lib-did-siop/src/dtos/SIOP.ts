import { SIOP_KEY_ALGO } from "./DID";
import { JWTHeader, JWTClaims } from "./JWT";
import { DIDDocument } from './DIDDocument'
import { JWK, JSONWebKey } from "jose";

export enum SIOP_KEY_TYPE {
  EC = 'EC',
  RSA = 'RSA',
  OKP = 'OKP'
}

export enum SIOP_KEY_CURVE {
  SECP256k1 = 'secp256k1',
  ED25519 = 'ed25519'
}

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

export interface SIOPRequest extends SIOPRequestPayload {
  kid: string;
}

export interface SIOPJwtHeader extends JWTHeader {
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
  did_doc?: DIDDocument;
}

export interface SIOPRequestCall{
  iss: string;
  client_id: string;
  key: JWK.Key;
  alg: string[];
  kid?: string;
  response_mode?: SIOPResponseMode
  did_doc?: DIDDocument;
  request_uri?: string;
}

export enum SIOP_RESPONSE_ISS {
  SELF_ISSUE = 'https://self-issued.me'
}

export interface SIOPResponseCall{
  key: JWK.Key;
  alg: string[];
  did: string;
  nonce: string;
  redirect_uri: string;
  kid?: string;
  did_doc?: DIDDocument;
}

export interface SIOPResponse extends SIOPResponsePayload {
  kid: string;
}

export interface SIOPResponsePayload extends JWTClaims {
  iss: SIOP_RESPONSE_ISS.SELF_ISSUE;
  nonce: string;
  sub_jwk: JSONWebKey;
  sub: string;
  did: string;
  aud: string;
  exp?: string;
  iat?: number;
  did_doc?: DIDDocument;
}
