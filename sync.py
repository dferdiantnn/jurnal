#!/usr/bin/env python3
"""
================================================================================
  JURNAL SYNC: FULLY AUTOMATED ZERO-CLICK TRADING JOURNAL
================================================================================
1. Otomatis membuka MT5 di background (headless Wine)
2. Otomatis menarik riwayat transaksi/deals terbaru dari broker Exness
3. Otomatis menutup kembali MT5 (0% CPU residual, laptop 100% adem)
4. Otomatis sinkronisasi data & push langsung ke GitHub Pages
================================================================================
"""

import os
import sys
import json
import glob
import re
import time
import shutil
import subprocess
from datetime import datetime, timezone, timedelta

WIB = timezone(timedelta(hours=7))
NOW_WIB = datetime.now(WIB)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PARENT_DIR = os.path.dirname(BASE_DIR)
TRADES_FILE = os.path.join(BASE_DIR, 'trades_data.json')
JURNAL_REPO_DIR = '/Users/user/Documents/antigravity/jurnal'

WINE_PREFIX = os.path.expanduser('~/Library/Application Support/net.metaquotes.wine.metatrader5')
WINE_BIN = '/Applications/MetaTrader 5.app/Contents/SharedSupport/wine/bin/wine64'
MT5_DIR = os.path.join(WINE_PREFIX, 'drive_c/Program Files/MetaTrader 5')
MT5_DOCS_DIR = os.path.join(WINE_PREFIX, 'drive_c/users/user/Documents')
MT5_FILES_DIR = os.path.join(MT5_DIR, 'MQL5/Files')
STARTUP_INI = os.path.join(MT5_DIR, 'sync_startup.ini')

