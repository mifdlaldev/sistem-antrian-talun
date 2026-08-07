import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, allowedRoles }) {
  // 1. Ambil data session dari LocalStorage
  const sessionStr = localStorage.getItem("user_session");

  if (!sessionStr) {
    // Kalau tidak ada session, tendang ke Login
    return <Navigate to="/login" replace />;
  }

  const user = JSON.parse(sessionStr);

  // 2. Cek apakah Role user sesuai dengan yang diizinkan halaman ini
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Misal: Petugas coba buka halaman Admin -> Balikin ke halaman petugas
    return (
      <Navigate
        to={user.role === "admin" ? "/admin/dashboard" : "/petugas/dashboard"}
        replace
      />
    );
  }

  // Kalau aman, tampilkan halamannya
  return children;
}
