// App packages
const UniversalResolver = require('daf-resolver-universal')
const didKeyDriver = require('did-method-key').driver()
const jose = require('jose')
const base64url = require('base64url')
const multibase = require('multibase')
const multicodec = require('multicodec')
const crypto = require('crypto')
const url = require('url')

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
const resolver = new UniversalResolver.DafUniversalResolver({url: UNIVERSAL_RESOLVER_URL})

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
        return keyStore.toJWKS()
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
    static filterValue(obj, key, value) {
        return obj.find(function(v){ return v[key] === value});
    }

    static findAuthnMethod(didDoc, id) {
        if (typeof didDoc.authentication === 'undefined') {
            return null
        }
    
        return didDoc.authentication.find( (v) => {
            if (v === id) {                
                // FIXME: TODO: this only looks at the `publicKey` section
                // Note: `id` values of public keys can be the same as the 
                // subject `id` of the DID Doc. 
                if (typeof didDoc.publicKey === 'undefined') {
                    return null
                }
                return SiopHelper.filterValue(didDoc.publicKey, 'id', id)
            } else if (typeof v.id !== 'undefined' && v.id === id) {
                return v
            }
        })
    }    

    static authnMethodAsJwk(authnMethod) {
        if (typeof authnMethod !== 'undefined') {
            if (typeof authnMethod.publicKeyJwk !== 'undefined') {
                return jose.JWK.asKey(authnMethod.publicKeyJwk)
            } else {
                console.error('Conversion from verification method ' + authnMethod.id + ' to JWK not implemented yet')               
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

    static async _verifyDidAuthnSiopRequest(requestToken) {
        if (!requestToken.payload.scope.split(' ').includes('did_authn')) {
            console.error('Cannot read `did_authn` scope from request token')
            return false
        }
    
        // FIXME: TODO: `kid` might be changed to something else
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
        const didDoc = await resolver.resolve(did)
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
    
        return jose.JWT.verify(requestToken, authJwk)
    }

    static async verify(siopRequestUri, uniResolver) {

        const siopRequest = url.parse(siopRequestUri, true)
        if (typeof siopRequest.query === 'undefined') {
            throw 'Invalid SIOP request'
        }

        var requestToken
        if (typeof siopRequest.query.request_uri !== 'undefined') {
            // FIXME: TODO: if request_uri is present, fetch request token from URI
            throw 'request_uri not supported yet'
        } else if (typeof siopRequest.query.request !== 'undefined') {
            requestToken = jose.JWT.decode(siopRequest.query.request, { complete: true })
        } else {
            throw 'Cannot find request token in SIOP request'
        }
        
        if (!SiopRequest._verifyPlainSiopRequest(requestToken)) {
            console.error("Couldn't verify OIDC SIOP request")
            return false
        }
    
        if (!SiopRequest._verifyDidAuthnSiopRequest(requestToken)) {
            console.error("Couldn't verify DID Authn SIOP request")
            return false
        }
    
        return true        
    }
}

class SiopResponse {

    constructor() {

    }

    setIdentityController() {

    }

    setSiopRequest() {

    }

    asJwt() {

    }

    verify() {

    }
}


// function verifySiopResponse(encodedIdToken) {
//     const idToken = jose.JWT.decode(encodedIdToken, { complete: true })
    
//     // SIOP validation

//     if (typeof idToken.header.kid !== 'undefined') {
//         console.error('Cannot read `kid` from `id_token`')
//         return
//     }
//     const kid = idToken.header.kid

//     if (typeof idToken.payload.iss !== 'undefined') {
//         console.error('Cannot read `iss` from `id_token`')
//         return
//     }
//     const did = idToken.payload.iss;

//     // Resolve DID Document from SIOP
//     resolver
//         .resolve(did)
//         .then((didDoc, kid) => {
//             const verificationMethod = filterValue(didDoc, 'id', kid)

//             // Get `kid` from `id_token`
//             console.log(didDoc)
//          })
//         .catch(() => {
//             console.log('Error in resolutation process')
//         });
//     // find
// }

function main() {

    const idControllerRp = new IdentityController()
    const siopRequest = new SiopRequest()
    siopRequest.setIdentityController(idControllerRp)
    siopRequest.setCallbackUrl('https://localhost:8888/cb')
    console.log('### Generating SIOP request...')
    const siopRequestUri = siopRequest.generateSiopRequest()
    console.log('### Redirect the user to this URI: \n' + siopRequestUri)

    console.log('### Verifying SIOP request...')
    SiopRequest.verify(siopRequestUri, resolver)
}

main()

