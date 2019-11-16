const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

// Generate a secret key
const secret = speakeasy.generateSecret();

// Generate a time-based token based on the base-32 key.
const token = speakeasy.totp({
  secret: secret.base32,
  encoding: 'base32'
});

const getTest = async (req, res, next) => {
  const dataUrl = await QRCode.toDataURL(secret.otpauth_url);
  // console.log(dataUrl);
  // Verify a given token
  const tokenValidates = speakeasy.totp.verify({
    secret: secret.base32,
    encoding: 'base32',
    token: token
  });

  res.status(200).render('test', {
    title: 'Test',
    secret,
    token,
    tokenValidates,
    dataUrl
  });
};

module.exports = { getTest };
