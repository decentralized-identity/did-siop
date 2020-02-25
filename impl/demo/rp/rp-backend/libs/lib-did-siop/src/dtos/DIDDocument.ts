import { Authentication } from "did-resolver/src/resolver";
import { SIOP_KEY_ALGO, SIOP_KEY_FORMAT } from "./DID";

export enum DidDocumentElementType {
  publicKey = 'publicKey',
  service = 'service'
}

export interface DidDocumentUpdateRequest {
  type: DidDocumentElementType,
  value: PublicKeyElement | ServiceEndpoint
}

export interface PublicKeyOut {
  publicKeyHex: string
  publicKeyPem: string
}

export interface DIDDocument {
  '@context': 'https://w3id.org/did/v1';
  id: string;
  publicKey: PublicKey[];
  authentication?: Authentication[]
  service?: ServiceEndpoint[];
}

export interface ServiceEndpoint {
  id: string;
  type: string;
  serviceEndpoint: string;
  description?: string;
}

export interface Proof {
  type: string;
  created: string;
  verificationMethod: string;
  jws: string;
}

export interface PublicKey {
  id: string;
  type: string;
  expiration?: string;
  controller?: string;
  owner?: string; // Because we are using did-jwt libs
  LoA?: string;
  ethereumAddress?: string;
  publicKeyBase64?: string;
  publicKeyBase58?: string;
  publicKeyHex?: string;
  publicKeyPem?: string;
  service?: ServiceEndpoint;
  proof?: Proof;
}

export interface PublicKeyElement {
  format: SIOP_KEY_FORMAT;
  type: SIOP_KEY_ALGO;
  publicKey: string;
  ethereumAddress?: string;
  publicKeyBase64?: string;
  publicKeyBase58?: string;
  publicKeyHex?: string;
  publicKeyPem?: string;
}
