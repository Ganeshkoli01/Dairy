import axios from 'axios';

const testLogin = async () => {
  try {
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'ganeshkoli0149@gmail.com',
      password: 'ganeshkoli@0149'
    });
    console.log("SUCCESS:", response.data);
  } catch (error) {
    if (error.response) {
      console.log("ERROR RESPONSE:", error.response.status, error.response.data);
    } else {
      console.log("NETWORK ERROR:", error.message);
    }
  }
};

testLogin();
