//const axios = require('axios');
//const axios = require('axios/dist/node/axios.cjs');

//import axios from 'axios';
//const axios = require('axios');
const email = 'teja.sadanala@gmail.com';
const password = 1234567;
const login = async (email, password) => {
  try {
    const res = await axios({
      method: 'POST',
      url: 'http://localhost:9000/api/v1/users/login',
      data: {
        email,
        password,
      },
    });
  } catch (err) {
    console.log(err);
  }
};

login(email, password);
