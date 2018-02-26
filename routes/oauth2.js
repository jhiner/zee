const express = require('express');
const router = express.Router();

const oauth2 = require('../lib/oauth2');

router.get('/authorize', oauth2.authorize);
router.post('/token', oauth2.token);
router.get('/userinfo', oauth2.userinfo); // TODO: Allow cors
router.post('/userinfo', oauth2.userinfo); // TODO: Allow cors
router.post('/decision', oauth2.decision);
router.get('/.well-known/openid-configuration', oauth2.config);
router.get('/.well-known/jwks', oauth2.jwks); // TODO: Allow cors
router.get('/oidc/logout', oauth2.oidcLogout);

module.exports = router;