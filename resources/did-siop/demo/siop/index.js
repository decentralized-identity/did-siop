// App packages
const UniversalResolver = require('daf-resolver-universal')
const jose = require('jose')
const base64url = require('base64url')
const multibase = require('multibase')
const multicodec = require('multicodec')
const crypto = require('crypto')
const url = require('url')
var qrcode = require('qrcode-terminal')

const {
    JWE,   // JSON Web Encryption (JWE) 
    JWK,   // JSON Web Key (JWK)
    JWKS,  // JSON Web Key Set (JWKS)
    JWS,   // JSON Web Signature (JWS)
    JWT,   // JSON Web Token (JWT)
    errors // errors utilized by jose
 } = jose  

// App Configuration
const UNIVERSAL_RESOLVER_URL = 'https://uniresolver.io/1.0/identifiers/'

// DAF Configuration
const uniResolver = new UniversalResolver.DafUniversalResolver({url: UNIVERSAL_RESOLVER_URL})

class IdentityController {

    constructor() {
        // creates a new did:key
        const key = jose.JWK.generateSync('OKP', 'Ed25519')
        const id = multibase.encode('base58btc', multicodec.addPrefix('ed25519-pub', base64url.toBuffer(key.x))).toString() 
        const did = 'did:key:' + id
        this.key = key
        this.did = did
    }

    setJwksResolverHttpBindingUrl(url) {
        // Example: https://uniresolver.io/1.0/identifiers/did:example:0xab;transform-keys=jwks
        this.remoteResolverUrl = url
    }

    getJwks() {
        const keyStore = new jose.JWKS.KeyStore([ this.key ])
        return keyStore.toJWKS(false)
    }

    getJwksUri() {
        return (typeof this.remoteUrl !== 'undefined') ?
            (this.remoteUrl + '/' + this.did + ';transform-keys=jwks') : (this.remoteUrl)
    }

    getSigningKey() {
        return this.key
    }

    getSigningKeyId() {
        return this.did
    }
}

class SiopHelper {

    static findAuthnMethod(didDoc, id) {
        if (typeof didDoc.authentication === 'undefined') {
            return null
        }
        if (typeof didDoc.publicKey === 'undefined') {
            return null
        }

        var found = null
        for (const authnMethod of didDoc.authentication) {
            if (authnMethod === id) {
                found = didDoc.publicKey.find(element => {
                    return element.id === id
                })
            } else if (typeof authnMethod.id !== 'undefined' && authnMethod.id === id) {
                found = authnMethod    
            }
    
            if (found !== null)
                break
        }

        return found
    }

    static authnMethodAsJwk(authnMethod) {
        if (typeof authnMethod !== 'undefined') {
            if (typeof authnMethod.publicKeyJwk !== 'undefined') {
                return jose.JWK.asKey(authnMethod.publicKeyJwk)
            } else {
                // FIXME: TODO: implement this conversion!
                console.warn('Conversion from verification method ' + authnMethod.id + ' to JWK not implemented yet')
                return idControllerRp.getSigningKey()
                //                
            }
        }
        return null         
    }
    
    static authnMethodIsEthereumAddress(authnMethod) {
        if (typeof authnMethod === 'undefined') {
            return false
        }
    
        return (typeof authnMethod.ethereumAddress !== 'undefined')
    }
    
}

class SiopRequest {

    constructor() {
        const nonce = crypto.randomBytes(12).toString('hex')
        const secret = crypto.randomBytes(16).toString('hex')
        const state = crypto.createHmac('sha256', secret)
            .update(nonce)
            .digest('hex')
        
        this.nonce = nonce
        this.state = state
        this.secret = secret
        this.response_mode = 'fragment'
        this.supportedVerificationAlgorithms = [ 'ES256K', 'EdSA', 'RS256' ]
    }

    setIdentityController(idController) {
        this.idController = idController
    }

    setCallbackUrl(url) {
        this.callbackUrl = url
    }

    setResponseMode(responseMode) {
        if (responseMode !== 'fragment' && responseMode !== 'form_post') {
            throw 'unrecognized response_mode: ' + responseMode
        }
        this.responseMode = responseMode
    }

    setState(state) {
        this.state = state
    }

