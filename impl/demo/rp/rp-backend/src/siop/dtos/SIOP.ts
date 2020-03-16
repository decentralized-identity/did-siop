export interface SiopUriRequest {
  siopUri: string;
}

export interface SiopUriRedirect {
  clientUriRedirect: string;
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
}

export interface SiopAckResponse {
  validationResult: boolean;
}