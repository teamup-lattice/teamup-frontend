import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getToken } from "../services/api";

function ProtectedRoute() {
  const location = useLocation();

  if (!getToken()) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: `${location.pathname}${location.search}${location.hash}`,
        }}
      />
    );
  }

  return <Outlet />;
}

export default ProtectedRoute;
