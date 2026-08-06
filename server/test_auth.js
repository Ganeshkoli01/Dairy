
async function testRegistration() {
  const adminSecret = 'secret_for_admin_signup_change_in_production'; // from .env.example
  try {
    const res = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: 'admin',
        name: 'Super Admin',
        email: 'superadmin@dairy.com',
        password: 'adminpassword123',
        adminSignupSecret: adminSecret
      })
    });
    
    const data = await res.json();
    console.log('Admin Register:', data);
    
    if (data.success) {
      // test login
      const loginRes = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'superadmin@dairy.com',
          password: 'adminpassword123',
        })
      });
      console.log('Admin Login:', await loginRes.json());
    }
  } catch (err) {
    console.error(err);
  }
}

testRegistration();
