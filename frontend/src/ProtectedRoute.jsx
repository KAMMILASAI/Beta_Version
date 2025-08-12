import { Navigate } from 'react-router-dom';
export default function ProtectedRoute({ children, role }) {
  const token = localStorage.getItem('token');
  const userRole = role;
  if (!token) return <Navigate to="/" />;
  // In real world, validate token and role from backend or JWT decode
  return children;
}
