
# CIMD Service

[![MIT License](https://img.shields.io/badge/license-MIT-greeb.svg)](https://mit-license.org/) 

**CIMD Service** is an implementation of a _Client ID Metadata Document Service_, as described in [draft-ietf-oauth-client-id-metadata-document-00](https://www.ietf.org/archive/id/draft-ietf-oauth-client-id-metadata-document-00.html).

It allows developers to post their Client ID Metadata Document to the server and in return, the server will provide you with the `client_id` URI.

## Usage

> [!Note] 
> The responses in practice are actually without newlines & pretty formatting.

If the server encounters an unexpected error when processing the request, the response body will be the following JSON:
```json
{
  "error": "internal_server_error",
}
```

### Create a CIMD

Create a Client ID Metadata Document, cimd-server will automatically ignore the `client_id` property in the request json:
```http
POST /clients HTTP/1.1
host: cimd-service.example.org
content-type: application/json
content-length: 30

{
  "client_id": "https://example.com/client-metadata.json",
  "client_name": "Example Client",
  "client_uri": "https://example.com/",
  "redirect_uris": ["https://example.com/oauth/callback"],
  "response_types": ["code"],
  "grant_types": ["authorization_code", "refresh_token"],
  "token_endpoint_auth_method": "none",
  "scope": "atproto transition:generic",
  "dpop_bound_access_tokens": true,
  "application_type": "web"
}
```

The server will respond with:
```http
HTTP/1.1 200 OK
content-type: application/json
expires: Sun, 26 Oct 2025 05:10:33 GMT
x-request-id: 7a1801e2-d494-45e6-be95-571099eb8235
Date: Sun, 26 Oct 2025 05:09:07 GMT
Connection: keep-alive
Keep-Alive: timeout=5
Transfer-Encoding: chunked

{
  "client_id": "http://cimd-service.example.org/clients/bafyreiexz5n7t3fmtuyl37jqvto3tnu5wmy4vocdmqx34xmoeltmfr5wy4",
  "expiresAfter": "Sun, 26 Oct 2025 05:10:33 GMT"
}
```

If the Client ID Metadata Document is invalid, then you will receive the following error, where `validation_errors` indicates what went wrong:
```json
{
  "error":"invalid_client_metadata",
  "validation_errors":{"formErrors":["Invalid JSON"],"fieldErrors":{}}
}
```
Another example of an error response:
```json
{
  "error": "invalid_client_metadata",
  "validation_errors": {
    "formErrors": [],
    "fieldErrors": {
      "token_endpoint_auth_method": [
        "Invalid enum value. Expected 'client_secret_jwt' | 'none' | 'private_key_jwt' | 'self_signed_tls_client_auth' | 'tls_client_auth', received 'client_secret_basic'"
      ]
    }
  }
}
```


## Retrieving the Client ID Metadata Document

Using the `client_id` URI from the above example, we can make the following request:

```http
GET /clients/bafyreiexz5n7t3fmtuyl37jqvto3tnu5wmy4vocdmqx34xmoeltmfr5wy4 HTTP/1.1
Host: cimd-service.example.org
Accept: application/json
```

Response:
```http
HTTP/1.1 200 OK
content-type: application/json
expires: Sun, 26 Oct 2025 05:14:16 GMT
x-request-id: 2edb371b-5bde-44f9-a983-ef750aae8cc2
Date: Sun, 26 Oct 2025 05:12:49 GMT
Connection: keep-alive
Keep-Alive: timeout=5
Transfer-Encoding: chunked

{
  "redirect_uris":["https://example.com/oauth/callback"],
  "response_types":["code"],
  "grant_types":["authorization_code","refresh_token"],
  "scope":"atproto transition:generic",
  "token_endpoint_auth_method":"none",
  "application_type":"web",
  "subject_type":"public",
  "authorization_signed_response_alg":"RS256",
  "client_name":"Example Client",
  "client_uri":"https://example.com/",
  "dpop_bound_access_tokens":true,
  "client_id":"http://cimd-service.example.org/clients/bafyreiexz5n7t3fmtuyl37jqvto3tnu5wmy4vocdmqx34xmoeltmfr5wy4"
}
```

If the client is not found, then the response body will be:
```json
{
  "error": "invalid_client"
}
```

