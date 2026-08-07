import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import Swal from "sweetalert2";
import { Printer, MapPin, Building2, Info, Tv } from "lucide-react"; // Tambah icon Tv
import { Link } from "react-router-dom"; // Tambah Link untuk navigasi

export default function Kiosk() {
  const [loading, setLoading] = useState(false);
  const [daftarLayanan, setDaftarLayanan] = useState([]);
  const [antrianTerakhir, setAntrianTerakhir] = useState("-");

  // --- 1. Ambil Data Layanan ---
  useEffect(() => {
    const fetchLayanan = async () => {
      try {
        const { data, error } = await supabase
          .from("layanan")
          .select("*")
          .order("id_layanan", { ascending: true });

        if (error) throw error;
        if (data) setDaftarLayanan(data);
      } catch (err) {
        console.error("Gagal mengambil data layanan:", err);
      }
    };

    fetchLayanan();
  }, []);

  // --- 2. Fungsi Ambil Nomor Antrian ---
  const handleAmbilAntrian = async (layanan) => {
    if (loading) return;
    setLoading(true);

    try {
      const today = new Date().toISOString().split("T")[0];

      // Hitung jumlah antrian hari ini
      const { data: antrianHariIni, error: countError } = await supabase
        .from("antrian")
        .select("id_antrian", { count: "exact" })
        .eq("id_layanan", layanan.id_layanan)
        .gte("tanggal", today); // Pastikan filter tanggal benar

      if (countError) throw countError;

      // Generate Nomor Baru
      const urutan = (antrianHariIni?.length || 0) + 1;
      const nomorBaru = `${layanan.kode_huruf}-${String(urutan).padStart(3, "0")}`;

      // Simpan ke Database
      const { error: insertError } = await supabase.from("antrian").insert([
        {
          nomor_antrian: nomorBaru,
          id_layanan: layanan.id_layanan,
          status: "menunggu",
          tanggal: today,
        },
      ]);

      if (insertError) throw insertError;

      // Update Tampilan Mini Monitor
      setAntrianTerakhir(nomorBaru);

      // Tampilkan Popup Sukses
      await Swal.fire({
        title: "Berhasil!",
        html: `
          <div class="flex flex-col items-center gap-2">
            <span class="text-slate-500 text-sm">Nomor Antrian Anda</span>
            <span class="text-7xl font-bold text-emerald-600 tracking-widest my-4">${nomorBaru}</span>
            <div class="px-5 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium border border-emerald-100">
              ${layanan.nama_layanan}
            </div>
            <p class="text-xs text-slate-400 mt-4 animate-pulse">Sedang mencetak struk...</p>
          </div>
        `,
        timer: 4000,
        timerProgressBar: true,
        showConfirmButton: false,
        background: "#fff",
        customClass: {
          popup: "rounded-2xl shadow-2xl p-6 border-t-4 border-emerald-500",
        },
      });
    } catch (error) {
      console.error("Error saat ambil antrian:", error);
      Swal.fire({
        icon: "error",
        title: "Gagal",
        text: "Terjadi kesalahan sistem. Silakan coba lagi.",
        confirmButtonColor: "#059669",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] text-slate-800 font-sans selection:bg-emerald-100">
      {/* --- NAVBAR UTAMA --- */}
      <nav className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        {/* Kiri: Logo & Identitas */}
        <div className="flex items-center gap-3 sm:gap-4">
          <img
            src="/logoinsunmedal.png"
            alt="Logo"
            className="w-10 h-10 object-contain"
          />
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-800">
              Pelayanan Terpadu
            </h1>
            <div className="flex items-center gap-1 text-slate-500 text-xs sm:text-sm">
              <MapPin size={14} />
              <span className="hidden sm:inline">
                Kantor Kelurahan Desa Talun
              </span>
              <span className="sm:hidden">Kelurahan Talun</span>
            </div>
          </div>
        </div>

        {/* Kanan: Tombol Link ke Monitor TV */}
        <Link
          to="/monitor"
          target="_blank"
          className="hidden sm:flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-emerald-700 px-4 py-2 rounded-lg font-medium transition-all duration-200 border border-slate-200"
        >
          <Tv size={18} />
          <span>Lihat Monitor Display</span>
        </Link>
      </nav>

      {/* --- KONTEN UTAMA --- */}
      <main className="max-w-7xl mx-auto px-4 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* BAGIAN KIRI: PILIH LAYANAN (7 Kolom) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">
                Ambil Nomor Antrian
              </h2>
              <p className="text-slate-500">
                Silakan pilih jenis layanan sesuai keperluan Anda di bawah ini.
              </p>
            </div>

            {/* Loading State */}
            {daftarLayanan.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-slate-100">
                <div className="animate-spin w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-slate-400">Memuat layanan...</p>
              </div>
            ) : (
              /* Grid Tombol Layanan */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {daftarLayanan.map((item) => (
                  <button
                    key={item.id_layanan}
                    onClick={() => handleAmbilAntrian(item)}
                    disabled={loading}
                    className="group relative bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-emerald-200 hover:-translate-y-1 transition-all duration-300 text-left flex flex-col gap-4 h-full"
                  >
                    <div className="flex justify-between items-start">
                      <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center group-hover:bg-emerald-600 transition-colors duration-300">
                        <Printer
                          className="text-emerald-600 group-hover:text-white transition-colors duration-300"
                          size={28}
                        />
                      </div>
                      <span className="text-4xl font-bold text-slate-100 group-hover:text-emerald-50 transition-colors duration-300">
                        {item.kode_huruf}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-slate-800 mb-1 group-hover:text-emerald-700">
                        {item.nama_layanan}
                      </h3>
                      <p className="text-sm text-slate-500 line-clamp-2">
                        {item.deskripsi}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* BAGIAN KANAN: STATUS MINI (5 Kolom) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* Card Status Utama */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="bg-emerald-50/50 p-6 border-b border-emerald-100 text-center">
                <h3 className="text-emerald-900 font-semibold">
                  Nomor Terakhir Diambil
                </h3>
                <p className="text-emerald-600/60 text-xs mt-1">
                  Baru saja dicetak
                </p>
              </div>

              <div className="p-10 flex flex-col items-center justify-center gap-2 bg-white min-h-[200px]">
                <span className="text-7xl font-bold text-slate-900 tracking-tighter">
                  {antrianTerakhir}
                </span>
                <div className="flex gap-2 mt-6 opacity-40">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            </div>

            {/* Jam Operasional */}
            <div className="bg-emerald-600 rounded-2xl p-6 text-white shadow-lg shadow-emerald-200 relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3 opacity-90">
                  <Info size={18} />
                  <span className="font-semibold">Jam Operasional</span>
                </div>
                <ul className="space-y-3 text-emerald-50 text-sm">
                  <li className="flex justify-between border-b border-emerald-500/30 pb-2">
                    <span>Senin - Kamis</span>
                    <span className="font-mono font-medium bg-emerald-700/50 px-2 py-0.5 rounded">
                      08:00 - 15:00
                    </span>
                  </li>
                  <li className="flex justify-between pt-1">
                    <span>Jumat</span>
                    <span className="font-mono font-medium bg-emerald-700/50 px-2 py-0.5 rounded">
                      08:00 - 11:00
                    </span>
                  </li>
                </ul>
              </div>
              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            </div>

            {/* Link Tambahan Mobile (Muncul cuma di HP) */}
            <div className="block sm:hidden text-center mt-4">
              <Link
                to="/monitor"
                className="text-emerald-600 font-medium text-sm underline"
              >
                Lihat Monitor Display TV
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
