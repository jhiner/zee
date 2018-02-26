# Zee - An OpenID Connect Provider POC
This is a POC project demonstrating use of passport and oauth2orize to implement an OpenID Connect Provider. Currently, this project supports:
- Authorization Code flow
- ID Token issuance and userinfo support
- Local (Username and password), Github, and Google account login
- Local user signup
- Identifier-first login
- Account linking between federated user accounts and local accounts (prompts for the local account password before linking)
- Consent page
- OIDC RP-Initiated Logout (per http://openid.net/specs/openid-connect-session-1_0.html#RPLogout) (WIP)
- Refresh tokens (limited to refresh token issuance currently, support for refresh token exchange is WIP)
- Unit tests (WIP)
- Prompt=consent support
- Rate limiting (all requests limited to 10 per minute per IP)
- OpenID Discovery endpoint

I want to eventually add support for other flows and features, but this is all a WIP. Also note that none of this is intended for production use.

# Try it out

This project is deployed at https://zee.hinerman.net. You can use a demo client to test it out - available at https://zeeclient.hinerman.net.

# Tasks

- [ ] clean up token generation :-/
- [ ] unit tests

# Issues

- Email first login page allows you to submit an empty email