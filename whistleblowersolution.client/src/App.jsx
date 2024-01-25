import "./App.css";
import { Routes, Route, useNavigate } from "react-router-dom";
import Information from "./pages/Information";
import Login from "./pages/Login";
import Register from "./pages/RegisterRegulator";
import Reports from "./pages/BrowseReports";
import SendReport from "./pages/SendReport";
import Cookies from 'js-cookie';
import { useEffect } from "react";

// This is a functional component that checks if a JWT token exists in the cookies.
// If the token exists, it renders the children components, otherwise it redirects the user to the login page.
function PrivateRoute({ children }) {
  const navigate = useNavigate(); // Get the navigate function from the hook
  const token = Cookies.get('JWT') // Get the JWT token from the cookies
  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [navigate, token]); // Add navigate and token as dependencies

  if (!token) {
    return null;
  }

  return children; // If token exists, render children (Reports page), else redirect to login
}

// This is the main App component which sets up the routing for the application.
export default function App() {
useEffect(() => {
  Cookies.remove('JWT');
}, []);
  return (
    // The Routes component is a wrapper for all Route components.
    <Routes>
       {/* Each Route component represents a single route in the application.
      The path prop is the URL path, and the element prop is the component to render when the path is matched. */}
      <Route path="/" element={<Information />} /> 
      <Route path="/login" element={<Login />} /> 
      <Route path="/register" element={<Register />} />
      {/* The PrivateRoute component is used to wrap components that require authentication.
      In this case, the Reports component is wrapped by PrivateRoute, so it requires authentication. */}
      <Route path="/reports" element={<PrivateRoute><Reports /></PrivateRoute>} /> 
      <Route path="/sendreport" element={<SendReport />} /> 
    </Routes>
  );
}
