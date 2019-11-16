import axios from 'axios';
import { showAlert } from './alert';

export const bookTour = async (tourId, dateId) => {
  const stripe = Stripe('pk_test_0FRrL8puKVPeSsWaVWcLYHEa');
  try {
    // 1. Get checkout session from API
    const response = await axios.get(
      `/api/v1/bookings/checkout-session/tour/${tourId}/date/${dateId}`
    );

    // console.log(response);

    // 2. Create checkout form & charge credit card
    await stripe.redirectToCheckout({
      // Make the id field from the Checkout Session creation API response
      // available to this file, so you can provide it as parameter here
      // instead of the {{CHECKOUT_SESSION_ID}} placeholder.
      sessionId: response.data.session.id
    });
  } catch (error) {
    // console.log(error);
    showAlert('error', error);
  }
};
