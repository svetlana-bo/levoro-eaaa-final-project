import { Navigate } from "react-router-dom";
import { useRole, AppRole } from "@/hooks/useRole";

const ROLE_HIERARCHY: Record<AppRole, number> = {
  student: 0,
  instructor: 1,
  admin: 2,
  webadmin: 2,
};

interface RoleBasedRouteProps {
  children: React.ReactNode;
  requiredRole: AppRole;
}

const RoleBasedRoute = ({ children, requiredRole }: RoleBasedRouteProps) => {
  const { role, roleLoading } = useRole();

  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (ROLE_HIERARCHY[role] < ROLE_HIERARCHY[requiredRole]) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default RoleBasedRoute;
