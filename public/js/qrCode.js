const modalQRCode = document.querySelector('.modal--qrcode');
const modalQRCodeContent = document.querySelector('.modal__content--qrcode');

export const showQRCode = url => {
  // remove any existing QRCode image
  const qrcodeImage = document.querySelector('.qrcode__image');
  if (qrcodeImage) qrcodeImage.remove();

  // insert new QRCode image
  modalQRCodeContent.insertAdjacentHTML(
    'afterbegin',
    `<img src="${url}" class="qrcode__image ma-bt-md"/>`
  );

  // disply the modal
  modalQRCode.classList.remove('modal--closed');
  modalQRCode.classList.add('modal--open');
};
