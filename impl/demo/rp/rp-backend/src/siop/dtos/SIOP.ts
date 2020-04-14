export interface SiopUriRequest {
  siopUri: string;
}

export interface SiopUriRedirect {
  clientUriRedirect?: string;
}

export interface SiopRequestJwt {
  jwt: string;
}

export interface SiopResponseJwt {
  jwt: string;
}

export interface SiopResponseProcessed extends SiopResponseJwt {
  validationResult: boolean;
}

export interface SiopAckRequest {
  validationRequest: boolean;
}

export interface SiopResponse {
  validationResult: boolean;
  did: string;
  jwt: string;
}

export interface SiopAckResponse {
  validationResult: boolean;
}

export interface QRResponse {
  imageQr: string;
  siopUri: string;
  terminalQr?: string;
}