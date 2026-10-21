#!/usr/bin/env python3
"""
================================================================================
  EXNESS XAUUSD PNL CALENDAR BACKEND (STANDALONE ZERO-DEPENDENCY ENGINE)
================================================================================
Menjalankan REST API & Web Server kalender trading menggunakan library bawaan Python.
Dapat langsung dijalankan di macOS tanpa instalasi pip tambahan.
================================================================================
"""

import os
import sys
import json
import re
import glob
import argparse
from datetime import datetime, timezone
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
import urllib.parse

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PARENT_DIR = os.path.dirname(BASE_DIR)
TRADES_FILE = os.path.join(BASE_DIR, 'trades_data.json')
NOAH4_MEMORY = os.path.join(PARENT_DIR, 'noah4_memory.json')

MT5_DOCS_DIR = os.path.expanduser('~/Library/Application Support/net.metaquotes.wine.metatrader5/drive_c/users/user/Documents')
MT5_FILES_DIR = os.path.expanduser('~/Library/Application Support/net.metaquotes.wine.metatrader5/drive_c/Program Files/MetaTrader 5/MQL5/Files')

def load_stored_trades():
    if os.path.exists(TRADES_FILE):
        try:
            with open(TRADES_FILE, 'r') as f:
                return json.load(f)
        except Exception:
            pass
    return {}

def save_stored_trades(data):
    with open(TRADES_FILE, 'w') as f:
        json.dump(data, f, indent=2)

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

def sync_from_mt5_filesystem():
    """Otomatis memindai file export dari MT5 wine prefix jika ada."""
    trades = load_stored_trades()
    has_changes = False

    # 1. Cek trades_export.json dari Sync_Journal.mq5
    export_json = os.path.join(MT5_FILES_DIR, 'trades_export.json')
    if os.path.exists(export_json):
        try:
            with open(export_json, 'r') as f:
                data = json.load(f)
                new_trades = data.get('trades', [])
                for t in new_trades:
                    t_time = t.get('time', '')
                    dt = datetime.fromisoformat(t_time.replace('Z', '+00:00'))
                    date_key = dt.strftime('%Y-%m-%d')
                    if date_key not in trades:
                        trades[date_key] = {'pnl': 0.0, 'trades': []}
                    # Hindari duplikat transaksi yang sama persis
                    exists = any(x.get('time') == dt.strftime('%H:%M') and x.get('profit') == t.get('profit') for x in trades[date_key]['trades'])
                    if not exists:
                        trades[date_key]['pnl'] = round(trades[date_key]['pnl'] + t.get('profit', 0.0), 2)
                        trades[date_key]['trades'].append({
                            'time': dt.strftime('%H:%M'),
                            'symbol': t.get('symbol', 'XAUUSD'),
                            'type': t.get('type', 'BUY'),
                            'lot': t.get('lot', 0.01),
                            'profit': t.get('profit', 0.0)
                        })
                        has_changes = True
        except Exception as e:
            print(f"[!] Warning reading trades_export.json: {e}")

    # 2. Cek Laporan HTML MT5 di Documents folder
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
                parsed = parse_mt5_html_content(content)
                for date_key, dval in parsed.items():
                    if date_key not in trades:
                        trades[date_key] = dval
                        has_changes = True
                    else:
                        for tr in dval['trades']:
                            exists = any(x.get('time') == tr['time'] and x.get('profit') == tr['profit'] for x in trades[date_key]['trades'])
                            if not exists:
                                trades[date_key]['pnl'] = round(trades[date_key]['pnl'] + tr['profit'], 2)
                                trades[date_key]['trades'].append(tr)
                                has_changes = True

    if has_changes:
        save_stored_trades(trades)
        print("[✔] Sinkronisasi otomatis data MT5 berhasil diperbarui!")

    return trades

