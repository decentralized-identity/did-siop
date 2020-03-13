export interface SiopUriRequest {
  siopUri: string;
  clientUriRedirect: string;
}

export interface SiopAckRequest {
  validationRequest: boolean;
}

export interface SiopResponse {
  validationResponse: boolean;
  did: string;
}