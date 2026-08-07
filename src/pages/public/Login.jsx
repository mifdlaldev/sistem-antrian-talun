import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import Swal from "sweetalert2";
import { Building2, Lock, User } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Cek User di Database (Simple Query)
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("username", formData.username)
        .eq("password", formData.password) // Catatan: Di real project, password harus di-hash (bcrypt)
        .single();

      if (error || !data) {
        throw new Error("Username atau Password salah!");
      }

      // 2. Jika Sukses, Simpan Data User ke LocalStorage (Session Sementara)
      localStorage.setItem("user_session", JSON.stringify(data));

      // 3. Notifikasi & Redirect sesuai Role
      Swal.fire({
        icon: "success",
        title: "Login Berhasil",
        text: `Selamat datang, ${data.nama_lengkap}`,
        timer: 1500,
        showConfirmButton: false,
      }).then(() => {
        if (data.role === "admin") {
          navigate("/admin/dashboard"); // Arahkan ke Dashboard Admin
        } else {
          navigate("/petugas/dashboard"); // Arahkan ke Dashboard Petugas
        }
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Gagal Masuk",
        text: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200">
        {/* Logo & Judul */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-200">
            <Building2 className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Sistem Antrian</h1>
          <p className="text-slate-500 text-sm">
            Silakan login untuk masuk ke sistem
          </p>
        </div>

        {/* Form Login */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="text-slate-400" size={18} />
              </div>
              <input
                type="text"
                required
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                placeholder="Masukkan username"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="text-slate-400" size={18} />
              </div>
              <input
                type="password"
                required
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                placeholder="Masukkan password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-200 hover:bg-emerald-700 hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-70"
          >
            {loading ? "Memproses..." : "Masuk Sistem"}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-slate-400">
          &copy; 2026 Ujikom SMKN 1 Sumedang
        </div>
      </div>
    </div>
  );
}
