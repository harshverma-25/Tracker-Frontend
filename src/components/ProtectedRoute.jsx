import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();

  // ✅ While checking auth from localStorage, wait
  if (user === null) {
    return (
      <div className="min-h-screen flex items-center justify-center text-lg">
        Checking authentication...
      </div>
    );
  }

  // ❌ Not Logged In
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // ✅ Logged In
  return children;
};

export default ProtectedRoute;
