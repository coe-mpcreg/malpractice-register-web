const crypto = require('crypto');

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    // Not fatal, but sessions won't survive a server restart safely if this
    // isn't set explicitly, and it's easy to forget on a real deployment.
    console.warn(
      'WARNING: SESSION_SECRET is not set. Using a temporary in-memory secret — ' +
      'everyone will be signed out whenever the server restarts. Set SESSION_SECRET ' +
      'to a long random string in your hosting environment variables.'
    );
    return getSecret._fallback || (getSecret._fallback = crypto.randomBytes(32).toString('hex'));
  }
  return secret;
}

function signToken(payload) {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', getSecret()).update(data).digest('base64url');
  return `${data}.${sig}`;
}

function verifyToken(token) {
  if (!token || typeof token !== 'string' || token.indexOf('.') === -1) return null;
  const [data, sig] = token.split('.');
  if (!data || !sig) return null;
  const expected = crypto.createHmac('sha256', getSecret()).update(data).digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf-8'));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch (e) {
    return null;
  }
}

module.exports = { signToken, verifyToken };
