import { Navigate } from "react-router-dom";
import { useRole } from "@/hooks/useRole";

const Dashboard = () => {
  const { role, roleLoading } = useRole();

  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (role === "admin" || role === "webadmin") return <Navigate to="/admin" replace />;
  if (role === "instructor") return <Navigate to="/instructor" replace />;
  return <Navigate to="/student" replace />;
};

export default Dashboard;
