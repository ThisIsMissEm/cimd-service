import { oauthClientMetadataSchema } from "@atproto/oauth-types";
import z from "zod";

export const clientMetadataSchema = z.object({
  ...oauthClientMetadataSchema.shape,
  // CIMD Service specific refinements:
  client_name: z.string().nonempty(),
  token_endpoint_auth_method: z.enum([
    "client_secret_jwt",
    "none",
    "private_key_jwt",
    "self_signed_tls_client_auth",
    "tls_client_auth",
  ]),
});

export type ClientMetadata = z.infer<typeof clientMetadataSchema>;
