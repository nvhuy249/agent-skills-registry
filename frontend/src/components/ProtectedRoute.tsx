import type { JSX } from "react";
import { Navigate } from "react-router-dom";

type Props = {
  children: JSX.Element;
};

export default function ProtectedRoute({ children }: Props) {
  const userId = localStorage.getItem("userId");
  if (!userId) {
    return <Navigate to="/login" replace />;
  }
  return children;
}