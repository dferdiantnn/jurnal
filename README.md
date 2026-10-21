# Universal Trading PnL Calendar Journal

[![Live Dashboard](https://img.shields.io/badge/Live_Dashboard-Buka_Jurnal_Trading-00D2FF?style=for-the-badge&logo=googlechrome&logoColor=white)](https://dferdiantnn.github.io/jurnal/)
[![GitHub Pages](https://img.shields.io/badge/GitHub_Pages-Online-10B981?style=for-the-badge&logo=github)](https://dferdiantnn.github.io/jurnal/)

> **Link Jurnal Trading (Live):**  
> **[https://dferdiantnn.github.io/jurnal/](https://dferdiantnn.github.io/jurnal/)**  
> *(Dapat dibuka langsung dari browser HP, tablet, maupun laptop kapan saja)*

---

Jurnal trading berbasis web minimalis dengan tema dark mode obsidian (`#08090C`), cyan profits (`+2.42M`), dan red losses (`-1.41M`). Otomatis menghitung daily net P&L, win rate, dan metrik performa transaksi MT4/MT5.

---

## Fitur Utama

- **Tampilan Per Semester Rapi (Urut ke Bawah)**:
  - **Semester 1**: Januari &rarr; Februari &rarr; Maret &rarr; April &rarr; Mei &rarr; Juni.
  - **Semester 2**: Juli &rarr; Agustus &rarr; September &rarr; Oktober &rarr; November &rarr; Desember.
- **Header Minimalis & Menu Samping (`☰`)**:
  - Tampilan utama bersih tanpa tombol yang menumpuk.
  - Semua pengaturan, ringkasan performa semester, akun broker terhubung, dan waktu pembaruan terakhir tersusun rapi di dalam drawer menu.
  - Indikator status dan waktu update terakhir (`Update: 21 Okt, 18:23 WIB`) selalu terpampang jelas.
- **Zero-Load CLI Sync (~0.3 Detik)**:
  - Jalankan perintah sinkronisasi sekali ketik, data langsung ter-push ke web dalam sekejap tanpa membebani laptop.

---

## Cara Sinkronkan Transaksi dari MetaTrader 5 (MT5)

### 1. Sinkronisasi Cepat Lewat Terminal (0% Beban Laptop)
Cukup jalankan satu perintah ini di terminal:
```bash
jurnal sync
```
Perintah ini akan membaca laporan transaksi terbaru, memperbarui metadata waktu update, dan langsung mem-push ke GitHub Pages dalam ~0.3 detik.

### 2. Drag & Drop Laporan MT5 Langsung di Web
- Di aplikasi MT5, buka tab bawah **Toolbox > History**.
- Klik kanan di mana saja &rarr; **Report** &rarr; **HTML**.
- Drag & drop file `.html` tersebut langsung ke layar web browser (atau gunakan tombol **Import Laporan MT5** di dalam menu samping `☰`).

---

## Menjalankan Server Lokal (Opsional)

Jika ingin menjalankan server lokal:
```bash
jurnal
```
Lalu buka [http://localhost:3000](http://localhost:3000) di browser.

---

## Lisensi
MIT License.
