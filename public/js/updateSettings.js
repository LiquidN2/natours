import axios from 'axios';
import { showAlert } from './alert';

export const updateSettings = async (data, type) => {
  let url;

  if (type === 'data') {
    url = '/api/v1/users/me';
  } else if (type === 'password') {
    url = '/api/v1/users/update-password';
  }

  try {
    const res = await axios({
      method: 'PATCH',
      url,
      data
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Update successful');
      location.reload(true);
    }
  } catch (error) {
    showAlert('error', error.response.data.message);
  }
};
