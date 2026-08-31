import axios from 'axios';
async function test() {
  try {
    const res1 = await axios.post('http://localhost:5001/api/auth/login', { email: 'admin@pizzahub.com', password: 'adminpassword' });
    const token = res1.data.token;
    console.log('Login successful');

    const res2 = await axios.get('http://localhost:5001/api/admin/outlets', { headers: { Authorization: `Bearer ${token}` } });
    console.log('Outlets:', res2.data.data.length);

    const res3 = await axios.get('http://localhost:5001/api/admin/delivery-partners/partners', { headers: { Authorization: `Bearer ${token}` } });
    console.log('Partners:', res3.data.data.length);
  } catch (err) {
    console.error('Error:', err.response ? err.response.data : err.message);
  }
}
test();
