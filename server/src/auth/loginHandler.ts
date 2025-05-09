import { Request, Response } from "express";
import { logRequest } from "../utils/logUtil.js";
import { loginOpenIdConnectSchema } from "../validators/auth.js";
import * as client from "openid-client";

export default async function loginHandler(
  req: Request,
  res: Response,
  redirect_uri: string,
  config: client.Configuration
) {
  logRequest(req);
  const validatedData = await loginOpenIdConnectSchema.validate(req.query, {
    abortEarly: false,
    stripUnknown: true,
  });
  const code_verifier = client.randomPKCECodeVerifier();
  const state = client.randomState();

  // Store values in the session
  req.session.redirect_to_frontend = validatedData.redirect_to_frontend;
  req.session.redirect_to_frontend_verified_signup =
    validatedData.redirect_to_frontend_verified_signup;
  req.session.code_verifier = code_verifier;
  req.session.state = state;

  // Create parameters
  const code_challenge = await client.calculatePKCECodeChallenge(code_verifier);
  const parameters: Record<string, string> = {
    redirect_uri: redirect_uri,
    scope: "openid email profile",
    code_challenge: code_challenge,
    code_challenge_method: "S256",
    state: state,
  };

  // Redirect the user to redirectTo.href
  const redirectTo: URL = client.buildAuthorizationUrl(config, parameters);
  res.redirect(redirectTo.href);
}
