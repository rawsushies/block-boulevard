import { EventCard } from './types';

export const BERITA_KOTA_CARDS: EventCard[] = [
  {
    id: 'bk-01',
    deck: 'CITY_PULSE',
    title: 'Festival Danau Toba',
    description: 'Wisatawan membanjiri festival budaya Danau Toba! Dapatkan bonus Rp 150.000.',
    flavor: 'Kain ulos berkibar anggun di tepian kaldera vulkanik.',
    effect: { type: 'GAIN_MONEY', amount: 150 },
  },
  {
    id: 'bk-02',
    deck: 'CITY_PULSE',
    title: 'Penerbangan Langsung Garuda',
    description: 'Terbang langsung menuju Bandara Ngurah Rai (DPS)! Dapatkan Rp 200.000 jika melewati Istana Merdeka.',
    flavor: 'Penerbangan wisata mendarat tepat saat matahari terbenam.',
    effect: { type: 'MOVE_TO_TILE', targetTileIndex: 21, awardPassBonus: true },
  },
  {
    id: 'bk-03',
    deck: 'CITY_PULSE',
    title: 'Perbaikan Tanggul Banjir Kanal',
    description: 'Banjir rob melanda kawasan pesisir. Bayar Rp 80.000 untuk perbaikan darurat.',
    flavor: 'Pompa air dioperasikan tanpa henti sepanjang malam.',
    effect: { type: 'PAY_MONEY', amount: 80 },
  },
  {
    id: 'bk-04',
    deck: 'CITY_PULSE',
    title: 'Jalan Tol Trans-Jawa',
    description: 'Laju kendaraan lancar melintasi jalan tol. Maju 3 langkah di papan.',
    flavor: 'Jalur ekspres memangkas waktu tempuh antar kota.',
    effect: { type: 'MOVE_STEPS', steps: 3 },
  },
  {
    id: 'bk-05',
    deck: 'CITY_PULSE',
    title: 'Macet Total Jalur Puncak',
    description: 'Sistem satu arah diberlakukan di pegunungan. Mundur 2 langkah.',
    flavor: 'Antrean kendaraan mengular di tengah kabut teh.',
    effect: { type: 'MOVE_STEPS', steps: -2 },
  },
  {
    id: 'bk-06',
    deck: 'CITY_PULSE',
    title: 'Pameran Batik Nusantara',
    description: 'Karya desainer Anda memukau pecinta mode dunia! Setiap lawan membayar Rp 35.000 kepada Anda.',
    flavor: 'Motif parang kencana menghiasi panggung Jakarta Fashion Week.',
    effect: { type: 'COLLECT_FROM_ALL', amount: 35 },
  },
  {
    id: 'bk-07',
    deck: 'CITY_PULSE',
    title: 'Inspeksi Amdal Pulau',
    description: 'Dokumen konservasi terumbu karang tertahan. Pergi langsung ke Pulau Terisolasi tanpa lewat Istana.',
    flavor: 'Pemeriksaan izin pelayaran di perairan dangkal.',
    effect: { type: 'GO_TO_HOLDING' },
  },
  {
    id: 'bk-08',
    deck: 'CITY_PULSE',
    title: 'Gala Investasi Mega Kuningan',
    description: 'Diundang ke pertemuan diplomatik di Mega Kuningan. Ambil Rp 200.000 jika melewati Istana Merdeka.',
    flavor: 'Gedung pencakar langit bermandikan lampu emas.',
    effect: { type: 'MOVE_TO_TILE', targetTileIndex: 29, awardPassBonus: true },
  },
  {
    id: 'bk-09',
    deck: 'CITY_PULSE',
    title: 'Sewa Kapal Pinisi Makassar',
    description: 'Sewa armada pinisi tradisional untuk mengangkut kayu jati. Bayar Rp 25.000 ke setiap pemain.',
    flavor: 'Layar putih terkembang megah menuju Selat Makassar.',
    effect: { type: 'PAY_EACH_PLAYER', amount: 25 },
  },
  {
    id: 'bk-10',
    deck: 'CITY_PULSE',
    title: 'Tiket Bebas Pulau / Escape Pass',
    description: 'Dapatkan Surat Izin Berlayar Darurat. Gunakan ini untuk bebas dari Pulau Terisolasi secara gratis!',
    flavor: 'Cap stempel syahbandar pelabuhan nusantara.',
    effect: { type: 'FREE_EXIT_CARD' },
  },
  {
    id: 'bk-11',
    deck: 'CITY_PULSE',
    title: 'Syuting Film Internasional Bali',
    description: 'Rumah produksi menyewa lokasi Anda di Ubud. Terima Rp 110.000.',
    flavor: 'Kamera sinematik menangkap hamparan terasering hijau.',
    effect: { type: 'GAIN_MONEY', amount: 110 },
  },
  {
    id: 'bk-12',
    deck: 'CITY_PULSE',
    title: 'Kompensasi Listrik PLN',
    description: 'Lonjakan beban gardu regional membutuhkan trafo baru. Bayar Rp 60.000.',
    flavor: 'Teknisi PLN membenahi jaringan gardu induk.',
    effect: { type: 'PAY_MONEY', amount: 60 },
  },
];

