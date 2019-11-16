import axios from 'axios';
import { showAlert } from './alert';
import { showQRCode } from './qrCode';

export const signup = async (name, email, password, passwordConfirm) => {
  try {
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/signup',
      data: {
        name,
        email,
        password,
        passwordConfirm
      }
    });

    if (res.data.status === 'success') {
      showAlert('success', 'New account created successfully');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (error) {
    showAlert('error', error.response.data.message);
  }
};

export const login = async (email, password, remember) => {
  try {
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/login',
      data: {
        email,
        password,
        remember
      }
    });

    if (res.data.status === 'success' && res.data.redirect) {
      return location.assign(res.data.redirect);
    }

    if (res.data.status === 'success') {
      showAlert('success', 'Logged in successfully');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (error) {
    showAlert('error', error.response.data.message);
  }
};

export const loginTotp = async token => {
  try {
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/login-totp',
      data: { token }
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Logged in successfully');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (error) {
    showAlert('error', error.response.data.message);
  }
};

export const logout = async () => {
  try {
    const res = await axios.get('/api/v1/users/logout');
    if (res.data.status === 'success') location.reload(true);
  } catch (error) {
    showAlert('error', 'Error logging out');
  }
};

export const forgotPassword = async email => {
  try {
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/forgot-password',
      data: { email }
    });

    if (res.data.status === 'success') {
      showAlert('success', `Password reset instruction sent to ${email}`);
      window.setTimeout(() => {
        location.assign('/login');
      }, 2000);
    }
  } catch (error) {
    showAlert('error', error.response.data.message);
  }
};

export const resetPassword = async (token, password, passwordConfirm) => {
  try {
    const res = await axios({
      method: 'PATCH',
      url: `/api/v1/users/reset-password/${token}`,
      data: {
        password,
        passwordConfirm
      }
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Password reset successful');
      window.setTimeout(() => {
        location.assign('/login');
      }, 1500);
    }
  } catch (error) {
    showAlert('error', error.response.data.message);
    window.setTimeout(() => {
      location.assign('/forgot-password');
    }, 2000);
  }
};

export const configureTwoFactor = async enabled => {
  try {
    const res = await axios({
      method: 'PATCH',
      url: `/api/v1/users/me/two-factor`,
      data: { twoFactorEnabled: enabled }
    });

    if (res.data.status === 'success' && res.data.qrCodeUrl) {
      showQRCode(res.data.qrCodeUrl);
    } else if (res.data.status === 'success' && !res.data.qrCodeUrl) {
      showAlert('success', 'Two-factor authentication is disabled');
    }
  } catch (error) {
    showAlert('error', error.response.data.message);
  }

  // if (enabled) {
  //   // update user DB and get the QRCode URL
  //   const QRCodeUrl = '/img/sample-qrcode.png';
  //   showQRCode(QRCodeUrl);
  // } else {
  //   // update user DB
  // }
};