    generateRequestToken() {
        if (typeof this.idController === 'undefined') {
            throw 'undefined this.idController'
        }
        if (typeof this.callbackUrl === 'undefined') {
            throw 'undefined this.callbackUrl'
        }
    
        let requestToken = {
            'iss': this.idController.did,
            'response_type': 'id_token',
            'client_id': this.callbackUrl,
            'scope': 'openid did_authn',
            'state': this.state,
            'nonce': this.nonce,
        }

        // fragment is default, so no need to include in request
        if (this.responseMode !== 'fragment') {
            requestToken = {...requestToken, response_mode: this.responseMode }
        }

        // prefer jwks_uri over jwks embedded
        const jwksUri = this.idController.getJwksUri()
        if (typeof jwksUri !== 'undefined') {
            requestToken = {...requestToken, registration: { jwks_uri: jwksUri } }
        } else {
            requestToken = {...requestToken, registration: { jwks: this.idController.getJwks() } }
        }

        requestToken.registration['id_token_signed_response_alg'] = this.supportedVerificationAlgorithms
    
        return jose.JWT.sign(
            requestToken,
            this.idController.getSigningKey(),
            {
                header: {
                    typ: 'JWT',
                    did_auth_id: this.idController.getSigningKeyId()
                }
            }
        )
    }

    generateSiopRequest(requestToken, options = {}) {
        let siopRequest = 'openid://?response_type=id_token'
                  + '&client_id=' + encodeURI(this.callbackUrl)
                  + '&scope=openid%20did_authn'

        if (typeof options.requestUri !== 'undefined') {
            siopRequest = siopRequest + '&request_uri=' + base64url.encode(options.requestUri)
        } else {
            siopRequest = siopRequest + '&request=' + this.generateRequestToken()
        }

        return siopRequest
    }

    static async _verifyPlainSiopRequest(requestToken) {
        // FIXME: TODO: implement JWS verification based on `kid` and provided jwks/jwks_uri
        // check if jwks_uri contains a did and verify that did matches iss
        return true
    }

    static async _verifyDidAuthnSiopRequest(encodedRequestToken, uniResolver) {
        const requestToken = jose.JWT.decode(encodedRequestToken, { complete: true })

        if (!requestToken.payload.scope.split(' ').includes('did_authn')) {
            console.error('Cannot read `did_authn` scope from request token')
            return false
        }
    
        if (typeof requestToken.header.did_auth_id === 'undefined') {
            console.error('Cannot read `did_auth_id` from request token')
            return false
        }
        const didAuthId = requestToken.header.did_auth_id
    
        if (typeof requestToken.payload.iss === 'undefined') {
            console.error('Cannot read `iss` from request token')
            return false
        }
        const did = requestToken.payload.iss
    
        // Resolve DID Document from SIOP
        const didDoc = await uniResolver.resolve(did)
        if (typeof didDoc === 'undefined') {
            console.error('Could not resolve DID: ' + did)
            return false
        }

        if (typeof didDoc.authentication === 'undefined') {
            console.error('No `authentication` section found in DID Doc: ' + did)
            return false
        }

        const authnMethod = SiopHelper.findAuthnMethod(didDoc, didAuthId)
        if (typeof authnMethod === 'undefined' || authnMethod === null || typeof authnMethod === 'string') {
            console.error('Verification method ' + didAuthId + ' not found in `authentication` section in DID Doc')
            return false
        }

        const authJwk = SiopHelper.authnMethodAsJwk(authnMethod)
        if (authJwk === null) {
            if (!SiopHelper.authnMethodIsEthereumAddress(authnMethod)) {
                console.error('Verification method ' + didAuthId + ' not supported')
                return false
            } else {
                console.error('Verification method ' + didAuthId + ' not implemented yet')
                return false
            }
        }

        if (requestToken.header.kid !== authJwk.kid) {
            console.error('`kid` in DID Doc does not match `kid` in request token')
            return false
        }
    
        // FIXME: TODO: this should only check whether the `kid` matches, i.e., according to 
        return jose.JWT.verify(encodedRequestToken, authJwk)
    }

    static async verifyRequest(siopRequestUri) {

        const siopRequest = url.parse(siopRequestUri, true)
        if (typeof siopRequest.query === 'undefined') {
            throw 'Invalid SIOP request'
        }

        var encodedRequestToken = null
        if (typeof siopRequest.query.request_uri !== 'undefined') {
            // FIXME: TODO: if request_uri is present, fetch request token from URI
            console.error('request_uri not supported yet')
        } else if (typeof siopRequest.query.request !== 'undefined') {
            encodedRequestToken = siopRequest.query.request
        } else {
            console.error('Cannot find request token in SIOP request')
        }

        return encodedRequestToken
    }

    static async verifyRequestToken(encodedRequestToken, uniResolver) {
           
        if (!await SiopRequest._verifyPlainSiopRequest(encodedRequestToken)) {
            console.error("Couldn't verify OIDC SIOP request")
            return false
        }
    
        if (!await SiopRequest._verifyDidAuthnSiopRequest(encodedRequestToken, uniResolver)) {
            console.error("Couldn't verify DID Authn SIOP request")
            return false
        }
    
        return true        
    }
}

