import axios from 'axios';
import { showAlert } from './alerts.mjs';

export const login = async (email, password) => {
  try {
    const res = await axios({
      method: 'POST',
      url: 'http://localhost:9000/api/v1/users/login',
      data: {
        email,
        password,
      },
    });

    if (res.data.status === 'success') {
      //alert('Logged In Successfully!');
      showAlert('success', 'Logged In Successfully!');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
    //console.log(res);
  } catch (err) {
    //alert(err.response.data.message);
    showAlert('error', err.response.data.message);
  }
};

export const logout = async () => {
  try {
    const res = await axios({
      method: 'GET',
      url: 'http://localhost:9000/api/v1/users/logout',
    });
    if (res.data.status === 'success') location.reload(true); //reloads the page completely
  } catch (err) {
    showAlert('error', 'Error Logging Out! Try again.');
  }
};

/*
document.querySelector('.form').addEventListener('submit', (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  login(email, password);
});
*/
