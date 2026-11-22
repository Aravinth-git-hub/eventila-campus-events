import React from 'react';
import { Navigate } from 'react-router-dom';

const SignInPage: React.FC = () => {
  // This page is likely a legacy route, redirecting to the canonical login page.
  return <Navigate to="/login" replace />;
};

export default SignInPage;
