import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import Swal from "sweetalert2";
import {
  LayoutDashboard,
  Users,
  Layers,
  LogOut,
  Plus,
  Trash2,
  UserPlus,
  CheckCircle,
  FilePenLine,
  Menu,
  TrendingUp,
  Clock,
  Building2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from "recharts";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("home");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // State Data
  const [stats, setStats] = useState({ total: 0, waiting: 0, completed: 0 });
  const [dataLayanan, setDataLayanan] = useState([]);
  const [dataUsers, setDataUsers] = useState([]);

  // Chart Data States
  const [weeklyData, setWeeklyData] = useState([]);
  const [layananStats, setLayananStats] = useState([]);

  // Chart Colors
  const COLORS = [
    "#10b981",
    "#f97316",
    "#3b82f6",
    "#8b5cf6",
    "#ec4899",
    "#06b6d4",
  ];

  // --- 1. FETCH DATA ---
  useEffect(() => {
    if (activeTab === "home") {
      fetchStats();
      fetchWeeklyData();
      fetchLayananStats();
    }
    if (activeTab === "layanan") fetchLayanan();
    if (activeTab === "users") {
      fetchUsers();
      fetchLayanan(); // Butuh data layanan untuk dropdown edit/tambah user
    }
  }, [activeTab]);

  // --- API: STATISTIK ---
  const fetchStats = async () => {
    const today = new Date().toISOString().split("T")[0];
    const { count: total } = await supabase
      .from("antrian")
      .select("*", { count: "exact", head: true })
      .eq("tanggal", today);
    const { count: waiting } = await supabase
      .from("antrian")
      .select("*", { count: "exact", head: true })
      .eq("tanggal", today)
      .eq("status", "menunggu");
    const { count: completed } = await supabase
      .from("antrian")
      .select("*", { count: "exact", head: true })
      .eq("tanggal", today)
      .eq("status", "selesai");
    setStats({
      total: total || 0,
      waiting: waiting || 0,
      completed: completed || 0,
    });
  };

  // --- API: WEEKLY TREND DATA (Last 7 Days) ---
  const fetchWeeklyData = async () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const dayName = date.toLocaleDateString("id-ID", { weekday: "short" });

      const { count: total } = await supabase
        .from("antrian")
        .select("*", { count: "exact", head: true })
        .eq("tanggal", dateStr);

      const { count: completed } = await supabase
        .from("antrian")
        .select("*", { count: "exact", head: true })
        .eq("tanggal", dateStr)
        .eq("status", "selesai");

      days.push({
        name: dayName,
        date: dateStr,
        total: total || 0,
        selesai: completed || 0,
      });
    }
    setWeeklyData(days);
  };

  // --- API: ANTRIAN PER LAYANAN (Today) ---
  const fetchLayananStats = async () => {
    const today = new Date().toISOString().split("T")[0];

    // First get all layanan
    const { data: layananList } = await supabase
      .from("layanan")
      .select("id_layanan, nama_layanan, kode_huruf")
      .order("id_layanan");

    if (!layananList) return;

    const statsPerLayanan = await Promise.all(
      layananList.map(async (layanan) => {
        const { count } = await supabase
          .from("antrian")
          .select("*", { count: "exact", head: true })
          .eq("tanggal", today)
          .eq("id_layanan", layanan.id_layanan);

        return {
          name: layanan.kode_huruf,
          fullName: layanan.nama_layanan,
          value: count || 0,
        };
      }),
    );

    setLayananStats(statsPerLayanan);
  };

  // =========================================
  // LOGIKA KELOLA LAYANAN (CRUD)
  // =========================================
  const fetchLayanan = async () => {
    const { data } = await supabase
      .from("layanan")
      .select("*")
      .order("id_layanan");
    setDataLayanan(data || []);
  };

  const handleAddLayanan = async () => {
    const { value: formValues } = await Swal.fire({
      title: "Tambah Layanan Baru",
      html:
        '<input id="swal-nama" class="swal2-input" placeholder="Nama Layanan (Contoh: BPJS)">' +
        '<input id="swal-kode" class="swal2-input" placeholder="Kode Huruf (Contoh: C)">' +
        '<input id="swal-desk" class="swal2-input" placeholder="Deskripsi Singkat">',
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Simpan",
      confirmButtonColor: "#059669",
      preConfirm: () => {
        return [
          document.getElementById("swal-nama").value,
          document.getElementById("swal-kode").value,
          document.getElementById("swal-desk").value,
        ];
      },
    });

    if (formValues) {
      const [nama, kode, desk] = formValues;
      if (!nama || !kode)
        return Swal.fire("Gagal", "Nama dan Kode wajib diisi", "error");

      const { error } = await supabase
        .from("layanan")
        .insert([{ nama_layanan: nama, kode_huruf: kode, deskripsi: desk }]);
      if (!error) {
        Swal.fire("Berhasil", "Layanan ditambahkan", "success");
        fetchLayanan();
      }
    }
  };

  // --- FITUR BARU: EDIT LAYANAN ---
  const handleEditLayanan = async (item) => {
    const { value: formValues } = await Swal.fire({
      title: "Edit Layanan",
      html:
        `<div class="text-left mb-1"><label class="text-xs font-bold text-slate-500">Nama Layanan</label></div>` +
        `<input id="swal-nama" class="swal2-input m-0 mb-3" value="${item.nama_layanan}">` +
        `<div class="text-left mb-1"><label class="text-xs font-bold text-slate-500">Kode Huruf</label></div>` +
        `<input id="swal-kode" class="swal2-input m-0 mb-3" value="${item.kode_huruf}">` +
        `<div class="text-left mb-1"><label class="text-xs font-bold text-slate-500">Deskripsi</label></div>` +
        `<input id="swal-desk" class="swal2-input m-0" value="${item.deskripsi || ""}">`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Update",
      confirmButtonColor: "#3b82f6",
      preConfirm: () => {
        return [
          document.getElementById("swal-nama").value,
          document.getElementById("swal-kode").value,
          document.getElementById("swal-desk").value,
        ];
      },
    });

    if (formValues) {
      const [nama, kode, desk] = formValues;
      const { error } = await supabase
        .from("layanan")
        .update({ nama_layanan: nama, kode_huruf: kode, deskripsi: desk })
        .eq("id_layanan", item.id_layanan);

      if (!error) {
        Swal.fire("Berhasil", "Data berhasil diperbarui", "success");
        fetchLayanan();
      } else {
        Swal.fire("Gagal", error.message, "error");
      }
    }
  };

  const handleDeleteLayanan = async (id) => {
    const result = await Swal.fire({
      title: "Hapus Layanan?",
      text: "Data antrian terkait mungkin akan error jika dihapus!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Ya, Hapus",
    });
    if (result.isConfirmed) {
      const { error } = await supabase
        .from("layanan")
        .delete()
        .eq("id_layanan", id);
      if (error) {
        Swal.fire(
          "Gagal",
          "Tidak bisa menghapus layanan yang sudah memiliki history antrian.",
          "error",
        );
      } else {
        Swal.fire("Terhapus!", "Layanan telah dihapus.", "success");
        fetchLayanan();
      }
    }
  };

  // =========================================
  // LOGIKA KELOLA PETUGAS (CRUD)
  // =========================================
  const fetchUsers = async () => {
    const { data } = await supabase
      .from("users")
      .select("*, layanan(nama_layanan)")
      .order("id_user");
    setDataUsers(data || []);
  };

  const handleAddUser = async () => {
    let optionsHtml = '<option value="">-- Semua Layanan (General) --</option>';
    dataLayanan.forEach((layanan) => {
      optionsHtml += `<option value="${layanan.id_layanan}">${layanan.nama_layanan}</option>`;
    });

    const { value: formValues } = await Swal.fire({
      title: "Tambah Petugas Baru",
      html:
        '<input id="swal-user" class="swal2-input" placeholder="Username">' +
        '<input id="swal-pass" class="swal2-input" type="password" placeholder="Password">' +
        '<input id="swal-nama" class="swal2-input" placeholder="Nama Lengkap">' +
        '<div class="text-left px-4 mt-4"><label class="text-sm font-bold text-slate-600">Tugas Layanan:</label></div>' +
        `<select id="swal-layanan" class="swal2-select w-full m-0 mt-1">${optionsHtml}</select>`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Simpan",
      confirmButtonColor: "#059669",
      preConfirm: () => {
        return [
          document.getElementById("swal-user").value,
          document.getElementById("swal-pass").value,
          document.getElementById("swal-nama").value,
          document.getElementById("swal-layanan").value,
        ];
      },
    });

    if (formValues) {
      const [user, pass, nama, idLayanan] = formValues;
      if (!user || !pass)
        return Swal.fire("Gagal", "Username & Password wajib diisi", "error");

      const payloadLayanan = idLayanan ? parseInt(idLayanan) : null;
      const { error } = await supabase.from("users").insert([
        {
          username: user,
          password: pass,
          nama_lengkap: nama,
          role: "petugas",
          id_layanan: payloadLayanan,
        },
      ]);

      if (!error) {
        Swal.fire("Berhasil", "Petugas ditambahkan", "success");
        fetchUsers();
      } else {
        Swal.fire("Gagal", error.message, "error");
      }
    }
  };

  // --- FITUR BARU: EDIT USER ---
  const handleEditUser = async (user) => {
    // Generate Dropdown dengan pilihan yang sedang aktif terpilih (selected)
    let optionsHtml = `<option value="" ${user.id_layanan === null ? "selected" : ""}>-- Semua Layanan (General) --</option>`;
    dataLayanan.forEach((layanan) => {
      const isSelected =
        user.id_layanan === layanan.id_layanan ? "selected" : "";
      optionsHtml += `<option value="${layanan.id_layanan}" ${isSelected}>${layanan.nama_layanan}</option>`;
    });

    const { value: formValues } = await Swal.fire({
      title: "Edit Data Petugas",
      html:
        `<div class="text-left mb-1"><label class="text-xs font-bold text-slate-500">Username</label></div>` +
        `<input id="swal-user" class="swal2-input m-0 mb-3" value="${user.username}">` +
        `<div class="text-left mb-1"><label class="text-xs font-bold text-slate-500">Nama Lengkap</label></div>` +
        `<input id="swal-nama" class="swal2-input m-0 mb-3" value="${user.nama_lengkap}">` +
        `<div class="text-left mb-1"><label class="text-xs font-bold text-slate-500">Password Baru (Kosongkan jika tetap)</label></div>` +
        `<input id="swal-pass" class="swal2-input m-0 mb-3" type="password" placeholder="***">` +
        `<div class="text-left mb-1"><label class="text-xs font-bold text-slate-500">Penugasan Layanan</label></div>` +
        `<select id="swal-layanan" class="swal2-select w-full m-0">${optionsHtml}</select>`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Update",
      confirmButtonColor: "#3b82f6",
      preConfirm: () => {
        return [
          document.getElementById("swal-user").value,
          document.getElementById("swal-nama").value,
          document.getElementById("swal-pass").value, // Password baru (opsional)
          document.getElementById("swal-layanan").value,
        ];
      },
    });

    if (formValues) {
      const [username, nama, passwordBaru, idLayanan] = formValues;
      const payloadLayanan = idLayanan ? parseInt(idLayanan) : null;

      // Siapkan data update
      const updateData = {
        username: username,
        nama_lengkap: nama,
        id_layanan: payloadLayanan,
      };

      // Hanya update password jika admin mengisinya
      if (passwordBaru) {
        updateData.password = passwordBaru;
      }

      const { error } = await supabase
        .from("users")
        .update(updateData)
        .eq("id_user", user.id_user);

      if (!error) {
        Swal.fire("Berhasil", "Data petugas diperbarui", "success");
        fetchUsers();
      } else {
        Swal.fire("Gagal", error.message, "error");
      }
    }
  };

  const handleDeleteUser = async (id) => {
    const result = await Swal.fire({
      title: "Hapus User?",
      text: "User tidak bisa login lagi!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Ya, Hapus",
    });
    if (result.isConfirmed) {
      const { error } = await supabase.from("users").delete().eq("id_user", id);
      if (!error) {
        Swal.fire("Terhapus", "User berhasil dihapus", "success");
        fetchUsers();
      } else {
        Swal.fire("Gagal", error.message, "error");
      }
    }
  };

  const handleLogout = () => {
    Swal.fire({
      title: "Keluar?",
      text: "Kembali ke halaman login",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, Keluar",
    }).then((res) => {
      if (res.isConfirmed) {
        localStorage.removeItem("user_session");
        navigate("/login");
      }
    });
  };

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-800">
      {/* SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 w-64 bg-slate-900 text-white flex flex-col shadow-2xl z-20 transform ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0`}
      >
        <div className="p-6 flex items-center gap-3 border-b border-slate-700 bg-slate-950">
          <img
            src="/logoinsunmedal.png"
            alt="Logo"
            className="w-10 h-10 object-contain"
          />
          <div>
            <h1 className="font-bold text-lg">Admin Panel</h1>
            <p className="text-xs text-slate-400">Desa Talun</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => {
              setActiveTab("home");
              setIsSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === "home"
                ? "bg-emerald-600 text-white"
                : "hover:bg-slate-800 text-slate-400"
            }`}
          >
            <LayoutDashboard size={20} /> Dashboard
          </button>
          <button
            onClick={() => {
              setActiveTab("layanan");
              setIsSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === "layanan"
                ? "bg-emerald-600 text-white"
                : "hover:bg-slate-800 text-slate-400"
            }`}
          >
            <Layers size={20} /> Kelola Layanan
          </button>
          <button
            onClick={() => {
              setActiveTab("users");
              setIsSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === "users"
                ? "bg-emerald-600 text-white"
                : "hover:bg-slate-800 text-slate-400"
            }`}
          >
            <Users size={20} /> Kelola Petugas
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-950">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
          >
            <LogOut size={20} /> Keluar Sistem
          </button>
        </div>
      </aside>

      {/* Backdrop */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/50 z-10 lg:hidden"
        ></div>
      )}

      <div className="flex-1 flex flex-col">
        {/* MOBILE HEADER */}
        <header className="lg:hidden bg-white shadow-sm p-4 flex justify-between items-center sticky top-0 z-10">
          <button onClick={() => setIsSidebarOpen(true)}>
            <Menu size={24} />
          </button>
          <h1 className="font-bold text-lg">
            {activeTab === "home" && "Dashboard"}
            {activeTab === "layanan" && "Kelola Layanan"}
            {activeTab === "users" && "Kelola Petugas"}
          </h1>
          <div className="w-6"></div>
        </header>

        {/* KONTEN UTAMA */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {/* TAB HOME */}
          {activeTab === "home" && (
            <div className="space-y-6 animate-in fade-in duration-500">
              {/* Header */}
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">
                  Dashboard Admin
                </h2>
                <p className="text-slate-500 mt-1">
                  Pantauan statistik antrian hari ini dan tren mingguan.
                </p>
              </div>

              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
                  <div className="bg-slate-100 p-3 rounded-xl">
                    <Users className="text-slate-600" size={24} />
                  </div>
                  <div>
                    <p className="text-slate-500 text-sm font-medium">
                      Total Pengunjung
                    </p>
                    <h3 className="text-3xl sm:text-4xl font-bold text-slate-800">
                      {stats.total}
                    </h3>
                  </div>
                </div>
                <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
                  <div className="bg-orange-100 p-3 rounded-xl">
                    <Clock className="text-orange-600" size={24} />
                  </div>
                  <div>
                    <p className="text-slate-500 text-sm font-medium">
                      Sedang Menunggu
                    </p>
                    <h3 className="text-3xl sm:text-4xl font-bold text-orange-500">
                      {stats.waiting}
                    </h3>
                  </div>
                </div>
                <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
                  <div className="bg-emerald-100 p-3 rounded-xl">
                    <CheckCircle className="text-emerald-600" size={24} />
                  </div>
                  <div>
                    <p className="text-slate-500 text-sm font-medium">
                      Selesai Dilayani
                    </p>
                    <h3 className="text-3xl sm:text-4xl font-bold text-emerald-600">
                      {stats.completed}
                    </h3>
                  </div>
                </div>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pie Chart - Status Hari Ini */}
                <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
                  <div className="flex items-center gap-2 mb-4">
                    <Building2 className="text-slate-600" size={20} />
                    <h3 className="font-bold text-slate-800">
                      Status Antrian Hari Ini
                    </h3>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: "Menunggu", value: stats.waiting },
                            { name: "Selesai", value: stats.completed },
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) =>
                            percent > 0
                              ? `${name} ${(percent * 100).toFixed(0)}%`
                              : ""
                          }
                          labelLine={false}
                        >
                          <Cell fill="#f97316" />
                          <Cell fill="#10b981" />
                        </Pie>
                        <Tooltip
                          formatter={(value) => [`${value} antrian`, ""]}
                          contentStyle={{
                            borderRadius: "8px",
                            border: "1px solid #e2e8f0",
                          }}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Bar Chart - Per Layanan */}
                <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
                  <div className="flex items-center gap-2 mb-4">
                    <Layers className="text-slate-600" size={20} />
                    <h3 className="font-bold text-slate-800">
                      Antrian per Layanan (Hari Ini)
                    </h3>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={layananStats}
                        margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 12 }}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 12 }}
                          tickLine={false}
                          allowDecimals={false}
                        />
                        <Tooltip
                          formatter={(value, name, props) => [
                            `${value} antrian`,
                            props.payload.fullName,
                          ]}
                          contentStyle={{
                            borderRadius: "8px",
                            border: "1px solid #e2e8f0",
                          }}
                        />
                        <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                          {layananStats.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Line Chart - Trend Mingguan (Full Width) */}
              <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="text-slate-600" size={20} />
                  <h3 className="font-bold text-slate-800">
                    Tren Antrian 7 Hari Terakhir
                  </h3>
                </div>
                <div className="h-72 sm:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={weeklyData}
                      margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "8px",
                          border: "1px solid #e2e8f0",
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="total"
                        name="Total Antrian"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ fill: "#3b82f6", strokeWidth: 2 }}
                        activeDot={{ r: 6 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="selesai"
                        name="Selesai Dilayani"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={{ fill: "#10b981", strokeWidth: 2 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* TAB LAYANAN */}
          {activeTab === "layanan" && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-bold text-slate-800">
                  Daftar Layanan
                </h2>
                <button
                  onClick={handleAddLayanan}
                  className="btn-primary flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl shadow-lg hover:bg-emerald-700 transition-all text-sm sm:text-base"
                >
                  <Plus size={18} /> Tambah Layanan
                </button>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-x-auto sm:overflow-visible">
                <table className="w-full text-left mobile-card-table">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm uppercase">
                    <tr>
                      <th className="p-4">Kode</th>
                      <th className="p-4">Nama Layanan</th>
                      <th className="p-4">Deskripsi</th>
                      <th className="p-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 sm:divide-y">
                    {dataLayanan.map((item) => (
                      <tr key={item.id_layanan} className="hover:bg-slate-50">
                        <td
                          className="p-4 font-bold text-emerald-600"
                          data-label="Kode"
                        >
                          {item.kode_huruf}
                        </td>
                        <td
                          className="p-4 font-medium"
                          data-label="Nama Layanan"
                        >
                          {item.nama_layanan}
                        </td>
                        <td
                          className="p-4 text-slate-500 text-sm"
                          data-label="Deskripsi"
                        >
                          {item.deskripsi || "-"}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleEditLayanan(item)}
                              className="text-blue-500 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <FilePenLine size={18} />
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteLayanan(item.id_layanan)
                              }
                              className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                              title="Hapus"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB USERS */}
          {activeTab === "users" && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-bold text-slate-800">
                  Manajemen Petugas
                </h2>
                <button
                  onClick={handleAddUser}
                  className="btn-primary flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl shadow-lg hover:bg-emerald-700 transition-all text-sm sm:text-base"
                >
                  <UserPlus size={18} /> Tambah Petugas
                </button>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-x-auto sm:overflow-visible">
                <table className="w-full text-left mobile-card-table">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm uppercase">
                    <tr>
                      <th className="p-4">Username</th>
                      <th className="p-4">Nama</th>
                      <th className="p-4">Role</th>
                      <th className="p-4">Penugasan</th>
                      <th className="p-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 sm:divide-y">
                    {dataUsers.map((user) => (
                      <tr key={user.id_user} className="hover:bg-slate-50">
                        <td className="p-4 font-bold" data-label="Username">
                          {user.username}
                        </td>
                        <td className="p-4" data-label="Nama">
                          {user.nama_lengkap}
                        </td>
                        <td className="p-4" data-label="Role">
                          <span
                            className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                              user.role === "admin"
                                ? "bg-purple-100 text-purple-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="p-4" data-label="Penugasan">
                          {user.role === "admin" ? (
                            <span className="text-slate-400 text-xs italic">
                              Akses Penuh
                            </span>
                          ) : user.id_layanan ? (
                            <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1">
                              <CheckCircle size={12} />{" "}
                              {user.layanan?.nama_layanan}
                            </span>
                          ) : (
                            <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold border border-slate-200">
                              Semua Layanan
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          {user.role !== "admin" && (
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleEditUser(user)}
                                className="text-blue-500 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                                title="Edit User"
                              >
                                <FilePenLine size={18} />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user.id_user)}
                                className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                title="Hapus User"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
