import React from 'react';
import { LayoutDashboard } from 'lucide-react';

const Login = ({ loginData, setLoginData, handleLogin }) => {
  return (
    <div className="login-container">
      <div className="login-card">
        <div className="logo-section">
          <div className="logo-icon-lg">
            <LayoutDashboard size={32} color="white" />
          </div>
          <h1>MediCare Admin</h1>
          <p>Secure Hospital Management System</p>
        </div>
        <form onSubmit={handleLogin} className="login-form">
          <div className="input-group">
            <label>Username</label>
            <input
              type="text"
              value={loginData.username}
              onChange={e => setLoginData({ ...loginData, username: e.target.value })}
              placeholder="Enter username"
              autoFocus
            />
          </div>
          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              value={loginData.password}
              onChange={e => setLoginData({ ...loginData, password: e.target.value })}
              placeholder="Enter password"
            />
          </div>
          <button type="submit" className="btn-login">
            Login to Dashboard
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
