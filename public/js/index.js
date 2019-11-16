import '@babel/polyfill';
import { displayMap } from './mapBox';
import { updateSettings } from './updateSettings';
import { bookTour } from './stripe';
import {
  signup,
  login,
  logout,
  loginTotp,
  forgotPassword,
  resetPassword,
  configureTwoFactor
} from './auth';

// DOM ELEMENTS
const formSignup = document.getElementById('form-signup');
const formLogin = document.getElementById('form-login');
const formLoginTotp = document.getElementById('form-login-totp');
const formForgotPassword = document.getElementById('form-forgot-password');
const formResetPassword = document.getElementById('form-reset-password');

const formAccSettings = document.getElementById('form-account-settings');
const formPassword = document.getElementById('form-password');
const formTwoFactor = document.getElementById('form-two-factor');

const formBooking = document.getElementById('form-booking');

const logoutBtn = document.getElementById('logout');
const map = document.getElementById('map');
const showPasswords = document.querySelectorAll('.show-password');

const modalQRCode = document.querySelector('.modal--qrcode');
const btnCloseModalQRCode = document.getElementById('btn-close-modal-qrcode');

const btnTestAjax = document.getElementById('test-ajax');

// TOGGLE PASSWORD VISIBILITY
if (showPasswords.length > 0) {
  showPasswords.forEach((el, index) => {
    el.addEventListener('click', event => {
      const eyeIcon = document.querySelectorAll('.eye-icon')[index];
      const password = document.querySelectorAll('.password')[index];
      if (password.type === 'password') {
        // showPassword.textContent = 'hide password';
        eyeIcon.setAttribute('xlink:href', '/img/icons.svg#icon-eye-off');
        password.type = 'text';
      } else {
        // showPassword.textContent = 'show password';
        eyeIcon.setAttribute('xlink:href', '/img/icons.svg#icon-eye');
        password.type = 'password';
      }
    });
  });
}

// SIGNUP
if (formSignup) {
  formSignup.addEventListener('submit', event => {
    event.preventDefault();
    const btnSignUpForm = document.getElementById('signup-form-btn');
    btnSignUpForm.textContent = 'Submiting...';
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;
    signup(name, email, password, passwordConfirm);
  });
}

// LOGIN
if (formLogin) {
  formLogin.addEventListener('submit', event => {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const remember = document.getElementById('remember').checked;
    login(email, password, remember);
  });
}

// LOGIN WITH TOTP (IF 2FA IS ENABLED)
if (formLoginTotp) {
  formLoginTotp.addEventListener('submit', event => {
    event.preventDefault();
    // const email = document.getElementById('email').value;
    const token = document.getElementById('token').value;
    loginTotp(token);
  });
}

// LOGOUT
if (logoutBtn) {
  logoutBtn.addEventListener('click', event => {
    logout();
  });
}

// FORGOT PASSWORD
if (formForgotPassword) {
  formForgotPassword.addEventListener('submit', event => {
    event.preventDefault();
    const email = document.getElementById('email').value;
    // console.log(`Retreiving password for ${email}`);
    forgotPassword(email);
  });
}

// RESET PASSWORD
if (formResetPassword) {
  formResetPassword.addEventListener('submit', event => {
    event.preventDefault();
    const token = document.getElementById('token').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;
    resetPassword(token, password, passwordConfirm);
  });
}

// MAP
if (map) {
  const locations = JSON.parse(
    document.getElementById('map').dataset.locations
  );
  displayMap(locations);
}

// ACCOUNT SETTINGS
if (formAccSettings) {
  formAccSettings.addEventListener('submit', event => {
    event.preventDefault();
    // Creating multipart/form-data (when uploading file)
    const form = new FormData();
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);
    updateSettings(form, 'data');
  });
}

// UPDATE PASSWORD
if (formPassword) {
  formPassword.addEventListener('submit', async event => {
    event.preventDefault();

    document.querySelector('.btn--save-password').textContent = 'Updating...';
    const passwordCurrent = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;

    await updateSettings(
      { passwordCurrent, password, passwordConfirm },
      'password'
    );

    document.querySelector('.btn--save-password').textContent = 'Save password';
    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
  });
}

// TWO-FACTOR AUTHENTICATION
if (formTwoFactor) {
  formTwoFactor.addEventListener('submit', event => {
    event.preventDefault();

    const twoFactorEnabled = document.getElementById('twofactor').checked;

    configureTwoFactor(twoFactorEnabled);
  });
}

// CLOSE QRCODE MODAL
if (btnCloseModalQRCode) {
  btnCloseModalQRCode.addEventListener('click', event => {
    modalQRCode.classList.remove('modal--open');
    modalQRCode.classList.add('modal--closed');
  });
}

// BOOK TOUR
if (formBooking) {
  formBooking.addEventListener('submit', event => {
    event.preventDefault();
    const bookTourBtn = document.getElementById('book-tour');
    bookTourBtn.textContent = 'Processing...';

    const tourId = document.getElementById('tour').value;
    const startDateId = document.getElementById('start-date').value;

    bookTour(tourId, startDateId);
    bookTourBtn.textContent = 'Book';
  });
}
