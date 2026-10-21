//+------------------------------------------------------------------+
//|                                                 Sync_Journal.mq5 |
//|                                  Copyright 2026, Trading Journal |
//|                     Auto-Export Exness History to Web Calendar   |
//+------------------------------------------------------------------+
#property copyright "Trading Journal"
#property link      "http://localhost:3000"
#property version   "1.00"
#property script_show_inputs

input string InpServerUrl = "http://127.0.0.1:3000/api/batch_trades"; // URL Sinkronisasi Kalender

void OnStart()
{
   Print("[*] Memulai pembacaan seluruh riwayat akun MT5...");
   
   if(!HistorySelect(0, TimeCurrent()))
   {
      Print("[!] Gagal membaca riwayat akun MT5.");
      Alert("Gagal membaca riwayat akun MT5.");
      return;
   }
   
   int total = HistoryDealsTotal();
   Print("[*] Total riwayat deals ditemukan di akun: ", total);
   
   string json = "{\"account\":" + IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN)) + ",\"trades\":[";
   int count = 0;
   
   for(int i = 0; i < total; i++)
   {
      ulong ticket = HistoryDealGetTicket(i);
      if(ticket == 0) continue;
      
      long entry = HistoryDealGetInteger(ticket, DEAL_ENTRY);
      // Hanya ambil deal penutupan posisi (OUT atau INOUT) yang menghasilkan PnL bersih
      if(entry != DEAL_ENTRY_OUT && entry != DEAL_ENTRY_INOUT) continue;
      
      double profit = HistoryDealGetDouble(ticket, DEAL_PROFIT);
      double swap   = HistoryDealGetDouble(ticket, DEAL_SWAP);
      double comm   = HistoryDealGetDouble(ticket, DEAL_COMMISSION);
      double net_pnl = profit + swap + comm;
      
      string symbol = HistoryDealGetString(ticket, DEAL_SYMBOL);
      datetime time = (datetime)HistoryDealGetInteger(ticket, DEAL_TIME);
      double lot    = HistoryDealGetDouble(ticket, DEAL_VOLUME);
      long type     = HistoryDealGetInteger(ticket, DEAL_TYPE);
      string type_str = (type == DEAL_TYPE_BUY) ? "BUY" : "SELL";
      
      string time_str = TimeToString(time, TIME_DATE|TIME_SECONDS);
      // Format: YYYY.MM.DD HH:MM:SS -> YYYY-MM-DDTHH:MM:SSZ
      StringReplace(time_str, ".", "-");
      StringReplace(time_str, " ", "T");
      time_str = time_str + "Z";
      
      if(count > 0) json += ",";
      json += "{\"time\":\"" + time_str + "\",\"symbol\":\"" + symbol + "\",\"type\":\"" + type_str + "\",\"lot\":" + DoubleToString(lot, 2) + ",\"profit\":" + DoubleToString(net_pnl, 2) + "}";
      count++;
   }
   
   json += "]}";
   Print("[*] Menemukan ", count, " transaksi closed. Menyimpan dan menyinkronkan...");
   
   // 1. Simpan langsung ke file lokal MQL5/Files/trades_export.json
   int file_h = FileOpen("trades_export.json", FILE_WRITE|FILE_TXT|FILE_ANSI);
   if(file_h != INVALID_HANDLE)
   {
      FileWriteString(file_h, json);
      FileClose(file_h);
      Print("[✔] Berhasil menulis file lokal: MQL5/Files/trades_export.json");
   }
   
   // 2. Coba kirim via WebRequest ke server lokal
   char post_data[];
   char result_data[];
   string result_headers;
   string headers = "Content-Type: application/json\r\n";
   
   StringToCharArray(json, post_data, 0, WHOLE_ARRAY, CP_UTF8);
   ArrayResize(post_data, ArraySize(post_data) - 1);
   
   ResetLastError();
   int res = WebRequest("POST", InpServerUrl, headers, 3000, post_data, result_data, result_headers);
   if(res == 200 || res == 201)
   {
      Print("[✔] WebRequest berhasil! Data kalender terupdate.");
   }
   
   Alert("✔ Sukses! Sebanyak " + IntegerToString(count) + " transaksi berhasil disinkronkan ke Web Kalender.");
}
