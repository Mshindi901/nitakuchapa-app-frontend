import { Navigate, Route, Routes } from "react-router-dom";
import Landing from "./pages/Landing";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import ParticipantDashboard from "./pages/ParticipantDashboard";
import InvitePage from "./pages/InvitePage";
import AdminDashboard from "./pages/AdminDashboard";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/coming-soon" element={<Navigate to="/#how-it-works" replace />} />
      <Route path="/signin" element={<AuthPage mode="signin" />} />
      <Route path="/signup" element={<AuthPage mode="signup" />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/participant" element={<ParticipantDashboard />} />
      <Route path="/invite/:shareId" element={<InvitePage />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="*" element={<Landing />} />
    </Routes>
  );
}

export default App;
