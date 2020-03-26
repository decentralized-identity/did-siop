export interface SiopUriRequest {
  siopUri: string;
}

export interface SiopResponseJwt {
  jwt: string;
}

export interface SiopRequestJwt {
  jwt: string;
}

export interface SiopResponseQueue extends SiopResponseJwt {
  callbackUrl: string;
}

export interface SiopAckRequest {
  validationRequest: boolean;
}

export interface SiopResponse {
  validationResponse: boolean;
  did: string;
}