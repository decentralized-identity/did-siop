export enum DID_SIOP_ERRORS {
  NO_KID_PROVIDED = 'No kid provided.',
  NO_DIDDOCUMENT_KID = 'Kid could not be found on DID Document.',
  NO_ALG_SUPPORTED = 'Algorithm not supported.',
  NO_KEY_CURVE_SUPPORTED = 'Key Curve not supported.',
  NO_DIDAUTHN_SCOPE_INCLUDED = 'openid did_authn not included in scope.',
  KID_MISMATCH = 'Kid in DID Document does not match SIOP Request kid',
  DID_MISMATCH = 'DID in JWKS URI does not match Issuer DID',
  NOT_IMPLEMENTED = 'Feature not implemented yet.',
  NO_HEX_PUBKEY = 'No Public Key in Hex format found.',
  PUBKEY_FORMAT_NOT_SUPPORTED = 'Public Key format not supported.'
}