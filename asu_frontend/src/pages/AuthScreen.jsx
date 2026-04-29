// src/pages/AuthScreen.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { customerApi } from '../services/api'; // Hooked up to your Docker API!
import { theme } from '../theme';

export default function AuthScreen() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // State to hold all the fields that match your MySQL Database
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    accountType: 'household' // Default matches your SQLAlchemy comment
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setErrorMsg(""); // Clear old errors

    try {
      if (isLogin) {
        // --- LOGIN FLOW ---
        // Change '/login' to whatever your FastAPI route is named
        const response = await customerApi.post('/login', {
          email: formData.email,
          password: formData.password
        });
        
        console.log("Login Success:", response.data);
        localStorage.setItem('AQUASENSE_SESSION_ID', response.data.customer_id);
        navigate('/dashboard'); 

      } else {
        // --- REGISTRATION FLOW ---
        // Sending ALL the data your SQLAlchemy model requires
        const response = await customerApi.post('/customers', {
          full_name: formData.fullName,
          email: formData.email,
          password: formData.password, // Remember to add this to your Python model!
          phone: formData.phone,
          address: formData.address,
          account_type: formData.accountType
        });

        console.log("Registration Success:", response.data);
        // Switch them back to the login screen after they register
        setIsLogin(true); 
        setFormData({ ...formData, password: '' }); // clear password for security
      }
    } catch (error) {
      // If Python rejects the data, show the error on the dark UI
      console.error("Auth Error:", error);
      setErrorMsg(error.response?.data?.detail || "Authentication sequence failed.");
    }
  };

  const inputStyle = {
    backgroundColor: theme.bg, color: theme.text, border: `1px solid ${theme.border}`,
    padding: '12px 15px', outline: 'none', fontFamily: theme.fontMono, fontSize: '0.85rem', letterSpacing: '1px',
    width: '100%', boxSizing: 'border-box'
  };

  return (
    <div style={{ height: '100vh', backgroundColor: theme.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.text, fontFamily: theme.fontMain }}>
      <div style={{ width: '450px', padding: '40px', backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}>
        <div style={{ marginBottom: '30px' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '300', letterSpacing: '4px', margin: '0 0 10px 0' }}>AQUASENSE</h1>
          <p style={{ color: theme.textMuted, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
            {isLogin ? 'Secure Gateway / Portal Access' : 'Register New Meter Entity'}
          </p>
        </div>

        {errorMsg && (
          <div style={{ padding: '10px', marginBottom: '20px', border: `1px solid ${theme.alert}`, color: theme.alert, fontSize: '0.8rem', fontFamily: theme.fontMono }}>
            [ERROR]: {errorMsg}
          </div>
        )}

        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          {/* REGISTRATION ONLY FIELDS */}
          {!isLogin && (
            <>
              <input type="text" name="fullName" placeholder="FULL NAME" required onChange={handleInputChange} style={inputStyle} />
              <input type="tel" name="phone" placeholder="PHONE NUMBER" required onChange={handleInputChange} style={inputStyle} />
              <input type="text" name="address" placeholder="PHYSICAL ADDRESS" required onChange={handleInputChange} style={inputStyle} />
              <select name="accountType" onChange={handleInputChange} value={formData.accountType} style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}>
                <option value="household">HOUSEHOLD NODE</option>
                <option value="factory">FACTORY NODE</option>
                <option value="municipal">MUNICIPAL NODE</option>
              </select>
            </>
          )}

          {/* ALWAYS SHOWN FIELDS */}
          <input type="email" name="email" placeholder="EMAIL IDENTIFIER" required onChange={handleInputChange} value={formData.email} style={inputStyle} />
          <input type="password" name="password" placeholder="ACCESS CREDENTIAL" required onChange={handleInputChange} value={formData.password} style={inputStyle} />
          
          <button type="submit" style={{ backgroundColor: theme.text, color: theme.bg, border: 'none', padding: '15px', cursor: 'pointer', fontFamily: theme.fontMain, fontWeight: 'bold', letterSpacing: '2px', marginTop: '15px' }}>
            {isLogin ? 'AUTHENTICATE' : 'INITIALIZE ACCOUNT'}
          </button>
        </form>

        <div style={{ marginTop: '30px', textAlign: 'center', fontSize: '0.85rem', color: theme.textMuted }}>
          <span style={{ cursor: 'pointer', borderBottom: `1px solid ${theme.textMuted}` }} onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? 'Switch to Registration Sequence' : 'Return to Authentication'}
          </span>
        </div>
      </div>
    </div>
  );
}