// Data simulasi Layanan
export const mockLayanan = [
  {
    id: 1,
    nama: "Layanan KTP & KK",
    kode: "A",
    deskripsi: "Pembuatan KTP, KK, Surat Pindah",
  },
  {
    id: 2,
    nama: "Layanan Umum",
    kode: "B",
    deskripsi: "SKCK, Surat Pengantar, Legalisir",
  },
  {
    id: 3,
    nama: "Layanan Pajak",
    kode: "C",
    deskripsi: "PBB dan Administrasi Lainnya",
  },
];

// Data simulasi Antrian Hari Ini
export const mockAntrian = [
  { id: 101, nomor: "A-001", status: "selesai", loket: "Loket 1" },
  { id: 102, nomor: "A-002", status: "dilayani", loket: "Loket 1" }, // Sedang dipanggil
  { id: 103, nomor: "B-001", status: "menunggu", loket: null },
  { id: 104, nomor: "B-002", status: "menunggu", loket: null },
  { id: 105, nomor: "A-003", status: "menunggu", loket: null },
];