export const PENGUMUMAN_PUBLIK_CARDS: EventCard[] = [
  {
    id: 'pp-01',
    deck: 'CIVIC_NOTICE',
    title: 'Subsidi Revitalisasi Kawasan Heritage',
    description: 'Proyek pelestarian cagar budaya Anda mendapat apresiasi negara. Dapatkan Rp 140.000.',
    flavor: 'Gedung tua era kolonial bersolek kembali dengan megah.',
    effect: { type: 'GAIN_MONEY', amount: 140 },
  },
  {
    id: 'pp-02',
    deck: 'CIVIC_NOTICE',
    title: 'Kembali ke Istana Merdeka',
    description: 'Maju langsung ke Istana Merdeka dan kumpulkan tunjangan Rp 200.000.',
    flavor: 'Upacara kenegaraan menyambut para pionir pembangunan.',
    effect: { type: 'MOVE_TO_TILE', targetTileIndex: 0, awardPassBonus: true },
  },
  {
    id: 'pp-03',
    deck: 'CIVIC_NOTICE',
    title: 'Insentif Energi Terbarukan',
    description: 'Pemasangan panel surya di kawasan properti Anda disetujui. Terima Rp 100.000.',
    flavor: 'Energi hijau menyinari atap-atap gedung perkantoran.',
    effect: { type: 'GAIN_MONEY', amount: 100 },
  },
  {
    id: 'pp-04',
    deck: 'CIVIC_NOTICE',
    title: 'Iuran Trotoar Ramah Pejalan',
    description: 'Mendukung trotoar batu andesit lebar dan jalur sepeda. Bayar Rp 70.000.',
    flavor: 'Pedestrian teduh dengan bangku besi tempa.',
    effect: { type: 'PAY_MONEY', amount: 70 },
  },
  {
    id: 'pp-05',
    deck: 'CIVIC_NOTICE',
    title: 'Ketua Pekan Raya Nusantara',
    description: 'Pekan Raya Indonesia sukses besar! Kumpulkan Rp 40.000 dari masing-masing pemain.',
    flavor: 'Alunan gamelan dan parade kuliner nusantara semarak.',
    effect: { type: 'COLLECT_FROM_ALL', amount: 40 },
  },
  {
    id: 'pp-06',
    deck: 'CIVIC_NOTICE',
    title: 'Penghargaan Tata Ruang Nasional',
    description: 'Menerima Tiket Bebas Pulau dari Kementerian Perhubungan. Simpan untuk keluar dari Pulau Terisolasi.',
    flavor: 'Diakui sebagai teladan tata ruang kota berkelanjutan.',
    effect: { type: 'FREE_EXIT_CARD' },
  },
  {
    id: 'pp-07',
    deck: 'CIVIC_NOTICE',
    title: 'Obligasi Bandara Juanda Cair',
    description: 'Investasi obligasi infrastruktur terminal penerbangan cair beserta bunga. Terima Rp 180.000.',
    flavor: 'Hasil dividen pertumbuhan logistik antar pulau.',
    effect: { type: 'GAIN_MONEY', amount: 180 },
  },
  {
    id: 'pp-08',
    deck: 'CIVIC_NOTICE',
    title: 'Dana Konservasi Satwa Langka',
    description: 'Mendukung suaka badak Jawa dan orangutan Kalimantan. Donasikan Rp 50.000.',
    flavor: 'Menjaga keanekaragaman hayati nusantara tetap lestari.',
    effect: { type: 'PAY_MONEY', amount: 50 },
  },
  {
    id: 'pp-09',
    deck: 'CIVIC_NOTICE',
    title: 'Kunjungan Kerja Gedung Sate',
    description: 'Lanjutkan perjalanan ke Gedung Sate di Bandung. Terima Rp 200.000 jika melewati Istana Merdeka.',
    flavor: 'Melihat panorama Bandung dari menara atas Gedung Sate.',
    effect: { type: 'MOVE_TO_TILE', targetTileIndex: 6, awardPassBonus: true },
  },
  {
    id: 'pp-10',
    deck: 'CIVIC_NOTICE',
    title: 'Panggilan Sidang Arbitrase',
    description: 'Wajib hadir pada sidang tata kelola pulau. Langsung menuju Pulau Terisolasi tanpa bonus!',
    flavor: 'Bawa berkas kepemilikan lahan ke pengadilan darat.',
    effect: { type: 'GO_TO_HOLDING' },
  },
  {
    id: 'pp-11',
    deck: 'CIVIC_NOTICE',
    title: 'Gotong Royong Penghijauan Kota',
    description: 'Menanam pohon trembesi bersama rekan developer. Bayar Rp 20.000 ke setiap pemain.',
    flavor: 'Kanopi hijau menyejukkan jalanan protokol.',
    effect: { type: 'PAY_EACH_PLAYER', amount: 20 },
  },
  {
    id: 'pp-12',
    deck: 'CIVIC_NOTICE',
    title: 'Bantuan Usaha Mikro (UMKM)',
    description: 'Pusat kuliner kopi dan jajanan pasar di blok Anda laris manis! Dapatkan Rp 90.000.',
    flavor: 'Aroma kopi tubruk dan kue basah menggoda selera.',
    effect: { type: 'GAIN_MONEY', amount: 90 },
  },
];

export function shuffleCards<T>(items: T[], rng: () => number = Math.random): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export const CITY_PULSE_CARDS = BERITA_KOTA_CARDS;
export const CIVIC_NOTICE_CARDS = PENGUMUMAN_PUBLIK_CARDS;