class SiopResponse {

    constructor() {

    }

    setIdentityController(idController) {
        this.idController = idController
    }

    _encryptResponseToken(idToken) {
        // FIXME: TODO: implement encryption here
        console.log('Encrypting `id_token`: ' + idToken)
        return null
    }

    generateResponseToken(encodedRequestToken, encrypt = false) {
        if (typeof this.idController === 'undefined') {
            throw 'undefined this.idController'
        }
        if (typeof encodedRequestToken === 'undefined') {
            throw 'undefined encodedRequestToken'
        }

        const requestToken = jose.JWT.decode(encodedRequestToken, { complete: true })

        let responseToken = {
            "iss": "https://self-issued.me",
            "exp": Math.ceil(new Date().getTime() / 1000 + 1000),
            "iat": Math.ceil(new Date().getTime() / 1000),
            "sub_jwk" : this.idController.getSigningKey().toJWK(false),
            // sub is the base64url encoded representation of the thumbprint of the key in the sub_jwk
            "sub": this.idController.getSigningKey().thumbprint,
            "did": this.idController.did
         }

         if (requestToken.payload.nonce !== 'undefined') {
            responseToken['nonce'] = requestToken.payload.nonce
         }
         if (requestToken.payload.state !== 'undefined') {
             responseToken['state'] = requestToken.payload.state
         }
    
        const idToken = jose.JWT.sign(
            responseToken,
            this.idController.getSigningKey(),
            {
                header: {
                    typ: 'JWT',
                    did_auth_id: this.idController.getSigningKeyId()
                }
            }
        )

        return (encrypt) ? (this._encryptResponseToken(idToken)) : (idToken)
    }

    static async verifyResponseToken(encodedResponseToken, uniResolver) {

        if (!SiopResponse._verifyPlainSiopResponse(encodedResponseToken)) {
            console.error("Couldn't verify OIDC SIOP response")
            return false
        }
    
        if (!SiopResponse._verifyDidAuthnSiopResponse(encodedResponseToken, uniResolver)) {
            console.error("Couldn't verify DID Authn SIOP response")
            return false
        }
    
        return true        
    }

    static async _verifyPlainSiopResponse(requestToken) {
        // FIXME: TODO: implement JWS verification based on `kid` and provided jwks/jwks_uri
        // check if jwks_uri contains a did and verify that did matches iss
        return true
    }

    static async _verifyDidAuthnSiopResponse(encodedRequestToken, uniResolver) {
        //const requestToken = jose.JWT.decode(encodedRequestToken, { complete: true })
        return true
    }
}

const idControllerRp = new IdentityController()
const idControllerSiop = new IdentityController()

async function main() {
    const siopRequest = new SiopRequest()
    siopRequest.setIdentityController(idControllerRp)
    siopRequest.setCallbackUrl('https://localhost:8888/cb')

    console.log('##########################################')
    console.log('##########################################')
    console.log('### Generating SIOP request...')
    const siopRequestUri = siopRequest.generateSiopRequest()
    console.log('### Now, redirect the user to this URI: ' + siopRequestUri)

    console.log('### Or, let the user scan this QR Code')
    qrcode.generate(siopRequestUri, { small: true });

    console.log('##########################################')
    console.log('##########################################')

    console.log('### Verifying SIOP request...')
    const encodedRequestToken = await SiopRequest.verifyRequest(siopRequestUri)
    if (encodeURI === null) {
        console.log('### Failed!')
        return
    }
    if (!await SiopRequest.verifyRequestToken(encodedRequestToken, uniResolver)) {
        console.log('### Failed!')
        return
    }
    console.log('### Successful!')

    console.log('##########################################')
    console.log('##########################################')
    console.log('### Generating SIOP response...')

    const siopResponse = new SiopResponse()
    siopResponse.setIdentityController(idControllerSiop)
    const encodedResponseToken = siopResponse.generateResponseToken(encodedRequestToken)
    if (encodedRequestToken === null) {
        console.log('### Failed!')
        return
    }
    console.log('### ' + encodedResponseToken)
    console.log('### Successful!')

    console.log('##########################################')
    console.log('##########################################')
    console.log('### Verifying SIOP response...')

    if (!await SiopResponse.verifyResponseToken(encodedResponseToken, uniResolver)) {
        console.log('### Failed!')
        return
    }
    console.log('### Succeeded!')
}

main()

