import { Authentication } from "did-resolver/src/resolver";
import { SIOP_KEY_ALGO, SIOP_KEY_FORMAT } from "./DID";
import { JWK } from "jose";
import { getBase58PubKeyFromKey, getDIDFromKey, getKeyIdFromDID, getHexPubKeyFromKey, pubkeyHexToPem } from "../util/Util";
import { DEFAULT_PUBKEY_TYPE } from "../constants";

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
  '@context': string[];
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

/**
 * Converts a secp256k1 object to a `did:key` method DID Document.
 *
 * @param {secp256k1} key
 * @returns {DidDocument}
 */
export function ecKeyToDidDoc(key: JWK.Key): DIDDocument {
  const base58PubKey:string = getBase58PubKeyFromKey(key)
  const hexPubKey:string = getHexPubKeyFromKey(key);
  const did:string = getDIDFromKey(key);
  const keyId:string = getKeyIdFromDID(did);

  const authentication:Authentication = {
    type: DEFAULT_PUBKEY_TYPE,
    publicKey: hexPubKey
  }

  return {
    '@context': ['https://w3id.org/did/v0.11'],
    id: did,
    publicKey: [{
      id: keyId,
      type: DEFAULT_PUBKEY_TYPE,
      controller: did,
      ethereumAddress: '0x' + hexPubKey,
      publicKeyHex: hexPubKey,
      publicKeyPem: pubkeyHexToPem(hexPubKey),
      publicKeyBase58: base58PubKey
    }],
    authentication: [authentication]
  }
}

export function getDIDDocument(did: string): DIDDocument {
  const base58PubKey:string = did.replace('did:key', '')
  const keyId = `${did}#veri-key1`;

  const authentication:Authentication = {
    type: DEFAULT_PUBKEY_TYPE,
    publicKey: base58PubKey
  }

  return {
    '@context': ['https://w3id.org/did/v0.11'],
    id: did,
    publicKey: [{
      id: keyId,
      type: DEFAULT_PUBKEY_TYPE,
      controller: did,
      publicKeyBase58: base58PubKey
    }],
    authentication: [authentication]
  }
}
