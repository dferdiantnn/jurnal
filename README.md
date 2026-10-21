# 🏆 Universal Trading PnL Calendar Journal

A modern, dark-mode, minimal trading journal inspired by high-frequency prop trading calendars. Automatically tracks and calculates daily net P&L, win rate, and performance metrics across universal MetaTrader (MT4/MT5) brokers (Exness, XM, IC Markets, dll).

🌐 **Live Web Demo:** [https://dferdiantnn.github.io/jurnal/](https://dferdiantnn.github.io/jurnal/)

---

## ✨ Features
- **Dark Minimalist Aesthetic**: Deep obsidian background (`#08090C`), electric cyan profits (`+2.42M`), and crimson losses (`-1.41M`).
- **6-Month Rolling Window**: View 6 months of trading performance with seamless period navigation.
- **Auto-Aggregated Net P&L**: Multi-trade daily compounding (Profit + Commission + Swap).
- **Zero-Dependency Engine**: Works 100% in pure client-side vanilla JavaScript on GitHub Pages, or with a local zero-dependency Python server.
- **Universal Multi-Broker Support**: Drag-and-drop MT4/MT5 HTML reports directly into the browser, or use the included MQL5 sync script.

---

## 🚀 How to Run Locally

```bash
# Clone the repository
git clone https://github.com/dferdiantnn/jurnal.git
cd jurnal

# Run the local server
python3 server.py
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ⚡ How to Sync from MetaTrader 5

1. **Option 1: Drag & Drop Report (Easiest)**
   - In MT5, open the bottom **Toolbox > History** tab.
   - Right-click anywhere &rarr; **Report** &rarr; **HTML**.
   - Drag the exported `.html` file directly onto the web calendar (or click **Import MT5**).

2. **Option 2: Auto-Sync Script**
   - Copy `Sync_Journal.mq5` to your MT5 `MQL5/Scripts/` folder.
   - Drag `Sync_Journal` to any open chart in MT5 to export and sync all closed deals automatically.

---

## 📄 License
MIT License. Created for traders by traders.
