export enum SIOP_KEY_ALGO {
  ES256K = 'ES256K',
  EdDSA = 'EdDSA',
  RS256 = 'RS256'
}

export enum SIOP_KEY_FORMAT {
  ETH = 'ethereumaddress',
  HEX = 'hex',
  PEM = 'pem',
  BASE64 = 'base64',
  BASE58 = 'base58'
}

export interface IDID {
  did: string;
}