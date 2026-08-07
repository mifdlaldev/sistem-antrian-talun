import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Kiosk from "./pages/public/Kiosk";
import Monitor from "./pages/public/Monitor";
import Login from "./pages/public/Login";
import AdminDashboard from "./pages/admin/AdminDashboard"; // Dashboard Admin
import PetugasDashboard from "./pages/admin/PetugasDashboard"; // Dashboard Petugas
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Router>
      <Routes>
        {/* --- HALAMAN PUBLIK (Tanpa Login) --- */}
        <Route path="/" element={<Kiosk />} />
        <Route path="/monitor" element={<Monitor />} />
        <Route path="/login" element={<Login />} />

        {/* --- HALAMAN ADMIN (Khusus Role: admin) --- */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Nanti tambah route: /admin/users, /admin/layanan, dll disini */}

        {/* --- HALAMAN PETUGAS (Khusus Role: petugas) --- */}
        <Route
          path="/petugas/dashboard"
          element={
            <ProtectedRoute allowedRoles={["petugas"]}>
              <PetugasDashboard />
            </ProtectedRoute>
          }
        />

        {/* Redirect Dashboard lama ke Login (Keamanan) */}
        <Route path="/dashboard" element={<Navigate to="/login" />} />

        {/* 404 */}
        <Route
          path="*"
          element={
            <div className="p-10 text-center">
              404 - Halaman Tidak Ditemukan
            </div>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
