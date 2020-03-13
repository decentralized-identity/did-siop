export interface SiopUriRequest {
  siopUri: string;
}

export interface SiopAckRequest {
  validationRequest: boolean;
}

export interface SiopResponse {
  validationResponse: boolean;
  did: string;
}