def aggregate_noah4_memory():
    aggregated = {}
    if os.path.exists(NOAH4_MEMORY):
        try:
            with open(NOAH4_MEMORY, 'r') as f:
                data = json.load(f)
                history = data.get('history', [])
                for item in history:
                    ts_str = item.get('timestamp')
                    pnl = item.get('pnl', 0.0)
                    meta = item.get('meta', {})
                    if ts_str:
                        dt = datetime.fromisoformat(ts_str.replace('Z', '+00:00'))
                        date_key = dt.strftime('%Y-%m-%d')
                        if date_key not in aggregated:
                            aggregated[date_key] = {'pnl': 0.0, 'trades': []}
                        aggregated[date_key]['pnl'] += pnl
                        aggregated[date_key]['trades'].append({
                            'time': dt.strftime('%H:%M'),
                            'type': 'BUY' if pnl > 0 else 'SELL',
                            'lot': meta.get('lot', 0.1),
                            'profit': pnl
                        })
        except Exception as e:
            print(f"[!] Warning reading noah4_memory: {e}")
    return aggregated

class CalendarHTTPHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == '/api/pnl':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()

            trades = sync_from_mt5_filesystem()
            noah_trades = aggregate_noah4_memory()

            merged = {**trades}
            for date_key, val in noah_trades.items():
                if date_key not in merged:
                    merged[date_key] = val
                else:
                    merged[date_key]['pnl'] = round(merged[date_key]['pnl'] + val['pnl'], 2)
                    merged[date_key]['trades'].extend(val['trades'])

            response_data = {
                'status': 'ok',
                'history': merged,
                'server_time': datetime.now(timezone.utc).isoformat()
            }
            self.wfile.write(json.dumps(response_data).encode('utf-8'))
            return

        super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == '/api/trade':
            try:
                content_len = int(self.headers.get('Content-Length', 0))
                body = self.rfile.read(content_len)
                data = json.loads(body.decode('utf-8'))

                symbol = data.get('symbol', 'XAUUSD')
                profit = float(data.get('profit', 0.0))
                trade_type = data.get('type', 'BUY').upper()
                lot = float(data.get('lot', 0.1))
                trade_time_str = data.get('time', datetime.now(timezone.utc).isoformat())

                dt = datetime.fromisoformat(trade_time_str.replace('Z', '+00:00'))
                date_key = dt.strftime('%Y-%m-%d')

                trades = load_stored_trades()
                if date_key not in trades:
                    trades[date_key] = {'pnl': 0.0, 'trades': []}

                trades[date_key]['pnl'] = round(trades[date_key]['pnl'] + profit, 2)
                trades[date_key]['trades'].append({
                    'time': dt.strftime('%H:%M'),
                    'type': trade_type,
                    'lot': lot,
                    'profit': profit,
                    'symbol': symbol
                })

                save_stored_trades(trades)
                print(f"[+] Trade Logged: {symbol} {trade_type} {lot} Lot -> PnL: {profit:+.2f} ({date_key})")

                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({'status': 'ok', 'logged_date': date_key}).encode('utf-8'))
                return
            except Exception as e:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'status': 'error', 'message': str(e)}).encode('utf-8'))
                return

        elif parsed.path == '/api/batch_trades':
            try:
                content_len = int(self.headers.get('Content-Length', 0))
                body = self.rfile.read(content_len)
                data = json.loads(body.decode('utf-8'))

                new_trades = data.get('trades', [])
                account = data.get('account', 'MT5')
                trades = load_stored_trades()
                added_count = 0

                for t in new_trades:
                    t_time = t.get('time', '')
                    dt = datetime.fromisoformat(t_time.replace('Z', '+00:00'))
                    date_key = dt.strftime('%Y-%m-%d')
                    if date_key not in trades:
                        trades[date_key] = {'pnl': 0.0, 'trades': []}

                    # Check duplicate
                    exists = any(x.get('time') == dt.strftime('%H:%M') and x.get('profit') == t.get('profit') for x in trades[date_key]['trades'])
                    if not exists:
                        trades[date_key]['pnl'] = round(trades[date_key]['pnl'] + t.get('profit', 0.0), 2)
                        trades[date_key]['trades'].append({
                            'time': dt.strftime('%H:%M'),
                            'symbol': t.get('symbol', 'XAUUSD'),
                            'type': t.get('type', 'BUY'),
                            'lot': t.get('lot', 0.01),
                            'profit': t.get('profit', 0.0)
                        })
                        added_count += 1

                save_stored_trades(trades)
                print(f"[✔] Batch Trades Received from MT5 ({account}): +{added_count} deals added.")

                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({'status': 'ok', 'added': added_count}).encode('utf-8'))
                return
            except Exception as e:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'status': 'error', 'message': str(e)}).encode('utf-8'))
                return

        elif parsed.path == '/api/upload_report':
            try:
                content_len = int(self.headers.get('Content-Length', 0))
                body = self.rfile.read(content_len)
                # Decode text
                content = None
                for enc in ['utf-8', 'utf-16', 'latin-1']:
                    try:
                        content = body.decode(enc)
                        break
                    except UnicodeDecodeError:
                        continue
                if not content:
                    raise ValueError("Format file tidak didukung")

                parsed_report = parse_mt5_html_content(content)
                trades = load_stored_trades()
                added_days = 0
                total_trades = 0

                for date_key, dval in parsed_report.items():
                    if date_key not in trades:
                        trades[date_key] = dval
                        added_days += 1
                        total_trades += len(dval['trades'])
                    else:
                        for tr in dval['trades']:
                            exists = any(x.get('time') == tr['time'] and x.get('profit') == tr['profit'] for x in trades[date_key]['trades'])
                            if not exists:
                                trades[date_key]['pnl'] = round(trades[date_key]['pnl'] + tr['profit'], 2)
                                trades[date_key]['trades'].append(tr)
                                total_trades += 1

                save_stored_trades(trades)
                print(f"[✔] Upload Laporan MT5 Berhasil: {len(parsed_report)} hari, {total_trades} transaksi diimpor.")

                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'status': 'ok',
                    'days_parsed': len(parsed_report),
                    'total_trades': total_trades
                }).encode('utf-8'))
                return
            except Exception as e:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'status': 'error', 'message': str(e)}).encode('utf-8'))
                return
                print(f"[+] Trade Logged: {symbol} {trade_type} {lot} Lot -> PnL: {profit:+.2f} ({date_key})")

                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({'status': 'ok', 'logged_date': date_key}).encode('utf-8'))
                return
            except Exception as e:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'status': 'error', 'message': str(e)}).encode('utf-8'))
                return

        self.send_response(404)
        self.end_headers()

def main():
    parser = argparse.ArgumentParser(description="Exness XAUUSD PnL Calendar Web App")
    parser.add_argument('-p', '--port', type=int, default=3000, help="Web Port (default: 3000)")
    args = parser.parse_args()

    ThreadingHTTPServer.allow_reuse_address = True
    server = ThreadingHTTPServer(('0.0.0.0', args.port), CalendarHTTPHandler)

    banner = f"""
================================================================
  🏆 UNIVERSAL TRADING PNL CALENDAR JOURNAL (DARK-MODE) 🏆
================================================================
  [✔] Web Dashboard URL : http://localhost:{args.port}
  [✔] Local Network URL : http://127.0.0.1:{args.port}
  [✔] Real-Time Webhook : http://localhost:{args.port}/api/trade
  [✔] Broker Support    : Universal MT4 & MT5 (Exness, XM, IC Markets, dll)
  [✔] Tampilan          : Persis Screenshot (Desain Dark Minimalis)
================================================================
(Tekan CTRL+C untuk berhenti)
    """
    print(banner)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[*] Server dihentikan.")
        server.server_close()

if __name__ == '__main__':
    main()
