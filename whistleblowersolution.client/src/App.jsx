import "./App.css";
import { Routes, Route, Navigate } from "react-router-dom";
import Information from "./pages/Information";
import Login from "./pages/Login";
import Register from "./pages/RegisterRegulator";
import Reports from "./pages/BrowseReports";
import SendReport from "./pages/SendReport";

function PrivateRoute({ children }) {
  const isAuth = sessionStorage.getItem("User") && sessionStorage.getItem("Industry"); // check if User and Industry exist in sessionStorage
  return isAuth ? children : <Navigate to="/login" replace />;
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
