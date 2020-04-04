const BASE_URL = 'http://localhost:9001'
const SIOP_PATH = '/siop'
const REQUEST_URL = '/request-urls'

// wallet backend server endpoint to receive SIOP URI requests
const WALLET_BACKEND_URI = BASE_URL + SIOP_PATH + REQUEST_URL

export { 
  BASE_URL,
  WALLET_BACKEND_URI
}