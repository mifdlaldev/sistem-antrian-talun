import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import { Building2, Clock, Calendar } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export default function Monitor() {
  const [antrianDilayani, setAntrianDilayani] = useState([]); // List yang sedang dilayani
  const [antrianMenunggu, setAntrianMenunggu] = useState([]); // List yang masih nunggu
  const [waktu, setWaktu] = useState(new Date());

  // 1. Setup Jam Digital
  useEffect(() => {
    const timer = setInterval(() => setWaktu(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. Fetch Data Awal & Setup Realtime Listener
  useEffect(() => {
    fetchDataAntrian();

    // --- FITUR REALTIME SUPABASE ---
    // Ini yang bikin layar otomatis berubah tanpa refresh
    const channel = supabase
      .channel("public:antrian") // Nama channel bebas
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "antrian" }, // Dengarkan semua perubahan di tabel antrian
        (payload) => {
          console.log("Ada perubahan data!", payload);
          fetchDataAntrian(); // Refresh data kalau ada perubahan
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Fungsi ambil data dari database
  const fetchDataAntrian = async () => {
    const today = new Date().toISOString().split("T")[0];

    // A. Ambil yang statusnya 'dilayani' (Untuk ditampilkan Besar)
    const { data: dataDilayani } = await supabase
      .from("antrian")
      .select("*, layanan(*), users(*)") // Join ke tabel layanan & users
      .eq("status", "dilayani")
      .eq("tanggal", today)
      .order("waktu_selesai", { ascending: false }); // Yang baru dipanggil paling atas

    // B. Ambil yang statusnya 'menunggu' (Untuk list di samping)
    const { data: dataMenunggu } = await supabase
      .from("antrian")
      .select("*, layanan(*)")
      .eq("status", "menunggu")
      .eq("tanggal", today)
      .order("id_antrian", { ascending: true }) // Urut dari yang datang duluan
      .limit(5); // Cuma tampilkan 5 antrian berikutnya

    if (dataDilayani) setAntrianDilayani(dataDilayani);
    if (dataMenunggu) setAntrianMenunggu(dataMenunggu);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans flex flex-col overflow-hidden">
      {/* --- HEADER --- */}
      <header className="bg-emerald-700 text-white p-4 sm:p-6 shadow-lg flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0 z-10">
        <div className="flex items-center gap-3 sm:gap-4">
          <img
            src="/logoinsunmedal.png"
            alt="Logo"
            className="w-15 h-15 object-contain"
          />
          <div className="text-center sm:text-left">
            <h1 className="text-xl sm:text-3xl font-bold tracking-wide uppercase">
              Kelurahan Desa Talun
            </h1>
            <p className="text-emerald-100 text-sm sm:text-lg">
              Sistem Antrian Terpadu
            </p>
          </div>
        </div>

        {/* Jam & Tanggal */}
        <div className="text-center sm:text-right">
          <div className="text-3xl sm:text-4xl font-mono font-bold">
            {format(waktu, "HH:mm:ss")}
          </div>
          <div className="flex items-center justify-center sm:justify-end gap-2 text-emerald-100 mt-1">
            <Calendar size={16} />
            <span className="text-sm sm:text-lg">
              {format(waktu, "EEEE, dd MMMM yyyy", { locale: id })}
            </span>
          </div>
        </div>
      </header>

      {/* --- CONTENT UTAMA --- */}
      <main className="flex-1 p-4 sm:p-6 grid grid-cols-12 gap-6 relative">
        {/* KOLOM KIRI: VIDEO / SLIDE (Opsional, biar kayak TV beneran) */}
        <div className="col-span-12 lg:col-span-7 flex flex-col gap-6">
          {/* Area Utama (Bisa video profil desa, disini kita pakai Placeholder gambar desa/pola) */}
          <div className="flex-1 bg-slate-800 rounded-3xl overflow-hidden shadow-xl relative group min-h-[30vh] sm:min-h-[40vh] lg:min-h-full">
            {/* Simulasi Video Player */}
            <img
              src="/kantorlurahtalun.jpg"
              alt="Profil Desa Talun"
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Overlay Info Antrian Sedang Dilayani (UTAMA) */}
            {/* Jika ada yang dilayani, tampilkan kartu besar di atas video */}
            {antrianDilayani.length > 0 && (
              <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 bg-white/95 backdrop-blur-md p-4 sm:p-6 rounded-2xl shadow-2xl border-l-8 border-emerald-500 flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0 text-center sm:text-left animate-in slide-in-from-bottom duration-700">
                <div>
                  <p className="text-slate-500 text-base sm:text-lg font-medium uppercase mb-1">
                    Panggilan Terakhir
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-slate-800">
                    {antrianDilayani[0]?.layanan?.nama_layanan}
                  </p>
                  <p className="text-emerald-600 font-medium mt-1 text-base sm:text-lg">
                    {antrianDilayani[0]?.users?.nama_lengkap || "Petugas Loket"}
                  </p>
                </div>
                <div className="text-center sm:text-right mt-2 sm:mt-0">
                  <span className="block text-6xl sm:text-8xl font-bold text-slate-900 tracking-tighter">
                    {antrianDilayani[0]?.nomor_antrian}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* KOLOM KANAN: LIST ANTRIAN */}
        <div className="col-span-12 lg:col-span-5 flex flex-col h-full">
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col h-full border border-slate-200">
            <div className="bg-emerald-600 p-4 sm:p-5 text-center">
              <h2 className="text-white text-xl sm:text-2xl font-bold uppercase tracking-wider">
                Antrian Selanjutnya
              </h2>
            </div>

            <div className="flex-1 p-0 overflow-hidden">
              {antrianMenunggu.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2 opacity-50 p-4 text-center">
                  <Clock size={40} />
                  <p className="text-lg sm:text-xl">
                    Tidak ada antrian menunggu
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {antrianMenunggu.map((item, index) => (
                    <div
                      key={item.id_antrian}
                      className="p-4 sm:p-6 flex items-center justify-between hover:bg-emerald-50 transition-colors"
                    >
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-100 text-slate-500 flex-shrink-0 flex items-center justify-center font-bold text-sm sm:text-base">
                          {index + 1}
                        </div>
                        <div className="flex-grow">
                          <p className="text-base sm:text-lg font-bold text-slate-700">
                            {item.layanan?.nama_layanan}
                          </p>
                          <p className="text-xs sm:text-sm text-slate-400">
                            Menunggu giliran
                          </p>
                        </div>
                      </div>
                      <span className="text-3xl sm:text-5xl font-bold text-emerald-600 pl-4">
                        {item.nomor_antrian}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* --- FOOTER RUNNING TEXT --- */}
      <footer className="bg-slate-900 text-white py-2 sm:py-3 overflow-hidden whitespace-nowrap relative border-t-4 border-emerald-500">
        <div className="animate-marquee inline-block text-sm sm:text-lg font-medium">
          Selamat Datang di Kantor Kelurahan Desa Talun. Budayakan antri untuk
          kenyamanan bersama. Jam operasional Senin-Kamis (08:00 - 15:00) Jumat
          (08:00 - 11:00). Mohon siapkan berkas persyaratan Anda sebelum menuju
          loket.
        </div>
      </footer>

      {/* Tambahan style animasi marquee di dalam komponen */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(100vw); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
          padding-left: 100%;
        }
      `}</style>
    </div>
  );
}
