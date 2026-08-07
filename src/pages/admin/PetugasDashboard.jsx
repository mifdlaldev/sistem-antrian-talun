import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import Swal from "sweetalert2";
import {
  User,
  CheckCircle,
  Users,
  LogOut,
  ChevronRight,
  Layers,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function PetugasDashboard() {
  const navigate = useNavigate();
  const userSession = JSON.parse(localStorage.getItem("user_session"));

  // STATE
  const [petugas, setPetugas] = useState({
    id: userSession?.id_user,
    nama: userSession?.nama_lengkap,
    // INI KUNCINYA: Ambil id_layanan dari database (bisa angka, bisa null)
    id_layanan_ditugaskan: userSession?.id_layanan,
  });

  const [namaLayananTugas, setNamaLayananTugas] = useState("Memuat...");
  const [antrianSekarang, setAntrianSekarang] = useState(null);
  const [sisaAntrian, setSisaAntrian] = useState(0);
  const [totalSelesai, setTotalSelesai] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userSession) {
      navigate("/login");
      return;
    }

    cekNamaLayanan();
    fetchDataDashboard();

    const channel = supabase
      .channel("dashboard-petugas")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "antrian" },
        () => fetchDataDashboard(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // --- 1. Cek Nama Layanan (Untuk Judul di Navbar) ---
  const cekNamaLayanan = async () => {
    if (petugas.id_layanan_ditugaskan) {
      // Jika dia spesialis, ambil nama layanannya
      const { data } = await supabase
        .from("layanan")
        .select("nama_layanan")
        .eq("id_layanan", petugas.id_layanan_ditugaskan)
        .single();
      setNamaLayananTugas(data?.nama_layanan || "Spesialis");
    } else {
      // Jika NULL, berarti dia dewa (bisa semua)
      setNamaLayananTugas("SEMUA LAYANAN");
    }
  };

  // --- 2. Fetch Data (Logika Fleksibel) ---
  const fetchDataDashboard = async () => {
    const today = new Date().toISOString().split("T")[0];

    // A. Cek Sedang Melayani Siapa? (Filter by User ID, bukan Layanan)
    // "Cari antrian yang statusnya dilayani OLEH SAYA (id_user saya)"
    const { data: sedangDilayani } = await supabase
      .from("antrian")
      .select("*, layanan(nama_layanan)") // Join biar tau ini layanan apa
      .eq("status", "dilayani")
      .eq("id_user", petugas.id) // Filter User ID
      .eq("tanggal", today)
      .single();

    setAntrianSekarang(sedangDilayani || null);

    // B. Hitung Sisa Antrian
    let querySisa = supabase
      .from("antrian")
      .select("*", { count: "exact", head: true })
      .eq("status", "menunggu")
      .eq("tanggal", today);

    // FILTER PENTING:
    // Jika petugas punya tugas khusus, filter sisa antrian HANYA layanan itu.
    // Jika petugas "Semua Layanan" (null), JANGAN difilter (hitung semua).
    if (petugas.id_layanan_ditugaskan) {
      querySisa = querySisa.eq("id_layanan", petugas.id_layanan_ditugaskan);
    }

    const { count: sisa } = await querySisa;
    setSisaAntrian(sisa || 0);

    // C. Hitung Total Selesai (Oleh Saya)
    const { count: selesai } = await supabase
      .from("antrian")
      .select("*", { count: "exact", head: true })
      .eq("status", "selesai")
      .eq("id_user", petugas.id) // Yang diselesaikan oleh SAYA
      .eq("tanggal", today);

    setTotalSelesai(selesai || 0);
  };

  // --- 3. Handle Panggil Antrian ---
  const handleNextAntrian = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const today = new Date().toISOString().split("T")[0];

      // Step A: Selesaikan antrian sekarang (jika ada)
      if (antrianSekarang) {
        await supabase
          .from("antrian")
          .update({ status: "selesai", waktu_selesai: new Date() })
          .eq("id_antrian", antrianSekarang.id_antrian);
      }

      // Step B: Cari Antrian Berikutnya
      let queryNext = supabase
        .from("antrian")
        .select("*")
        .eq("status", "menunggu")
        .eq("tanggal", today)
        .order("id_antrian", { ascending: true }) // FIFO
        .limit(1);

      // LOGIKA FILTER LAGI:
      if (petugas.id_layanan_ditugaskan) {
        // Jika Spesialis -> Cari antrian layanannya saja
        queryNext = queryNext.eq("id_layanan", petugas.id_layanan_ditugaskan);
      }
      // Jika General -> Langsung ambil siapa saja yang datang duluan (Tanpa filter layanan)

      const { data: nextData } = await queryNext;
      const nextQueue = nextData?.[0]; // Ambil hasil pertama

      if (nextQueue) {
        // Update jadi dilayani OLEH SAYA
        await supabase
          .from("antrian")
          .update({ status: "dilayani", id_user: petugas.id })
          .eq("id_antrian", nextQueue.id_antrian);

        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: `Memanggil ${nextQueue.nomor_antrian}`,
          showConfirmButton: false,
          timer: 3000,
        });
      } else {
        Swal.fire("Antrian Kosong", "Tidak ada antrian yang menunggu.", "info");
      }

      fetchDataDashboard();
    } catch (error) {
      Swal.fire("Error", "Gagal memproses data.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user_session");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-100 p-2 rounded-lg text-emerald-700">
            {/* Ganti Icon jika Semua Layanan */}
            {petugas.id_layanan_ditugaskan ? (
              <User size={24} />
            ) : (
              <Layers size={24} />
            )}
          </div>
          <div>
            <h1 className="font-bold text-lg uppercase">{namaLayananTugas}</h1>
            <p className="text-xs text-slate-500">{petugas.nama}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="text-red-500 hover:bg-red-50 p-2 rounded-lg flex items-center gap-2 text-sm font-medium"
        >
          <LogOut size={18} /> Keluar
        </button>
      </nav>

      {/* Konten Dashboard (TETAP SAMA SEPERTI SEBELUMNYA) */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center">
              <div>
                <p className="text-slate-500 text-sm">Sisa Antrian</p>
                <h3 className="text-3xl font-bold">{sisaAntrian}</h3>
              </div>
              <Users className="text-orange-400" size={28} />
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center">
              <div>
                <p className="text-slate-500 text-sm">Total Selesai</p>
                <h3 className="text-3xl font-bold text-emerald-600">
                  {totalSelesai}
                </h3>
              </div>
              <CheckCircle className="text-emerald-500" size={28} />
            </div>
          </div>

          <div className="md:col-span-2 bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden flex flex-col">
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gradient-to-br from-white to-slate-50">
              <p className="text-slate-400 uppercase tracking-widest text-xs font-bold mb-4">
                Nomor Panggilan
              </p>
              {antrianSekarang ? (
                <div className="text-center">
                  <span className="text-8xl font-bold text-slate-900 tracking-tighter">
                    {antrianSekarang.nomor_antrian}
                  </span>
                  {/* Tampilkan Layanan Asal jika dia petugas General */}
                  {!petugas.id_layanan_ditugaskan && (
                    <p className="mt-2 text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                      {antrianSekarang.layanan?.nama_layanan}
                    </p>
                  )}
                </div>
              ) : (
                <span className="text-8xl font-bold text-slate-200">---</span>
              )}
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-200">
              <button
                onClick={handleNextAntrian}
                disabled={loading}
                className="w-full py-4 bg-emerald-600 text-white rounded-xl text-lg font-bold shadow-lg hover:bg-emerald-700 active:scale-95 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {loading
                  ? "Memproses..."
                  : antrianSekarang
                    ? "SELESAI & LANJUT"
                    : "PANGGIL ANTRIAN"}{" "}
                <ChevronRight />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
