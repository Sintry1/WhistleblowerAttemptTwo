import "./App.css";
import { Routes, Route, Navigate } from "react-router-dom";
import Information from "./pages/Information";
import Login from "./pages/Login";
import Register from "./pages/RegisterRegulator";
import Reports from "./pages/BrowseReports";
import SendReport from "./pages/SendReport";
import Cookies from 'js-cookie';

function PrivateRoute({ children }) {
  const token = Cookies.get('JWT')
  return token ? children : <Navigate to="/login" replace />;
}


export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Information />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/reports" element={<PrivateRoute><Reports /></PrivateRoute>} />
      <Route path="/sendreport" element={<SendReport />} />
    </Routes>
  );
}