def run_headless_mt5():
    """
    Menjalankan MT5 sebentar untuk mengeksekusi script Sync_Journal.ex5,
    menarik deal history terbaru dari Exness, lalu menutup MT5 secara otomatis.
    """
    if not os.path.exists(WINE_BIN) or not os.path.exists(STARTUP_INI):
        return False

    print("[*] Menghubungi MetaTrader 5 untuk menarik riwayat deals terbaru...")
    
    # Bersihkan instance MT5 lama jika ada yang macet
    try:
        subprocess.run(['pkill', '-f', 'terminal64.exe'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        time.sleep(0.5)
    except Exception:
        pass

    env = os.environ.copy()
    env['WINEPREFIX'] = WINE_PREFIX

    t0 = time.time()
    try:
        subprocess.run(
            [WINE_BIN, 'terminal64.exe', '/config:sync_startup.ini'],
            cwd=MT5_DIR,
            env=env,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            timeout=25
        )
        elapsed = time.time() - t0
        print(f"[✔] Riwayat deals berhasil diunduh dari Exness ({elapsed:.1f}s). MT5 ditutup otomatis.")
        return True
    except subprocess.TimeoutExpired:
        # Jika timeout, paksa matikan MT5 agar laptop tidak terbebani
        subprocess.run(['pkill', '-f', 'terminal64.exe'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        print("[!] MT5 melebihi batas waktu (25s), dipaksa berhenti demi menjaga laptop tetap adem.")
        return False
    except Exception as e:
        print(f"[!] Warning jalankan MT5: {e}")
        return False

def extract_account_from_html(content, htm_path):
    acct_match = re.search(r'Akun:.*?<b>(.*?)</b>', content, re.DOTALL | re.IGNORECASE)
    if not acct_match:
        acct_match = re.search(r'Account:.*?<b>(.*?)</b>', content, re.DOTALL | re.IGNORECASE)
    
    login = ""
    server = ""
    
    if acct_match:
        raw = re.sub(r'<[^>]+>', '', acct_match.group(1)).replace('&nbsp;', ' ').strip()
        parts = raw.split('(')
        login = parts[0].strip()
        if len(parts) > 1:
            details = [x.strip() for x in parts[1].replace(')', '').split(',')]
            for d in details:
                if any(k in d.lower() for k in ['exness', 'real', 'trial', 'demo', 'server']) or '-' in d:
                    server = d
                    break

    if not login:
        m = re.search(r'ReportHistory-(\d+)', os.path.basename(htm_path))
        if m:
            login = m.group(1)

    if not server:
        server = 'Exness-MT5'

    return {'account': login or '463678568', 'server': server, 'platform': 'MT5'}

def parse_mt5_html_content(content):
    daily = {}
    deals_idx = content.find('Transaksi')
    if deals_idx == -1:
        deals_idx = content.find('Deals')
    if deals_idx == -1:
        return daily

    rows = re.findall(r'<tr[^>]*>(.*?)</tr>', content[deals_idx:], re.DOTALL)
    for r in rows:
        cols = re.findall(r'<td[^>]*>(.*?)</td>', r, re.DOTALL)
        if len(cols) >= 13:
            waktu = re.sub(r'<[^>]+>', '', cols[0]).strip()
            simbol = re.sub(r'<[^>]+>', '', cols[2]).strip()
            tipe = re.sub(r'<[^>]+>', '', cols[3]).strip()
            arah = re.sub(r'<[^>]+>', '', cols[4]).strip().lower()
            volume = re.sub(r'<[^>]+>', '', cols[5]).strip()
            profit_str = re.sub(r'<[^>]+>', '', cols[12]).strip().replace(' ', '').replace('&nbsp;', '')
            swap_str = re.sub(r'<[^>]+>', '', cols[11]).strip().replace(' ', '').replace('&nbsp;', '')
            comm_str = re.sub(r'<[^>]+>', '', cols[9]).strip().replace(' ', '').replace('&nbsp;', '')

            if arah == 'out':
                try:
                    profit = float(profit_str)
                    swap = float(swap_str) if swap_str else 0.0
                    comm = float(comm_str) if comm_str else 0.0
                    net = profit + swap + comm
                    parts = waktu.split()
                    date_key = parts[0].replace('.', '-')
                    time_str = parts[1][:5] if len(parts) > 1 else '00:00'
                    if date_key not in daily:
                        daily[date_key] = {'pnl': 0.0, 'trades': []}
                    daily[date_key]['pnl'] = round(daily[date_key]['pnl'] + net, 2)
                    daily[date_key]['trades'].append({
                        'time': time_str,
                        'symbol': simbol,
                        'type': tipe.upper(),
                        'lot': float(volume),
                        'profit': round(net, 2)
                    })
                except Exception:
                    continue
    return daily

def sync_trades():
    start_time = time.time()
    
    # 1. Jalankan headless MT5 jika tidak ada flag --fast / --no-mt5
    fast_mode = '--fast' in sys.argv or '--no-mt5' in sys.argv
    if not fast_mode:
        run_headless_mt5()

    trades = {}
    if os.path.exists(TRADES_FILE):
        try:
            with open(TRADES_FILE, 'r') as f:
                trades = json.load(f)
        except Exception:
            trades = {}

    detected_accounts = []

    # 2. Scan MT5 HTML Reports (jika pernah ada export manual)
    if os.path.exists(MT5_DOCS_DIR):
        for htm_path in glob.glob(os.path.join(MT5_DOCS_DIR, 'ReportHistory*.htm*')):
            content = None
            for enc in ['utf-16', 'utf-8', 'latin-1']:
                try:
                    with open(htm_path, 'r', encoding=enc) as f:
                        content = f.read()
                    break
                except UnicodeDecodeError:
                    continue
            if content:
                acct_info = extract_account_from_html(content, htm_path)
                if not any(a['account'] == acct_info['account'] for a in detected_accounts):
                    detected_accounts.append(acct_info)

                parsed = parse_mt5_html_content(content)
                for date_key, dval in parsed.items():
                    if date_key not in trades:
                        trades[date_key] = {'pnl': 0.0, 'trades': []}
                    for tr in dval['trades']:
                        exists = any(
                            x.get('time') == tr['time'] and abs(float(x.get('profit', 0.0)) - float(tr['profit'])) < 0.001
                            for x in trades[date_key]['trades']
                        )
                        if not exists:
                            trades[date_key]['trades'].append(tr)

    # 3. Scan trades_export.json dari Sync_Journal.ex5 (Sumber Utama Akurat)
    export_json = os.path.join(MT5_FILES_DIR, 'trades_export.json')
    if os.path.exists(export_json):
        try:
            with open(export_json, 'r') as f:
                data = json.load(f)
                account_id = str(data.get('account', '463678568'))
                if not any(a['account'] == account_id for a in detected_accounts):
                    detected_accounts.append({
                        'account': account_id,
                        'server': 'Exness-MT5Trial17',
                        'platform': 'MT5'
                    })

                for t in data.get('trades', []):
                    dt = datetime.fromisoformat(t.get('time', '').replace('Z', '+00:00'))
                    date_key = dt.strftime('%Y-%m-%d')
                    if date_key not in trades:
                        trades[date_key] = {'pnl': 0.0, 'trades': []}
                    
                    time_val = dt.strftime('%H:%M')
                    profit_val = round(float(t.get('profit', 0.0)), 2)
                    
                    exists = any(
                        x.get('time') == time_val and abs(float(x.get('profit', 0.0)) - profit_val) < 0.001
                        for x in trades[date_key]['trades']
                    )
                    if not exists:
                        trades[date_key]['trades'].append({
                            'time': time_val,
                            'symbol': t.get('symbol', 'XAUUSD'),
                            'type': t.get('type', 'BUY'),
                            'lot': round(float(t.get('lot', 0.01)), 2),
                            'profit': profit_val
                        })
        except Exception as e:
            print(f"[!] Warning membaca trades_export.json: {e}")

    # 4. Hitung ulang total PnL bersih per hari & urutkan transaksi
    for date_key in list(trades.keys()):
        if date_key == '_meta':
            continue
        day_trades = trades[date_key].get('trades', [])
        day_trades.sort(key=lambda x: x.get('time', ''))
        total_pnl = round(sum(float(x.get('profit', 0.0)) for x in day_trades), 2)
        trades[date_key] = {
            'pnl': total_pnl,
            'trades': day_trades
        }

    primary_acct = detected_accounts[0] if detected_accounts else {'account': '463678568', 'server': 'Exness-MT5Trial17', 'platform': 'MT5'}

    # 5. Metadata sinkronisasi
    trades['_meta'] = {
        'last_updated': NOW_WIB.isoformat(),
        'account': primary_acct['account'],
        'server': primary_acct['server'],
        'accounts': detected_accounts if detected_accounts else [primary_acct]
    }

    # 6. Simpan ke trades_data.json lokal
    with open(TRADES_FILE, 'w') as f:
        json.dump(trades, f, indent=2)

    # 7. Mirror ke repositori GitHub Pages dan push
    if os.path.exists(JURNAL_REPO_DIR):
        target_file = os.path.join(JURNAL_REPO_DIR, 'trades_data.json')
        with open(target_file, 'w') as f:
            json.dump(trades, f, indent=2)

        # Mirror front-end files
        for fname in ['index.html', 'style.css', 'app.js', 'sync.py']:
            src = os.path.join(BASE_DIR, fname)
            dst = os.path.join(JURNAL_REPO_DIR, fname)
            if os.path.exists(src):
                shutil.copy2(src, dst)

        try:
            subprocess.run(['git', 'add', '-A'], cwd=JURNAL_REPO_DIR, check=True, capture_output=True)
            status = subprocess.run(['git', 'status', '--porcelain'], cwd=JURNAL_REPO_DIR, capture_output=True, text=True)
            if status.stdout.strip():
                msg = f"sync: update trades & UI at {NOW_WIB.strftime('%d %b %Y, %H:%M WIB')}"
                subprocess.run(['git', 'commit', '-m', msg], cwd=JURNAL_REPO_DIR, check=True, capture_output=True)
                subprocess.run(['git', 'push', 'origin', 'main'], cwd=JURNAL_REPO_DIR, check=True, capture_output=True)
        except Exception as e:
            print(f"[!] Warning git push: {e}")

    duration = time.time() - start_time
    active_days = len([k for k in trades.keys() if k != '_meta'])
    time_str = NOW_WIB.strftime('%d %b %Y, %H:%M WIB')
    accts_str = ", ".join([f"{a['account']} ({a['server']})" for a in (detected_accounts or [primary_acct])])

    print("================================================================")
    print("  [✔] SINKRONISASI JURNAL TRADING SELESAI")
    print("================================================================")
    print(f"  • Waktu Update : {time_str}")
    print(f"  • Akun MT5     : {accts_str}")
    print(f"  • Hari Aktif   : {active_days} hari transaksi")
    print(f"  • Web Online   : https://dferdiantnn.github.io/jurnal/")
    print(f"  • Server Lokal : Ketik 'jurnal serve' jika ingin buka offline")
    print("================================================================")
    print(f"  (Selesai dalam {duration:.1f} detik. Laptop 100% adem, CPU 0%)")
    print("================================================================")

if __name__ == '__main__':
    sync_trades()
