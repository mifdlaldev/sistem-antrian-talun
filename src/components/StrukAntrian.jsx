import React from "react";

export const StrukAntrian = React.forwardRef(
  ({ nomor, layanan, tanggal }, ref) => {
    return (
      <div
        ref={ref}
        className="w-[80mm] p-4 bg-white text-black font-mono text-center border border-gray-300 mx-auto hidden-print"
      >
        <h2 className="text-lg font-bold uppercase border-b-2 border-black pb-2 mb-2">
          Kelurahan Desa Talun
        </h2>
        <p className="text-xs mb-4">Jl. Pangeran Santri No. 123, Sumedang</p>

        <div className="my-6">
          <p className="text-sm">Nomor Antrian Anda:</p>
          <h1 className="text-5xl font-bold my-2">{nomor}</h1>
          <p className="text-sm font-bold uppercase">{layanan}</p>
        </div>

        <div className="border-t border-dashed border-black pt-2 text-xs">
          <p>{tanggal}</p>
          <p className="mt-2">Silakan Menunggu</p>
          <p>Terima Kasih</p>
        </div>
      </div>
    );
  },
);

/* Class 'hidden-print' di atas nanti berguna jika kita ingin menyembunyikannya di layar tapi muncul saat di-print */
StrukAntrian.displayName = "StrukAntrian";
export default StrukAntrian;
