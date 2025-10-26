import {
  loopbackRedirectURISchema,
  oauthClientMetadataSchema,
  privateUseUriSchema,
} from "@atproto/oauth-types";
import z from "zod";

export const oauthRedirectUriSchema = z.union(
  [loopbackRedirectURISchema, privateUseUriSchema],
  {
    message: `URL must use the "http:" protocol, or a private-use URI scheme (RFC 8252)`,
  }
);

export const clientMetadataSchema = z
  .object({
    ...oauthClientMetadataSchema.shape,
    // CIMD Service specific refinements:
    client_name: z.string().nonempty(),
    token_endpoint_auth_method: z.enum([
      "client_secret_jwt",
      "none",
      "private_key_jwt",
    ]),
    // Force native for bluesky
    application_type: z.string().transform(() => "native"),
    // Prevent usage of https:// URIs
    redirect_uris: z.array(oauthRedirectUriSchema).nonempty(),
  })
  // These are both set by cimd-service automatically. The client_uri is omitted
  // because bluesky forces it to be the same-domain as client_id
  .omit({ client_id: true, client_uri: true });

export type ClientMetadata = z.infer<typeof clientMetadataSchema>;
