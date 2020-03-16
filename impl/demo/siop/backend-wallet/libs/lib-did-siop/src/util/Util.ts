import { v4 as uuidv4 } from 'uuid';
import { JWK } from 'jose';
import { PublicKey } from '../dtos/DIDDocument';
import Base58 from 'base-58'
import KeyEncoder from 'key-encoder'
import { DID_SIOP_ERRORS } from '../error';

function getRandomString(): string {
  return uuidv4()
}

function getHexPubKeyFromKey(key: JWK.Key): string {
  const pemPub = key.toPEM(false)
  // !!! TODO Convert other formats or use PEM as the standard format
  const keyEncoder = new KeyEncoder('secp256k1') 
  return keyEncoder.encodePublic(pemPub, 'pem', 'raw')
}

function getDIDFromKey(key: JWK.Key): string {
  return 'did:key:' + getBase58PubKeyFromKey(key)
}

function getBase58PubKeyFromKey(key: JWK.Key): string {
  const hexPubKey:string = getHexPubKeyFromKey(key)
  return Base58.encode(Buffer.from(hexPubKey))
}

function toHex(data: string): string {
  return Buffer.from(data, 'base64').toString('hex');
}

function getKeyIdFromKey(key: JWK.Key): string {
  const did = getDIDFromKey(key)
  return `${did}#veri-key1`;
}

function getKeyIdFromDID(did:string): string {
  return `${did}#veri-key1`;
}

function pubkeyHexToPem(pubkeyHex: string): string {
  const keyEncoder = new KeyEncoder('secp256k1')
  // removes the initial 0x
  const rawPubKey = pubkeyHex.includes('0x') ? pubkeyHex.slice(2) : pubkeyHex
  return keyEncoder.encodePublic(rawPubKey, 'raw', 'pem')
}

function getPemPubKey(pubKey: PublicKey): string {
  // public key in base58 format
  if (pubKey.publicKeyBase58) {
    return getPemFromBase58PubKey(pubKey.publicKeyBase58);
  }
  // public key in Hex format
  if (pubKey.publicKeyHex) {
    return pubkeyHexToPem(pubKey.publicKeyHex);
  }
  // public key in Ethereum format
  if (pubKey.ethereumAddress) {
    return pubkeyHexToPem(pubKey.ethereumAddress);
  }
  // public key in PEM format
  if (pubKey.publicKeyPem) return pubKey.publicKeyPem;
  // no other options implemented
  throw new Error(DID_SIOP_ERRORS.PUBKEY_FORMAT_NOT_SUPPORTED)
}

function getPemFromBase58PubKey(base58PubKey: string): string {
  const buff = Buffer.from(Base58.decode(base58PubKey));
  const pubKeyHex:string = buff.toString('utf8')
  return pubkeyHexToPem(pubKeyHex);
}

export {
  getPemPubKey,
  getDIDFromKey,
  pubkeyHexToPem,
  getKeyIdFromKey,
  getKeyIdFromDID,
  getRandomString,
  getHexPubKeyFromKey,
  getBase58PubKeyFromKey };