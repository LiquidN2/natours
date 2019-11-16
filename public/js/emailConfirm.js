(async () => {
  const emailConfirmToken = document.getElementById('email-confirm-token')
    .value;
  const emailConfirmText = document.querySelector('.email-confirm__text');

  try {
    const res = await axios.patch(
      `/api/v1/users/email-confirm/${emailConfirmToken}`
    );

    if (res.data.status === 'success') {
      emailConfirmText.classList.add('email-confirm__text--success');
      emailConfirmText.textContent =
        'Thank you for confirming your email. You will be directed to the login page shortly.';
      window.setTimeout(() => {
        location.assign('/login');
      }, 1500);
    }
  } catch (error) {
    emailConfirmText.classList.add('email-confirm__text--error');
    emailConfirmText.textContent =
      'Oops. We are unable to activate your account. Please contact our support team.';
  }
})();
