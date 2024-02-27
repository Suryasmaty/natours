import axios from 'axios'; //express js syntax not common js syntax
import { showAlert } from './alerts.mjs';

export const updateSettings = async (data, type) => {
  //console.log(data);
  try {
    const url =
      type === 'password'
        ? 'http://localhost:9000/api/v1/users/updatePassword'
        : 'http://localhost:9000/api/v1/users/updateUser';

    const res = await axios({
      method: 'PATCH',
      url,
      data,
    });

    if (res.data.status === 'success') {
      showAlert('success', `${type.toUpperCase()} updated successfully`);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
