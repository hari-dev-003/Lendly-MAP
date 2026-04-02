import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const raw = localStorage.getItem("user");
  if (!raw) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

export default ProtectedRoute;
