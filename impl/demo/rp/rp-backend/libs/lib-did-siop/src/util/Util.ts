import uuidv1 from 'uuid/v1';
import { JWK } from 'jose';
import { ethers } from "ethers";
const forge = require('node-forge');
const {util: {binary: {base58}}} = forge;

function getRandomString(): string {
  return uuidv1()
}

function getDIDFromKey(key: JWK.Key): string {
  return 'did:key:' + getBase58PubKeyFromKey(key)
}

function getBase58PubKeyFromKey(key: JWK.Key): string {
  const publicKey = ethPublicKey(key)
  return base58.encode(Buffer.from(publicKey.replace('0x', '')))
}

function getKeyFromDID(did: string): string {
  const parsedDid = did.replace('did:key:', '')
  // skip leading `z` that indicates base58 encoding
  const buffer = base58.decode(parsedDid.substr(1))
  // buffer is: 0xed 0x01 <public key bytes>
  return (buffer.slice(2)).toString('hex')
}

 function ethPublicKey(key: JWK.Key): string {
  const wallet = new ethers.Wallet(toHex(<string>key.d));
  return new ethers.utils.SigningKey(wallet.privateKey).publicKey
}

function toHex(data: string): string {
  return Buffer.from(data, 'base64').toString('hex');
}

export { 
  getRandomString, 
  getDIDFromKey, 
  getKeyFromDID,
  getBase58PubKeyFromKey };