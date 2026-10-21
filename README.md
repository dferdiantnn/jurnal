# 🏆 Universal Trading PnL Calendar Journal

[![Live Dashboard](https://img.shields.io/badge/Live_Dashboard-Buka_Jurnal_Trading-00D2FF?style=for-the-badge&logo=googlechrome&logoColor=white)](https://dferdiantnn.github.io/jurnal/)
[![GitHub Pages](https://img.shields.io/badge/GitHub_Pages-Online-10B981?style=for-the-badge&logo=github)](https://dferdiantnn.github.io/jurnal/)

> 🌐 **Link Jurnal Trading (Live):**  
> 👉 **[https://dferdiantnn.github.io/jurnal/](https://dferdiantnn.github.io/jurnal/)**  
> *(Dapat dibuka langsung dari browser HP, tablet, maupun laptop kapan saja)*

---

A modern, minimal, dark-mode trading journal inspired by high-frequency prop trading calendars. Automatically tracks and calculates daily net P&L, win rate, and performance metrics across universal MetaTrader (MT4/MT5) brokers (Exness, XM, IC Markets, dll).

---

## ✨ Fitur Utama

- **Tampilan Per Semester Rapi (Urut ke Bawah)**:
  - **Semester 1**: Januari &rarr; Februari &rarr; Maret &rarr; April &rarr; Mei &rarr; Juni.
  - **Semester 2**: Juli &rarr; Agustus &rarr; September &rarr; Oktober &rarr; November &rarr; Desember.
  - Tombol pemilih semester dan navigasi tahun yang presisi.
- **Header Minimalis & Auto-Hide**:
  - Tampilan atas ultra-bersih tanpa tombol menumpuk.
  - Tombol sembunyikan (`👁️`) + Tombol mengambang (`☰`) saat header disembunyikan.
  - Opsi auto-hide saat idle (tidak ada interaksi mouse/layar selama 4 detik).
- **Menu Garis Tiga (`☰`) / Drawer Samping**:
  - **Ringkasan Performa Semester**: Net P&L, Win Rate %, dan Win/Loss.
  - **Manajemen Akun Broker**: Terhubung langsung ke akun MT5 Exness Anda.
  - **Aksi Cepat**: Tombol import file laporan MT5 dan sinkronisasi real-time.
- **Dark Minimalist Aesthetic**: Deep obsidian background (`#08090C`), electric cyan profits (`+2.42M`), dan crimson red losses (`-1.41M`).
- **Client-Side MT5 Report Parser**: Drag & drop laporan transaksi HTML dari MT5 langsung ke browser tanpa server.

---

## ⚡ Cara Sinkronkan Transaksi dari MetaTrader 5 (MT5)

1. **Cara 1: Drag & Drop Laporan MT5 (Paling Cepat & Mudah)**
   - Di aplikasi MT5, buka tab bawah **Toolbox > History**.
   - Klik kanan di mana saja &rarr; **Report** &rarr; **HTML**.
   - Simpan filenya, lalu drag & drop file `.html` tersebut langsung ke layar web browser (atau klik **Import MT5** di dalam menu garis tiga).

2. **Cara 2: Script Otomatis MT5**
   - Copy file `Sync_Journal.mq5` ke folder MT5 Anda: `MQL5/Scripts/`.
   - Di panel kiri MT5 (**Navigator > Scripts**), drag script `Sync_Journal` ke chart aktif untuk mengekspor riwayat deal closed secara otomatis.

---

## 🚀 Menjalankan Secara Lokal (Opsional)

Jika ingin menjalankan server lokal di laptop:

```bash
# Clone repository
git clone https://github.com/dferdiantnn/jurnal.git
cd jurnal

# Jalankan server
python3 server.py
```
Lalu buka [http://localhost:3000](http://localhost:3000) di browser.

---

## 📄 License
MIT License. Dibuat untuk kenyamanan para trader.
