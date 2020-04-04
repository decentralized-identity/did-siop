const BASE_URL = 'http://15309900.ngrok.io'
const SIOP_PATH = '/siop'
const REQUEST_URL = '/request-urls'

// wallet backend server endpoint to receive SIOP URI requests
const WALLET_BACKEND_URI = BASE_URL + SIOP_PATH + REQUEST_URL

export { 
  BASE_URL,
  WALLET_BACKEND_URI
}