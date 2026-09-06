/* ---------- Shared content builders ---------- */
function subtabFor(screen){
  if(screen!=='usaha' || !state.hasBusiness) return '';
  const subs = [['dashboard','Dashboard'],['kas','Kas'],['stok','Stok'],['invoice','Invoice'],['pengaturan','Pengaturan']];
  return `<div class="subtabbar nav-blur">${subs.map(([id,label])=>
    `<span class="subtab ${state.subtab===id?'active':''}" data-action="set-subtab" data-value="${id}">${label}</span>`
  ).join('')}</div>`;
}
function reportPickerHTML(){
  if(!state.reportPicker) return '';
  const options = REPORT_CATEGORIES.map((c,i)=>`
    <div class="report-option pressable" style="animation-delay:${i*0.06}s" data-action="select-report-category" data-value="${c.id}">
      <span class="report-option-label">${c.label}</span>
      <div class="report-option-bubble" style="background:${c.color};width:16px;height:16px;border-radius:50%"></div>
    </div>`).join('');
  return `<div class="report-picker-scrim" data-action="toggle-report-picker"></div>
    <div class="report-picker">${options}</div>`;
}
function contentMap(){
  if(state.isPickingBizLocation){
    return `<div style="position:absolute;inset:0;pointer-events:none;z-index:10">
      <div style="position:absolute;top:16px;left:16px;right:16px;z-index:1000;background:rgba(255,255,255,0.96);backdrop-filter:blur(10px);border:1px solid var(--border);border-radius:14px;padding:12px 16px;display:flex;align-items:center;justify-content:space-between;box-shadow:0 8px 24px rgba(0,0,0,0.12);pointer-events:auto">
        <div style="display:flex;align-items:center;gap:12px">
          <div style="width:36px;height:36px;border-radius:10px;background:rgba(0,122,255,0.12);display:flex;align-items:center;justify-content:center;color:var(--blue);flex-shrink:0">
            <span style="width:20px;height:20px;display:inline-flex">${ICONS.store}</span>
          </div>
          <div>
            <div style="font-weight:700;font-size:13px;color:var(--text-1)">Tentukan Lokasi Usaha</div>
            <div style="font-size:11px;color:var(--text-3)">Ketuk titik warung/toko Anda di peta</div>
          </div>
        </div>
        <div class="btn btn-ghost pressable" data-action="cancel-picking-biz" style="height:32px;padding:0 12px;font-size:12px;font-weight:600">Batal</div>
      </div>
    </div>`;
  }
  if(state.isPickingLocation){
    return `<div style="position:absolute;inset:0;pointer-events:none;z-index:10">
      <div style="position:absolute;top:16px;left:16px;right:16px;z-index:1000;background:rgba(255,255,255,0.96);backdrop-filter:blur(10px);border:1px solid var(--border);border-radius:14px;padding:12px 16px;display:flex;align-items:center;justify-content:space-between;box-shadow:0 8px 24px rgba(0,0,0,0.12);pointer-events:auto">
        <div style="display:flex;align-items:center;gap:12px">
          <div style="width:36px;height:36px;border-radius:10px;background:rgba(255,59,48,0.12);display:flex;align-items:center;justify-content:center;color:var(--red);flex-shrink:0">
            <span style="width:20px;height:20px;display:inline-flex">${ICONS.pin}</span>
          </div>
          <div>
            <div style="font-weight:700;font-size:13px;color:var(--text-1)">Tentukan Titik Masalah</div>
            <div style="font-size:11px;color:var(--text-3)">Ketuk jalan atau titik masalah pada peta</div>
          </div>
        </div>
        <div class="btn btn-ghost pressable" data-action="cancel-picking-report" style="height:32px;padding:0 12px;font-size:12px;font-weight:600">Batal</div>
      </div>
    </div>`;
  }
  return `<div style="position:absolute;inset:0;pointer-events:none;z-index:10">
    <div style="pointer-events:auto">${reportPickerHTML()}</div>
    <div class="fab pressable ${state.reportPicker?'open':''}" data-action="toggle-report-picker" style="pointer-events:auto">${ICONS.plus}</div>
  </div>`;
}
function cashChartHTML(txs, period){
  let labels = [];
  let incomeData = [];
  let expenseData = [];

  const now = new Date();
  if(period === 'bulanan'){
    const monthNames = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
    for(let i = 5; i >= 0; i--){
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      labels.push(monthNames[d.getMonth()]);
      const m = d.getMonth();
      const y = d.getFullYear();
      const mIncome = txs.filter(t => {
        const td = t.createdAt?.toDate ? t.createdAt.toDate() : new Date();
        return td.getMonth() === m && td.getFullYear() === y && (t.type === 'income' || !t.type);
      }).reduce((s,t) => s + (Number(t.amount)||0), 0);
      const mExpense = txs.filter(t => {
        const td = t.createdAt?.toDate ? t.createdAt.toDate() : new Date();
        return td.getMonth() === m && td.getFullYear() === y && t.type === 'expense';
      }).reduce((s,t) => s + (Number(t.amount)||0), 0);
      incomeData.push(mIncome);
      expenseData.push(mExpense);
    }
  } else if(period === 'tahunan'){
    const curYear = now.getFullYear();
    labels = [String(curYear - 2), String(curYear - 1), String(curYear)];
    labels.forEach(yrStr => {
      const yr = parseInt(yrStr, 10);
      const yIncome = txs.filter(t => {
        const td = t.createdAt?.toDate ? t.createdAt.toDate() : new Date();
        return td.getFullYear() === yr && (t.type === 'income' || !t.type);
      }).reduce((s,t) => s + (Number(t.amount)||0), 0);
      const yExpense = txs.filter(t => {
        const td = t.createdAt?.toDate ? t.createdAt.toDate() : new Date();
        return td.getFullYear() === yr && t.type === 'expense';
      }).reduce((s,t) => s + (Number(t.amount)||0), 0);
      incomeData.push(yIncome);
      expenseData.push(yExpense);
    });
  } else {
    // 'harian' - last 7 days
    const dayNames = ['Min','Sen','Sel','Rab','Kam','Jum','Sab'];
    for(let i = 6; i >= 0; i--){
      const d = new Date(now.getTime() - i * 86400000);
      labels.push(dayNames[d.getDay()]);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      const dayEnd = dayStart + 86400000;
      const dIncome = txs.filter(t => {
        const tTime = t.createdAt?.toDate ? t.createdAt.toDate().getTime() : now.getTime();
        return tTime >= dayStart && tTime < dayEnd && (t.type === 'income' || !t.type);
      }).reduce((s,t) => s + (Number(t.amount)||0), 0);
      const dExpense = txs.filter(t => {
        const tTime = t.createdAt?.toDate ? t.createdAt.toDate().getTime() : now.getTime();
        return tTime >= dayStart && tTime < dayEnd && t.type === 'expense';
      }).reduce((s,t) => s + (Number(t.amount)||0), 0);
      incomeData.push(dIncome);
      expenseData.push(dExpense);
    }
  }

  const totalInc = txs.filter(t => t.type === 'income' || !t.type).reduce((s,t) => s + (Number(t.amount)||0), 0);
  const totalExp = txs.filter(t => t.type === 'expense').reduce((s,t) => s + (Number(t.amount)||0), 0);
  const sumPlotInc = incomeData.reduce((a,b)=>a+b, 0);
  if(totalInc > 0 && sumPlotInc === 0){
    incomeData[incomeData.length - 1] = totalInc;
  }
  const sumPlotExp = expenseData.reduce((a,b)=>a+b, 0);
  if(totalExp > 0 && sumPlotExp === 0){
    expenseData[expenseData.length - 1] = totalExp;
  }

  const maxVal = Math.max(...incomeData, ...expenseData, 50000);

  return `
  <div class="card" style="padding:14px;margin-bottom:10px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
      <span style="font-size:13px;font-weight:700">Grafik Arus Kas Usaha</span>
      <div style="display:flex;align-items:center;gap:8px;font-size:10px">
        <span style="color:#28A745;font-weight:600">● Masuk</span>
        <span style="color:#FF3B30;font-weight:600">● Keluar</span>
      </div>
    </div>
    <div class="chart-period-tabs">
      <div class="chart-period-tab ${period==='harian'?'active':''}" data-action="set-chart-period" data-value="harian">Harian</div>
      <div class="chart-period-tab ${period==='bulanan'?'active':''}" data-action="set-chart-period" data-value="bulanan">Bulanan</div>
      <div class="chart-period-tab ${period==='tahunan'?'active':''}" data-action="set-chart-period" data-value="tahunan">Tahunan</div>
    </div>
    <div class="chart-bar-wrap">
      ${labels.map((lbl, idx) => {
        const inc = incomeData[idx] || 0;
        const exp = expenseData[idx] || 0;
        const incH = Math.max(3, Math.round((inc / maxVal) * 95));
        const expH = Math.max(3, Math.round((exp / maxVal) * 95));
        const incTitle = inc > 0 ? '+Rp' + inc.toLocaleString('id-ID') : 'Rp0';
        const expTitle = exp > 0 ? '-Rp' + exp.toLocaleString('id-ID') : 'Rp0';
        return `
        <div class="chart-col">
          <div style="display:flex;align-items:flex-end;gap:3px;height:100%;width:100%;justify-content:center">
            <div class="chart-bar chart-bar-income" style="height:${incH}%" title="Masuk: ${incTitle}"></div>
            <div class="chart-bar chart-bar-expense" style="height:${expH}%" title="Keluar: ${expTitle}"></div>
          </div>
          <span class="chart-label">${lbl}</span>
        </div>`;
      }).join('')}
    </div>
    <div style="display:flex;justify-content:space-between;font-size:10.5px;color:var(--text-3);margin-top:8px">
      <span>Periode: ${period.toUpperCase()}</span>
      <span>Tertinggi: Rp${maxVal.toLocaleString('id-ID')}</span>
    </div>
  </div>`;
}

function stockItemsOnlyHTML(products, search, filter){
  let filtered = products.filter(p => {
    if(search && !p.name.toLowerCase().includes(search)) return false;
    if(filter === 'low') return Number(p.qty) < 5;
    if(filter === 'safe') return Number(p.qty) >= 5;
    return true;
  });

  if(filtered.length === 0){
    return `<div style="padding:24px 12px;text-align:center">
      <p style="font-size:12px;color:var(--text-3)">${search ? 'Tidak ada produk yang cocok dengan pencarian.' : 'Belum ada produk terdaftar.'}</p>
    </div>`;
  }

  return filtered.map(p => {
    const q = Number(p.qty) || 0;
    const statusChip = q === 0 ? '<span class="chip chip-red" style="font-size:10px;padding:2px 7px">Habis</span>' : (q < 5 ? '<span class="chip chip-amber" style="font-size:10px;padding:2px 7px">Menipis</span>' : '<span class="chip chip-green" style="font-size:10px;padding:2px 7px">Aman</span>');
    return `
    <div class="card" style="padding:12px;margin-bottom:8px;display:flex;align-items:center;justify-content:space-between">
      <div>
        <div style="font-size:13px;font-weight:600;color:var(--text-1);margin-bottom:2px">${p.name}</div>
        <div style="display:flex;align-items:center;gap:6px">
          ${statusChip}
          <span style="font-size:11px;color:var(--text-3)">Stok saat ini</span>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:10px">
        <div class="stock-stepper">
          <div class="stock-step-btn pressable" data-action="step-product-qty" data-id="${p.id}" data-delta="-1" title="Kurang 1">−</div>
          <span class="stock-val">${q}</span>
          <div class="stock-step-btn pressable" data-action="step-product-qty" data-id="${p.id}" data-delta="1" title="Tambah 1">+</div>
        </div>
        <span class="icon-btn pressable" style="width:28px;height:28px;color:var(--text-3)" data-action="delete-produk" data-value="${p.id}" title="Hapus produk">${ICONS.close}</span>
      </div>
    </div>`;
  }).join('');
}

function updateStockListContainer(){
  const c = document.getElementById('stockListContainer');
  if(c){
    const s = (state.stockSearch || '').toLowerCase().trim();
    const f = state.stockFilter || 'all';
    c.innerHTML = stockItemsOnlyHTML(state.products || [], s, f);
  }
}

function stockSectionHTML(){
  if(!state.stokOn){
    return `<div style="padding:24px 16px;text-align:center"><p style="font-size:12px;color:var(--text-2);line-height:1.5">Modul Stok saat ini dinonaktifkan.<br>Kamu dapat mengaktifkannya di tab Pengaturan Usaha.</p></div>`;
  }
  const products = state.products || [];
  const search = (state.stockSearch || '').toLowerCase().trim();
  const filter = state.stockFilter || 'all';

  const totalUnits = products.reduce((s, p) => s + (Number(p.qty) || 0), 0);
  const lowCount = products.filter(p => Number(p.qty) < 5).length;

  return `
  <div style="padding:12px">
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:12px">
      <div class="metric" style="padding:8px"><div class="label" style="font-size:10px">Total Varian</div><div class="value" style="font-size:15px">${products.length}</div></div>
      <div class="metric" style="padding:8px"><div class="label" style="font-size:10px">Total Unit</div><div class="value" style="font-size:15px">${totalUnits}</div></div>
      <div class="metric" style="padding:8px"><div class="label" style="font-size:10px">Menipis</div><div class="value" style="font-size:15px;color:${lowCount>0?'var(--red)':'var(--green)'}">${lowCount}</div></div>
    </div>

    <input id="stockSearchInput" class="input-box" style="height:36px;font-size:12px;margin-bottom:8px;padding:0 12px" placeholder="Cari nama produk..." value="${(state.stockSearch||'').replace(/"/g,'&quot;')}" oninput="state.stockSearch=this.value; updateStockListContainer();">

    <div style="display:flex;gap:5px;margin-bottom:12px;overflow-x:auto">
      <span class="quick-chip ${filter==='all'?'selected':''}" data-action="set-stock-filter" data-value="all">Semua (${products.length})</span>
      <span class="quick-chip ${filter==='low'?'selected':''}" data-action="set-stock-filter" data-value="low">Menipis (${lowCount})</span>
      <span class="quick-chip ${filter==='safe'?'selected':''}" data-action="set-stock-filter" data-value="safe">Aman (${products.length - lowCount})</span>
    </div>

    <div id="stockListContainer">
      ${stockItemsOnlyHTML(products, search, filter)}
    </div>

    <div class="btn btn-primary pressable" style="margin-top:12px" data-action="open-produk-tambah">+ Tambah Produk Baru</div>
  </div>`;
}

function invoiceSectionHTML(){
  if(!state.strukOn){
    return `<div style="padding:24px 16px;text-align:center"><p style="font-size:12px;color:var(--text-2);line-height:1.5">Modul Struk Digital saat ini dinonaktifkan.<br>Kamu dapat mengaktifkannya di tab Pengaturan Usaha.</p></div>`;
  }
  const invoices = state.invoices || [];
  const totalNominal = invoices.reduce((s, i) => s + (Number(i.amount) || 0), 0);

  return `
  <div style="padding:12px">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">
      <div class="metric"><div class="label">Total Invoice</div><div class="value">${invoices.length}</div></div>
      <div class="metric"><div class="label">Total Nilai</div><div class="value">Rp${totalNominal.toLocaleString('id-ID')}</div></div>
    </div>

    ${invoices.length === 0 ? `
      <div style="padding:28px 12px;text-align:center">
        <p style="font-size:12px;color:var(--text-2);margin:0 0 12px">Belum ada invoice dibuat.</p>
        <div class="btn btn-primary pressable" style="max-width:200px;margin:0 auto" data-action="open-invoice-tambah">+ Buat Invoice Baru</div>
      </div>
    ` : `
      <p style="font-size:11px;color:var(--text-3);margin:0 0 8px">Ketuk baris invoice untuk membuka Struk Digital & cetak / bagikan</p>
      ${invoices.map(inv => {
        const cls = inv.status === 'Lunas' ? 'chip-green' : 'chip-amber';
        return `
        <div class="card pressable" style="padding:12px;margin-bottom:8px;display:flex;align-items:center;justify-content:space-between" data-action="view-invoice" data-id="${inv.id}">
          <div>
            <div style="font-size:13px;font-weight:600;color:var(--text-1)">${inv.no || 'INV'} · ${inv.client || 'Klien'}</div>
            <div style="font-size:11px;color:var(--text-3);margin-top:2px">Rp${Number(inv.amount||0).toLocaleString('id-ID')}</div>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <span class="chip ${cls}">${inv.status || 'Lunas'}</span>
            <span style="font-size:13px;color:var(--text-3)">›</span>
          </div>
        </div>`;
      }).join('')}
      <div class="btn btn-primary pressable" style="margin-top:12px" data-action="open-invoice-tambah">+ Buat Invoice Baru</div>
    `}
  </div>`;
}

function contentInvoiceDetail(){
  const inv = state.selectedInvoice || (state.invoices && state.invoices[0]) || { no:'INV-001', client:'Pelanggan', amount:0, status:'Lunas' };
  const dateStr = inv.createdAt?.toDate ? inv.createdAt.toDate().toLocaleString('id-ID', {day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit'}) : new Date().toLocaleString('id-ID', {day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit'});

  return `
  <div style="padding:14px;max-width:380px;margin:0 auto">
    <div class="digital-receipt" id="printableReceipt">
      <div class="receipt-title">${state.businessName || 'Usaha Lokal Warga'}</div>
      <div class="receipt-sub">${state.businessCategory || 'UMKM Binaan'} · Kec. ${state.kecamatan || 'KoneKA'}</div>
      <div class="receipt-divider"></div>
      <div class="receipt-row"><span>No. Struk</span><b>${inv.no || 'INV-001'}</b></div>
      <div class="receipt-row"><span>Waktu</span><span>${dateStr}</span></div>
      <div class="receipt-row"><span>Pelanggan</span><b>${inv.client || 'Pelanggan Umum'}</b></div>
      <div class="receipt-row"><span>Status</span><span class="chip ${inv.status==='Lunas'?'chip-green':'chip-amber'}" style="padding:2px 8px;font-size:10px">${inv.status || 'Lunas'}</span></div>
      <div class="receipt-divider"></div>
      <div class="receipt-row" style="font-size:11px;color:#6B7280;font-weight:600">
        <span>RINCIAN TRANSAKSI</span><span>TOTAL</span>
      </div>
      <div class="receipt-row">
        <span>Pesanan / Pembelian</span>
        <span>Rp${Number(inv.amount||0).toLocaleString('id-ID')}</span>
      </div>
      <div class="receipt-divider"></div>
      <div class="receipt-total">
        <span>TOTAL BAYAR</span>
        <span style="color:var(--blue)">Rp${Number(inv.amount||0).toLocaleString('id-ID')}</span>
      </div>
      <div class="barcode-box">
        ${[3,2,1,4,2,3,1,2,4,2,3,1,4,2,1,3,2,4,2,1,3,2].map(w => `<div class="barcode-bar" style="width:${w}px"></div>`).join('')}
      </div>
      <p style="text-align:center;font-size:9px;color:#9CA3AF;margin:0">TERIMA KASIH — STRUK DIGITAL RESMI KONEKA</p>
    </div>

    <div style="display:flex;gap:8px;margin-top:14px">
      <div class="btn btn-primary pressable" style="flex:1" data-action="print-receipt">Cetak / Unduh</div>
      <div class="btn btn-ghost pressable" style="flex:1" data-action="share-receipt" data-id="${inv.id}">Salin ke WA</div>
    </div>
    <div class="btn btn-ghost pressable" style="margin-top:8px" data-action="close-pushed">Kembali</div>
  </div>`;
}

function contentUsaha(){
  if(state.isLoadingUsaha){
    return renderUsahaSkeletonHTML();
  }
  if(!state.hasBusiness){
    return `<div style="padding:22px 16px;text-align:center">
      <div style="margin:10px 0 10px;display:flex;justify-content:center"><span style="width:34px;height:34px;display:inline-flex;color:var(--text-2)">${ICONS.store}</span></div>
      <p style="font-weight:600;font-size:14.5px;margin:0 0 6px">Belum ada usaha terdaftar</p>
      <p style="font-size:12px;color:var(--text-2);margin:0 0 18px;line-height:1.5;max-width:280px;margin-left:auto;margin-right:auto">Daftarkan usahamu supaya muncul di Direktori UMKM &amp; warga sekitar bisa menemukanmu di peta.</p>
      <div class="btn btn-primary pressable" style="max-width:240px;margin:0 auto" data-action="open-usaha-daftar">Daftarkan Usaha Kamu</div>
    </div>`;
  }
  if(state.subtab==='dashboard'){
    const txs = state._transactions || [];
    const totalIncome = txs.filter(t => t.type === 'income' || !t.type).reduce((s, t) => s + (Number(t.amount) || 0), 0);
    const totalExpense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + (Number(t.amount) || 0), 0);
    const netCash = totalIncome - totalExpense;
    const count = txs.length;
    const lowStock = (state.products || []).filter(p => Number(p.qty) < 5);

    return `
    <div style="padding:12px">
      <div style="margin-bottom:12px;display:flex;align-items:center;justify-content:space-between">
        <div>
          <b style="font-size:15px;color:var(--text-1)">${state.businessName}</b>
          <span style="font-size:11px;color:var(--text-2);margin-left:6px">● ${state.businessCategory || 'UMKM'}</span>
        </div>
        <span class="chip chip-green">Aktif</span>
      </div>

      <!-- Financial Overview: Saldo Bersih, Pemasukan, Pengeluaran, Total Tx -->
      <div class="card" style="padding:14px;margin-bottom:10px;background:linear-gradient(135deg, rgba(0,122,255,0.06), rgba(52,199,89,0.06));border:1px solid rgba(0,122,255,0.12)">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px">
          <span style="font-size:12px;font-weight:600;color:var(--text-2)">Saldo Kas Bersih</span>
          <span class="chip ${netCash>=0?'chip-green':'chip-red'}" style="font-size:10.5px">
            ${netCash >= 0 ? 'Surplus' : 'Defisit'}
          </span>
        </div>
        <div style="font-size:24px;font-weight:800;letter-spacing:-0.02em;color:${netCash>=0?'#1F8A3D':'#DC2626'};margin-bottom:8px">
          ${netCash < 0 ? '-' : ''}Rp${Math.abs(netCash).toLocaleString('id-ID')}
        </div>
        <div style="display:flex;gap:12px;font-size:11.5px">
          <span style="color:#28A745;font-weight:600">▲ Masuk: Rp${totalIncome.toLocaleString('id-ID')}</span>
          <span style="color:#DC2626;font-weight:600">▼ Keluar: Rp${totalExpense.toLocaleString('id-ID')}</span>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">
        <div class="metric">
          <div class="label">Total Pemasukan (Omzet)</div>
          <div class="value" style="color:#28A745">+Rp${totalIncome.toLocaleString('id-ID')}</div>
        </div>
        <div class="metric">
          <div class="label">Total Transaksi</div>
          <div class="value">${count} Transaksi</div>
        </div>
      </div>

      ${state.stokOn ? (
        lowStock.length > 0
          ? `<div class="card pressable" style="margin-bottom:10px;display:flex;align-items:center;gap:6px;font-size:12px;color:var(--red)" data-action="set-subtab" data-value="stok">Perhatian: ${lowStock[0].name} sisa ${lowStock[0].qty} — cek stok</div>`
          : `<div class="card pressable" style="margin-bottom:10px;display:flex;align-items:center;gap:6px;font-size:12px;color:var(--green)" data-action="set-subtab" data-value="stok">Semua stok aman (${(state.products||[]).length} produk)</div>`
      ) : ''}

      <!-- Catatan Kas Terbaru -->
      <div class="card" style="padding:12px;margin-bottom:10px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-size:13px;font-weight:700">Catatan Kas Terbaru</span>
          <span class="pressable" style="font-size:11px;color:var(--blue);font-weight:600" data-action="open-transaksi-tambah">+ Catat</span>
        </div>
        ${txs.length === 0 ? `<p style="font-size:11.5px;color:var(--text-3);margin:6px 0">Belum ada catatan kas.</p>` : `
          ${txs.slice(0, 4).map(t => `<div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;padding:7px 0;border-bottom:1px solid rgba(0,0,0,0.05)">
            <div>
              <div style="font-weight:500;color:var(--text-1)">${t.description}</div>
              <div style="font-size:10px;color:var(--text-3)">${t.createdAt ? _timeAgo(t.createdAt) : 'Baru saja'}</div>
            </div>
            <span style="font-weight:700;color:${t.type==='expense'?'#DC2626':'#28A745'}">${t.type==='expense'?'-':'+'}Rp${Number(t.amount||0).toLocaleString('id-ID')}</span>
          </div>`).join('')}
        `}
      </div>

      <!-- Chart Harian, Bulanan, Tahunan (Issue #3) -->
      ${cashChartHTML(txs, state.chartPeriod || 'harian')}
    </div>`;
  }
  if(state.subtab==='kas'){
    const txs = state._transactions || [];
    const totalIncome = txs.filter(t => t.type === 'income' || !t.type).reduce((s, t) => s + (Number(t.amount) || 0), 0);
    const totalExpense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + (Number(t.amount) || 0), 0);

    return `
    <div style="padding:12px">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">
        <div class="metric"><div class="label">Kas Masuk</div><div class="value" style="color:#28A745">+Rp${totalIncome.toLocaleString('id-ID')}</div></div>
        <div class="metric"><div class="label">Kas Keluar</div><div class="value" style="color:#DC2626">-Rp${totalExpense.toLocaleString('id-ID')}</div></div>
      </div>
      ${txs.length === 0 ? `
        <div style="padding:28px 12px;text-align:center">
          <p style="font-size:12px;color:var(--text-2);margin:0 0 12px">Belum ada transaksi tercatat untuk usaha ini.</p>
          <div class="btn btn-primary pressable" style="max-width:180px;margin:0 auto;font-size:12px" data-action="open-transaksi-tambah">+ Catat Transaksi</div>
        </div>
      ` : `
        ${txs.map(t => {
          const isExp = t.type === 'expense';
          return `<div class="list-row">
            <div>
              <div style="font-size:12.5px;font-weight:500">${t.description}</div>
              <div style="font-size:10px;color:var(--text-3)">${t.createdAt ? _timeAgo(t.createdAt) : 'Baru saja'}</div>
            </div>
            <span class="chip ${isExp?'chip-red':'chip-green'}">${isExp?'-':'+'}Rp${Number(t.amount||0).toLocaleString('id-ID')}</span>
          </div>`;
        }).join('')}
        <div class="btn btn-primary pressable" style="margin-top:12px" data-action="open-transaksi-tambah">+ Catat Transaksi</div>
      `}
    </div>`;
  }
  if(state.subtab==='stok') return stockSectionHTML();
  if(state.subtab==='invoice') return invoiceSectionHTML();
  return `
    <div>
      <div class="list-row pressable" data-action="open-info-usaha"><span class="left">${ICONS.bag}Info usaha</span><span>${ICONS.chev}</span></div>
      <div class="list-row pressable" data-action="open-jam-operasional"><span class="left">${ICONS.list}Jam operasional</span><span>${ICONS.chev}</span></div>
      <div class="list-row pressable" data-action="open-metode-pembayaran"><span class="left">${ICONS.map}Metode pembayaran</span><span>${ICONS.chev}</span></div>
      <div class="settings-row"><span class="left"><span style="width:14px;height:14px;display:inline-flex">${ICONS.package}</span> Modul Stok <span style="color:var(--text-3);font-weight:400">(opsional)</span></span><div class="toggle-switch ${state.stokOn?'on':''} pressable" data-action="toggle-stok"><div class="knob"></div></div></div>
      <div class="settings-row"><span class="left"><span style="width:14px;height:14px;display:inline-flex">${ICONS.receipt}</span> Struk Digital <span style="color:var(--text-3);font-weight:400">(opsional)</span></span><div class="toggle-switch ${state.strukOn?'on':''} pressable" data-action="toggle-struk"><div class="knob"></div></div></div>
    </div>`;
}
function contentJamOperasional(){
  return `<div style="padding:14px">
    <p style="font-size:11px;color:var(--text-2);margin:0 0 14px;line-height:1.5">Atur jam buka &amp; tutup usahamu per hari — warga akan lihat status Buka/Tutup langsung di halaman usahamu.</p>
    ${DAYS.map(d=>{
      const h = state.businessHours[d];
      return `<div class="card" style="margin-bottom:8px;padding:10px 12px">
        <div style="display:flex;justify-content:space-between;align-items:center;${h.open?'margin-bottom:8px':''}">
          <span style="font-size:12.5px;font-weight:600">${d}</span>
          <div style="display:flex;align-items:center;gap:8px">
            <span style="font-size:10.5px;color:${h.open?'var(--green)':'var(--text-3)'}">${h.open?'Buka':'Tutup'}</span>
            <div class="toggle-switch ${h.open?'on':''} pressable" data-action="toggle-day-open" data-value="${d}"><div class="knob"></div></div>
          </div>
        </div>
        ${h.open?`<div style="display:flex;gap:8px;align-items:center">
          <input type="time" class="field-input" style="margin:0;padding:7px 10px;font-size:12px" value="${h.from}" oninput="state.businessHours['${d}'].from=this.value">
          <span style="font-size:11px;color:var(--text-3);flex-shrink:0">s/d</span>
          <input type="time" class="field-input" style="margin:0;padding:7px 10px;font-size:12px" value="${h.to}" oninput="state.businessHours['${d}'].to=this.value">
        </div>`:''}
      </div>`;
    }).join('')}
    <div class="btn btn-ghost pressable" style="font-size:12px;margin:4px 0 18px" data-action="copy-hours-all">Samakan semua hari ke jam Senin</div>

    <p style="font-size:11px;font-weight:600;margin:0 0 8px">Tutup Sementara (jangka waktu tanggal)</p>
    <div class="card" style="padding:12px">
      <div class="settings-row" style="padding:0 0 ${state.holidayActive?'10px':'0'} 0">
        <span class="left" style="font-size:12px">Aktifkan tanggal libur</span>
        <div class="toggle-switch ${state.holidayActive?'on':''} pressable" data-action="toggle-holiday"><div class="knob"></div></div>
      </div>
      ${state.holidayActive?`
      <label class="field-label" style="margin-top:0">Tutup mulai tanggal</label>
      <input type="date" class="field-input" value="${state.holidayFrom}" oninput="state.holidayFrom=this.value">
      <label class="field-label">Sampai tanggal</label>
      <input type="date" class="field-input" value="${state.holidayTo}" oninput="state.holidayTo=this.value">
      <label class="field-label">Keterangan (opsional)</label>
      <textarea class="input-box" style="width:100%;height:44px;margin-bottom:0" placeholder="Contoh: Libur Lebaran" oninput="state.holidayNote=this.value">${state.holidayNote}</textarea>
      `:`<p style="font-size:10.5px;color:var(--text-3);margin:0">Nyalakan kalau usahamu tutup sementara di rentang tanggal tertentu (libur, renovasi, dsb) — di luar jadwal mingguan biasa.</p>`}
    </div>
  </div>`;
}
function contentProdukTambah(){
  return `<div style="padding:14px">
    <p style="font-size:13px;font-weight:600;margin:0 0 8px">Nama produk <span style="color:var(--red)">*</span></p>
    <input class="field-input" placeholder="Contoh: Teh botol" value="${(state.newProductName||'').replace(/"/g,'&quot;')}" oninput="state.newProductName=this.value">
    <p style="font-size:13px;font-weight:600;margin:0 0 8px">Total stok <span style="color:var(--red)">*</span></p>
    <input type="number" min="0" class="field-input" placeholder="Contoh: 20" value="${state.newProductQty}" oninput="state.newProductQty=this.value">
  </div>`;
}
function contentInvoiceTambah(){
  return `<div style="padding:14px">
    <p style="font-size:13px;font-weight:600;margin:0 0 8px">Nama klien / pelanggan <span style="color:var(--red)">*</span></p>
    <input class="field-input" placeholder="Contoh: Toko Jaya" value="${(state.newInvoiceClient||'').replace(/"/g,'&quot;')}" oninput="state.newInvoiceClient=this.value">
    <p style="font-size:13px;font-weight:600;margin:0 0 8px">Nominal (Rp)</p>
    <input type="number" min="0" class="field-input" placeholder="Contoh: 150000" value="${state.newInvoiceAmount}" oninput="state.newInvoiceAmount=this.value">
    <p style="font-size:13px;font-weight:600;margin:0 0 8px">Status pembayaran</p>
    <div style="display:flex;gap:6px">
      <span class="quick-chip ${state.newInvoiceStatus==='Lunas'?'selected':''}" data-action="select-invoice-status" data-value="Lunas">Lunas</span>
      <span class="quick-chip ${state.newInvoiceStatus==='Belum bayar'?'selected':''}" data-action="select-invoice-status" data-value="Belum bayar">Belum bayar</span>
    </div>
  </div>`;
}
function contentTransaksiTambah(){
  return `<div style="padding:14px">
    <p style="font-size:13px;font-weight:600;margin:0 0 8px">Deskripsi Transaksi <span style="color:var(--red)">*</span></p>
    <input class="field-input" placeholder="Contoh: Jual es teh & camilan, Beli bahan..." value="${(state.newTxDesc||'').replace(/"/g,'&quot;')}" oninput="state.newTxDesc=this.value">
    <p style="font-size:13px;font-weight:600;margin:0 0 8px">Nominal (Rp) <span style="color:var(--red)">*</span></p>
    <input type="number" min="0" class="field-input" placeholder="Contoh: 50000" value="${state.newTxAmount||''}" oninput="state.newTxAmount=this.value">
    <p style="font-size:13px;font-weight:600;margin:0 0 8px">Jenis Transaksi</p>
    <div style="display:flex;gap:8px">
      <span class="quick-chip ${state.newTxType==='income'?'selected':''}" data-action="select-tx-type" data-value="income">Pemasukan (+)</span>
      <span class="quick-chip ${state.newTxType==='expense'?'selected':''}" data-action="select-tx-type" data-value="expense">Pengeluaran (-)</span>
    </div>
  </div>`;
}

function getReportTime(r){
  if(!r) return 0;
  const ts = r.updatedAt || r.createdAt;
  if(!ts) return 0;
  if(typeof ts.toMillis === 'function') return ts.toMillis();
  if(typeof ts.toDate === 'function') return ts.toDate().getTime();
  if(ts instanceof Date) return ts.getTime();
  if(typeof ts === 'number') return ts;
  if(typeof ts === 'string') return new Date(ts).getTime() || 0;
  return 0;
}

function renderAktivitasSkeletonHTML(){
  return `<div class="skeleton-pulse" style="padding:12px">
    <div class="skeleton-box" style="width:100%;height:34px;margin-bottom:12px;border-radius:10px"></div>
    <div class="skeleton-box" style="width:38%;height:12px;margin-bottom:10px;border-radius:4px"></div>
    <div class="card" style="margin-bottom:10px;padding:12px;border:1px solid var(--border)">
      <div style="display:flex;justify-content:space-between;margin-bottom:8px">
        <div class="skeleton-box" style="width:58%;height:14px;border-radius:4px"></div>
        <div class="skeleton-box" style="width:22%;height:16px;border-radius:12px"></div>
      </div>
      <div class="skeleton-box" style="width:40%;height:10px;margin-bottom:10px;border-radius:4px"></div>
      <div class="skeleton-box" style="width:100%;height:10px;margin-bottom:6px;border-radius:4px"></div>
      <div class="skeleton-box" style="width:70%;height:10px;border-radius:4px"></div>
    </div>
    <div class="card" style="margin-bottom:10px;padding:12px;border:1px solid var(--border)">
      <div style="display:flex;justify-content:space-between;margin-bottom:8px">
        <div class="skeleton-box" style="width:50%;height:14px;border-radius:4px"></div>
        <div class="skeleton-box" style="width:22%;height:16px;border-radius:12px"></div>
      </div>
      <div class="skeleton-box" style="width:36%;height:10px;margin-bottom:10px;border-radius:4px"></div>
      <div class="skeleton-box" style="width:100%;height:10px;margin-bottom:6px;border-radius:4px"></div>
      <div class="skeleton-box" style="width:60%;height:10px;border-radius:4px"></div>
    </div>
  </div>`;
}

function renderCommentsSkeletonHTML(){
  return `<div class="skeleton-pulse" style="display:flex;flex-direction:column;gap:8px;margin-bottom:12px">
    <div style="display:flex;gap:8px;align-items:flex-start">
      <div class="skeleton-box" style="width:28px;height:28px;border-radius:50%;flex-shrink:0"></div>
      <div style="flex:1">
        <div class="skeleton-box" style="width:28%;height:11px;margin-bottom:5px;border-radius:4px"></div>
        <div class="skeleton-box" style="width:90%;height:10px;border-radius:4px"></div>
      </div>
    </div>
    <div style="display:flex;gap:8px;align-items:flex-start">
      <div class="skeleton-box" style="width:28px;height:28px;border-radius:50%;flex-shrink:0"></div>
      <div style="flex:1">
        <div class="skeleton-box" style="width:24%;height:11px;margin-bottom:5px;border-radius:4px"></div>
        <div class="skeleton-box" style="width:82%;height:10px;border-radius:4px"></div>
      </div>
    </div>
  </div>`;
}

function renderUsahaSkeletonHTML(){
  return `<div class="skeleton-pulse" style="padding:12px">
    <div style="display:flex;justify-content:space-between;margin-bottom:12px">
      <div class="skeleton-box" style="width:48%;height:18px;border-radius:4px"></div>
      <div class="skeleton-box" style="width:18%;height:18px;border-radius:10px"></div>
    </div>
    <div class="skeleton-box" style="width:100%;height:100px;margin-bottom:12px;border-radius:12px"></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">
      <div class="skeleton-box" style="height:64px;border-radius:12px"></div>
      <div class="skeleton-box" style="height:64px;border-radius:12px"></div>
    </div>
    <div class="skeleton-box" style="width:100%;height:44px;margin-bottom:8px;border-radius:8px"></div>
    <div class="skeleton-box" style="width:100%;height:44px;border-radius:8px"></div>
  </div>`;
}

function contentAktivitas(){
  const sortByNewest = (list) => [...(list || [])].sort((a, b) => getReportTime(b) - getReportTime(a));

  const myHlps = sortByNewest(state.myHelps).slice(0, 15);
  const myReps = sortByNewest(state.myReports).slice(0, 15);
  const publicReps = sortByNewest(firestoreReports).slice(0, 15);

  const isAdmin = (typeof isUserAdmin === 'function' && isUserAdmin()) || state.isAdmin;
  const reportedBizList = typeof getAdminReportedBusinesses === 'function' ? getAdminReportedBusinesses() : (adminReportedBusinesses || []);

  const adminPanelHTML = isAdmin ? `
    <div class="card" style="margin-bottom:14px;border:1.5px solid rgba(220,38,38,0.35);background:var(--card-bg, #fff);border-radius:14px;padding:14px;box-shadow:0 4px 16px rgba(220,38,38,0.08)">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid rgba(220,38,38,0.12)">
        <div style="display:flex;align-items:center;gap:10px">
          <div style="width:32px;height:32px;border-radius:8px;background:rgba(220,38,38,0.1);display:flex;align-items:center;justify-content:center;color:var(--red)">
            <span style="width:18px;height:18px;display:inline-flex">${ICONS.flag || ICONS.list}</span>
          </div>
          <div>
            <div style="font-size:13.5px;font-weight:700;color:var(--text-1);display:flex;align-items:center;gap:6px">
              Moderasi Laporan Usaha
              <span class="chip" style="background:var(--red);color:#fff;font-size:9.5px;padding:2px 6px">Khusus Admin</span>
            </div>
            <div style="font-size:11px;color:var(--text-2);margin-top:1px">Daftar usaha yang mencapai 5+ laporan warga</div>
          </div>
        </div>
        <span class="chip ${reportedBizList.length > 0 ? 'chip-red' : 'chip-green'}" style="font-size:10px;font-weight:700">
          ${reportedBizList.length} Usaha
        </span>
      </div>

      ${reportedBizList.length === 0 ? `
        <div style="text-align:center;padding:16px 8px;color:var(--text-3);font-size:12px">
          <div style="color:var(--green);font-size:13px;font-weight:600;margin-bottom:2px">Semua Usaha Aman</div>
          Belum ada usaha yang mencapai 5 laporan pelanggaran.
        </div>
      ` : `
        <div style="display:flex;flex-direction:column;gap:10px">
          ${reportedBizList.map(biz => `
            <div class="card" style="padding:12px;background:rgba(220,38,38,0.03);border:1px solid rgba(220,38,38,0.2);border-radius:12px">
              <div style="display:flex;gap:10px;align-items:flex-start">
                ${biz.photoUrl ? `
                  <img src="${biz.photoUrl}" style="width:50px;height:50px;border-radius:8px;object-fit:cover;border:1px solid var(--border);flex-shrink:0" alt="${biz.name || 'Usaha'}">
                ` : `
                  <div style="width:50px;height:50px;border-radius:8px;background:rgba(0,122,255,0.08);display:flex;align-items:center;justify-content:center;color:var(--blue);flex-shrink:0">
                    <span style="width:24px;height:24px;display:inline-flex">${ICONS.bag}</span>
                  </div>
                `}
                <div style="flex:1;min-width:0">
                  <div style="display:flex;justify-content:space-between;align-items:flex-start">
                    <div style="font-size:13px;font-weight:700;color:var(--text-1);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${biz.name || 'Usaha Tanpa Nama'}</div>
                    <span class="chip chip-red" style="font-size:9.5px;padding:2px 6px;flex-shrink:0">${biz.flagCount || 5} Laporan</span>
                  </div>
                  <div style="font-size:11px;color:var(--text-2);margin-top:2px">
                    ${biz.category || 'UMKM'} · Kec. ${biz.kecamatan || '-'}, ${biz.kota || '-'}
                  </div>
                  ${biz.phone ? `
                    <div style="font-size:10.5px;color:var(--text-3);margin-top:2px">Kontak: <b>${biz.phone}</b></div>
                  ` : ''}
                </div>
              </div>

              <div style="margin-top:8px;padding:8px 10px;background:rgba(220,38,38,0.07);border-radius:8px;font-size:11px;color:var(--text-1);line-height:1.4">
                <span style="font-weight:700;color:var(--red)">Alasan Pelaporan:</span> ${biz.lastFlagReason || biz.flagReason || 'Laporan pelanggaran oleh warga (mencapai 5 laporan)'}
                ${biz.description ? `<div style="margin-top:4px;font-size:10.5px;color:var(--text-2);font-style:italic">"${biz.description}"</div>` : ''}
              </div>

              <div style="display:flex;gap:6px;margin-top:10px">
                <div class="btn btn-success pressable" style="flex:1;height:34px;padding:0 6px;font-size:11.5px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:4px" data-action="admin-approve-biz" data-id="${biz.id}">
                  Setujui
                </div>
                <div class="btn btn-danger pressable" style="flex:1;height:34px;padding:0 6px;font-size:11.5px;font-weight:700;background:var(--red);border-color:var(--red);color:#fff;display:flex;align-items:center;justify-content:center;gap:4px" data-action="admin-reject-biz" data-id="${biz.id}">
                  Tolak
                </div>
                <div class="btn btn-ghost pressable" style="height:34px;padding:0 8px;font-size:11.5px;display:flex;align-items:center;justify-content:center;gap:4px;color:var(--blue);border-color:rgba(0,122,255,0.3)" data-action="view-biz-on-map" data-id="${biz.id}">
                  <span style="width:13px;height:13px;display:inline-flex">${ICONS.map}</span> Peta
                </div>
                <div class="btn btn-ghost pressable" style="height:34px;padding:0 8px;font-size:11.5px;display:flex;align-items:center;justify-content:center" data-action="open-biz-detail-admin" data-id="${biz.id}">
                  Detail
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    </div>
  ` : '';

  if(state.isLoadingAktivitas && myReps.length === 0 && myHlps.length === 0 && publicReps.length === 0 && reportedBizList.length === 0){
    return renderAktivitasSkeletonHTML();
  }

  const catMap = {infra:'Infrastruktur', sampah:'Sampah', fasum:'Fasilitas Umum'};
  const statusCls = {baru:'chip-red', dikerjakan:'chip-amber', validasi:'chip-amber', selesai:'chip-green'};

  if(myReps.length === 0 && myHlps.length === 0 && publicReps.length === 0){
    if(isAdmin){
      return `<div style="padding:12px">${adminPanelHTML}</div>`;
    }
    return `<div style="padding:32px 16px;text-align:center">
      <div style="margin:0 auto 12px;width:44px;height:44px;border-radius:50%;background:rgba(0,122,255,.1);display:flex;align-items:center;justify-content:center;color:var(--blue)"><span style="width:24px;height:24px;display:inline-flex">${ICONS.list}</span></div>
      <p style="font-weight:600;font-size:14px;margin:0 0 6px">Belum Ada Aktivitas</p>
      <p style="font-size:12px;color:var(--text-2);margin:0 0 16px;line-height:1.5">Laporan masalah yang kamu kirimkan atau aksi bantuan gotong royong warga akan tercatat di sini.</p>
      <div class="btn btn-primary pressable" style="max-width:200px;margin:0 auto;font-size:12px" data-action="set-tab" data-value="map">Lihat Peta Sekitar</div>
    </div>`;
  }

  return `<div style="padding:12px">
    ${adminPanelHTML}
    <div style="margin-bottom:12px;background:rgba(0,122,255,0.05);border:1px solid rgba(0,122,255,0.12);border-radius:10px;padding:8px 12px;font-size:11.5px;color:var(--text-2)">
      Menampilkan <b>15 aktivitas terbaru</b>. Laporan dan bantuan yang lebih lama disaring otomatis.
    </div>

    ${myHlps.length > 0 ? `
      <p style="font-size:10px;color:var(--text-2);margin:0 0 8px;text-transform:uppercase;letter-spacing:.04em;font-weight:700">Bantuan Gotong Royong Saya (${myHlps.length} Terbaru)</p>
      ${myHlps.map(r => {
        const isDikerjakan = r.status === 'dikerjakan';
        return `
        <div class="card" style="margin-bottom:8px;padding:12px;border:1px solid ${isDikerjakan?'rgba(245,158,11,0.3)':'var(--border)'}">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px">
            <div>
              <div style="font-size:13px;font-weight:700;color:var(--text-1)">${r.description || (catMap[r.category]||'Laporan Masalah')}</div>
              <div style="font-size:10.5px;color:var(--text-3);margin-top:2px">Kec. ${r.kecamatan || state.kecamatan}, ${r.kota || state.kota} · ${r.updatedAt ? _timeAgo(r.updatedAt) : (r.createdAt ? _timeAgo(r.createdAt) : 'Baru saja')}</div>
            </div>
            <span class="chip ${statusCls[r.status]||'chip-amber'}">${isDikerjakan ? 'Sedang Dikerjakan' : r.status}</span>
          </div>
          ${isDikerjakan && (r.helpRencana || r.helpIntent) ? `
            <div style="font-size:11.5px;color:var(--text-2);background:rgba(0,0,0,0.03);padding:6px 10px;border-radius:8px;margin-bottom:8px;line-height:1.4">
              <b>Rencana:</b> ${r.helpRencana || r.helpIntent} ${r.helpTimeframe ? `(${r.helpTimeframe})` : ''}
            </div>
          ` : ''}
          <div style="display:flex;gap:8px;margin-top:6px">
            ${isDikerjakan ? `
              <div class="btn btn-primary pressable" style="flex:1;padding:7px;font-size:11.5px;font-weight:700" data-action="continue-help-from-act" data-id="${r.id}">Lanjutkan &amp; Upload Bukti ›</div>
            ` : ''}
            <div class="btn btn-ghost pressable" style="padding:7px 12px;font-size:11.5px" data-action="open-report-from-act" data-id="${r.id}">Detail</div>
          </div>
        </div>`;
      }).join('')}
    ` : ''}

    ${myReps.length > 0 ? `
      <p style="font-size:10px;color:var(--text-2);margin:${myHlps.length>0?'14px':'0'} 0 8px;text-transform:uppercase;letter-spacing:.04em;font-weight:700">Laporan Masalah Saya (${myReps.length} Terbaru)</p>
      ${myReps.map(r => `
        <div class="card pressable" style="margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;padding:10px 12px" data-action="open-report-from-act" data-id="${r.id}">
          <div style="flex:1;min-width:0;padding-right:8px">
            <div style="font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${r.description || (catMap[r.category]||'Laporan')}</div>
            <div style="font-size:10px;color:var(--text-3)">${r.createdAt ? _timeAgo(r.createdAt) : 'Baru saja'}</div>
          </div>
          <span class="chip ${statusCls[r.status]||'chip-red'}">${r.status}</span>
        </div>
      `).join('')}
    ` : ''}

    ${publicReps.length > 0 ? `
      <p style="font-size:10px;color:var(--text-2);margin:${(myReps.length>0||myHlps.length>0)?'16px':'0'} 0 8px;text-transform:uppercase;letter-spacing:.04em;font-weight:700">Laporan Warga Publik (${publicReps.length} Terbaru)</p>
      ${publicReps.map(r => `
        <div class="card pressable" style="margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;padding:10px 12px" data-action="open-report-from-act" data-id="${r.id}">
          <div style="flex:1;min-width:0;padding-right:8px">
            <div style="font-size:12.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${r.description || (catMap[r.category]||'Laporan')}</div>
            <div style="font-size:10.5px;color:var(--text-3);margin-top:2px">Oleh <b>${r.username || 'Warga'}</b> · ${r.kecamatan ? 'Kec. ' + r.kecamatan : (r.kota || '')} · ${r.createdAt ? _timeAgo(r.createdAt) : 'Baru saja'}</div>
          </div>
          <span class="chip ${statusCls[r.status]||'chip-red'}">${r.status}</span>
        </div>
      `).join('')}
    ` : ''}
  </div>`;
}

function contentProfil(){
  return `<div style="padding:16px">
    <div style="display:flex;flex-direction:column;align-items:center;margin-bottom:18px">
      ${state.profilePhoto
        ? `<div class="avatar" style="width:60px;height:60px;background-image:url('${state.profilePhoto}');background-size:cover;background-position:center;margin-bottom:8px"></div>`
        : `<div class="avatar" style="width:60px;height:60px;margin-bottom:8px;display:flex;align-items:center;justify-content:center;font-size:22px;color:var(--text-3)"><span style="width:30px;height:30px;display:inline-flex">${ICONS.person}</span></div>`}
      <p style="font-weight:600;font-size:15px;margin:0">${state.username || 'Pengguna'}</p>
      <p style="font-size:11px;color:var(--text-2);margin:2px 0 0">Kec. ${state.kecamatan}, ${state.kota}</p>
    </div>
    <div class="card" style="margin-bottom:14px;text-align:center">
      <p style="font-size:20px;font-weight:600;margin:0">${state.contributionCount || 0}</p>
      <p style="font-size:10px;color:var(--text-2);margin:2px 0 0">Kontribusi Saya</p>
    </div>
    <div class="list-row" data-action="open-leaderboard"><span class="left">${ICONS.badge}Papan Kontribusi Komunitas</span><span>${ICONS.chev}</span></div>
    <div class="list-row" data-action="${state.hasBusiness?'set-tab':'open-usaha-daftar'}" data-value="usaha"><span class="left">${ICONS.bag}Usaha Terdaftar</span><span>${ICONS.chev}</span></div>
    <div class="list-row" data-action="open-settings"><span class="left">${ICONS.list}Pengaturan Akun</span><span>${ICONS.chev}</span></div>
  </div>`;
}

function _timeAgo(ts){
  if(!ts) return 'baru saja';
  let date = null;
  if(typeof ts.toDate === 'function') date = ts.toDate();
  else if(typeof ts.toMillis === 'function') date = new Date(ts.toMillis());
  else if(ts instanceof Date) date = ts;
  else if(typeof ts === 'number') date = new Date(ts);
  else if(typeof ts === 'string') date = new Date(ts);
  if(!date || isNaN(date.getTime())) return 'baru saja';

  const diff = (Date.now() - date.getTime()) / 1000;
  if(diff < 60) return 'baru saja';
  if(diff < 3600) return Math.floor(diff/60) + ' menit lalu';
  if(diff < 86400) return Math.floor(diff/3600) + ' jam lalu';
  return Math.floor(diff/86400) + ' hari lalu';
}

function contentDetail(){
  // Find current report from firestoreReports, myReports, or myHelps
  const report = (firestoreReports || []).find(r => r.id === currentReportId)
    || (state.myReports || []).find(r => r.id === currentReportId)
    || (state.myHelps || []).find(r => r.id === currentReportId);
  const catLabel = report ? ({infra:'Infrastruktur',sampah:'Sampah',fasum:'Fasilitas Umum'}[report.category]||report.category) : 'Infrastruktur';
  const statusLabel = report ? ({baru:'baru',dikerjakan:'dikerjakan',validasi:'validasi',selesai:'selesai'}[report.status]||report.status) : 'baru';
  const statusColor = report ? ({baru:'red',dikerjakan:'red',validasi:'amber',selesai:'green'}[report.status]||'red') : 'red';
  const desc = report ? report.description : 'Memuat...';
  const poster = report ? (report.username||'Anonim') : '...';
  const timeAgo = report?.createdAt ? _timeAgo(report.createdAt) : '';
  const photoUrl = report?.photoUrl || null;

  // Load comments async (non-blocking) - only fetch once per report
  if(currentReportId && state._loadedDetailCommentsId !== currentReportId){
    state._loadedDetailCommentsId = currentReportId;
    if(!state._reportCommentsCache) state._reportCommentsCache = {};
    if(state.detailComments && state.detailComments.length > 0 && !state._reportCommentsCache[currentReportId]){
      state._reportCommentsCache[currentReportId] = [...state.detailComments];
    }
    state.detailComments = state._reportCommentsCache[currentReportId] ? [...state._reportCommentsCache[currentReportId]] : [];
    state.isLoadingComments = (state.detailComments.length === 0);
    fbLoadComments(currentReportId).then(comments => {
      if(state._loadedDetailCommentsId === currentReportId){
        state.isLoadingComments = false;
        state.detailComments = (comments || []).map(c => ({name: c.username, text: c.text}));
        state._reportCommentsCache[currentReportId] = state.detailComments;
        render();
      }
    }).catch(()=>{
      if(state._loadedDetailCommentsId === currentReportId){
        state.isLoadingComments = false;
        render();
      }
    });
  }

  return `<div style="padding:12px;display:flex;flex-direction:column">
    <span class="chip chip-${statusColor}" style="width:fit-content;margin-bottom:8px">● ${catLabel} — ${statusLabel}</span>
    ${photoUrl ? `<div style="height:160px;background:url('${photoUrl}') center/cover;border-radius:12px;margin-bottom:10px;cursor:pointer" data-action="zoom-photo" data-photo="${photoUrl}"></div>` : `<div style="height:120px;background:rgba(255,255,255,.4);border-radius:12px;margin-bottom:10px"></div>`}
    <p style="font-size:12px;color:var(--text-2);margin:0 0 4px">${desc}</p>
    <p style="font-size:10px;color:var(--text-3);margin:0 0 10px">${poster} · ${timeAgo}</p>
    ${report?.status === 'baru' ? `<div class="btn btn-primary pressable" style="margin-bottom:14px" data-action="open-form">Saya akan bantu</div>` : ''}
    ${report?.status === 'dikerjakan' ? `<div class="btn btn-primary pressable" style="margin-bottom:14px" data-action="continue-form">Upload bukti penyelesaian</div>` : ''}
    <p style="font-size:11px;font-weight:600;margin:0 0 8px">Komentar (${state.detailComments.length})</p>
    ${(state.isLoadingComments && state.detailComments.length === 0) ? renderCommentsSkeletonHTML() : (
      state.detailComments.length === 0 ? `<p style="font-size:11px;color:var(--text-3);margin:0 0 10px;font-style:italic">Belum ada komentar warga.</p>` :
      state.detailComments.map(c=>`<div style="display:flex;gap:6px;margin-bottom:6px"><div class="avatar" style="width:24px;height:24px"></div><div class="card" style="flex:1;padding:7px 9px;font-size:11px"><b>${c.name}:</b> ${c.text}</div></div>`).join('')
    )}
  </div>`;
}
function _timeAgo(ts){
  if(!ts || !ts.toDate) return '';
  const diff = (Date.now() - ts.toDate().getTime()) / 1000;
  if(diff < 60) return 'baru saja';
  if(diff < 3600) return Math.floor(diff/60) + ' menit lalu';
  if(diff < 86400) return Math.floor(diff/3600) + ' jam lalu';
  return Math.floor(diff/86400) + ' hari lalu';
}
function contentForm(){
  if(state.formStep===1) return `
    <div style="padding:14px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <span class="chip chip-amber">Tahap 1: Niat &amp; Rencana</span>
        <span style="font-size:11px;color:var(--text-3)">Langkah 1 dari 2</span>
      </div>
      <p style="font-size:13px;font-weight:600;margin:0 0 8px">Apa yang akan kamu lakukan? <span style="color:var(--red)">*</span></p>
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px">
        <span class="quick-chip ${state.intent==='tambal'?'selected':''}" data-action="select-intent" data-value="tambal">Menambal jalan</span>
        <span class="quick-chip ${state.intent==='lapor'?'selected':''}" data-action="select-intent" data-value="lapor">Lapor RT/RW</span>
        <span class="quick-chip ${state.intent==='bersihkan'?'selected':''}" data-action="select-intent" data-value="bersihkan">Bersihkan sampah</span>
      </div>
      <textarea class="input-box" style="height:64px;margin-bottom:14px" placeholder="Tulis rencana aksi bantuanmu..." oninput="state.formRencana=this.value">${state.formRencana}</textarea>
      
      <p style="font-size:13px;font-weight:600;margin:0 0 8px">Perkiraan waktu selesai?</p>
      <div style="display:flex;gap:6px;margin-bottom:16px;flex-wrap:wrap">
        <span class="quick-chip ${(!state.timeframe||state.timeframe==='hari-ini')?'selected':''}" data-action="select-time" data-value="hari-ini">Hari ini</span>
        <span class="quick-chip ${state.timeframe==='1-3'?'selected':''}" data-action="select-time" data-value="1-3">1-3 hari</span>
        <span class="quick-chip ${state.timeframe==='>1minggu'?'selected':''}" data-action="select-time" data-value=">1minggu">&gt;1 minggu</span>
      </div>

      <div style="background:rgba(0,122,255,0.06);border:1px solid rgba(0,122,255,0.16);border-radius:10px;padding:10px 12px;font-size:11.5px;color:var(--text-2);line-height:1.4">
        <b>Tersimpan di Aktivitas:</b> Niat bantuanmu akan otomatis tersimpan di tab <b>Aktivitas</b>. Kamu bisa menutup halaman ini dan melanjutkannya kapan saja.
      </div>
    </div>`;
  return `
    <div style="padding:14px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <span class="chip chip-green">Tahap 2: Bukti Penyelesaian</span>
        <span style="font-size:11px;color:var(--text-3)">Langkah 2 dari 2</span>
      </div>
      <p style="font-size:13px;font-weight:600;margin:0 0 8px">Upload foto sesudah diperbaiki <span style="color:var(--red)">*</span></p>
      ${photoUploadBox('formPhoto')}
      <p style="font-size:13px;font-weight:600;margin:0 0 8px">Apa yang sudah kamu selesaikan? <span style="color:var(--red)">*</span></p>
      <textarea class="input-box" style="height:64px" placeholder="Tulis apa yang sudah kamu kerjakan..." oninput="state.formKerjakan=this.value">${state.formKerjakan}</textarea>
    </div>`;
}
const CAT_BG = {infra:'rgba(255,59,48,.12)', sampah:'rgba(255,159,10,.14)', fasum:'rgba(0,122,255,.12)'};
function contentLapor(){
  const cat = REPORT_CATEGORIES.find(c=>c.id===state.newReportCategory) || REPORT_CATEGORIES[0];
  const defCoords = getCityCoords(state.kota);
  const latDisplay = (state.reportLat !== null && state.reportLat !== undefined ? state.reportLat : defCoords[0]).toFixed(4);
  const lngDisplay = (state.reportLng !== null && state.reportLng !== undefined ? state.reportLng : defCoords[1]).toFixed(4);

  return `<div style="padding:14px">
    <span class="chip" style="background:${CAT_BG[cat.id]};color:${cat.color};width:fit-content;margin-bottom:14px;font-size:11px">${cat.label}</span>
    <p style="font-size:13px;font-weight:600;margin:0 0 8px">Foto masalah <span style="color:var(--red)">*</span></p>
    ${photoUploadBox('laporPhoto')}
    <p style="font-size:13px;font-weight:600;margin:0 0 8px">Deskripsi masalah <span style="color:var(--red)">*</span></p>
    <textarea class="input-box" style="height:60px;margin-bottom:14px" placeholder="Jelaskan masalahnya..." oninput="state.laporDesc=this.value">${state.laporDesc}</textarea>
    <p style="font-size:13px;font-weight:600;margin:0 0 8px">Titik Lokasi Masalah <span style="color:var(--red)">*</span></p>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">
      <span class="quick-chip ${state.isPickingLocation?'selected':''}" data-action="pick-report-location">Tentukan di Peta</span>
      <span class="quick-chip" data-action="get-my-location">Lokasi Saya (GPS)</span>
    </div>
    <div style="font-size:11px;color:var(--text-2);background:rgba(0,0,0,0.04);padding:8px 12px;border-radius:10px;line-height:1.4">
      Titik terpilih: <b>${latDisplay}, ${lngDisplay}</b> (Kec. ${state.kecamatan})
      <span style="display:block;font-size:9.5px;color:var(--text-3);margin-top:2px">Ketuk "Tentukan di Peta" lalu klik titik jalan pada peta untuk menggeser lokasi pin.</span>
    </div>
  </div>`;
}
function bottomFor(screen){
  if(screen==='map'||screen==='usaha'||screen==='aktivitas'||screen==='profil'){
    if(state.overlay) return '';
    return `<div class="tabbar nav-blur">${TABS.map(t=>
      `<div class="tab pressable ${state.tab===t.id?'active':''}" data-action="set-tab" data-value="${t.id}"><span class="icon-wrap">${t.icon}</span>${t.label}</div>`
    ).join('')}</div>`;
  }
  if(screen==='detail'){
    return `<div style="border-top:0.5px solid var(--border);padding:8px 10px;background:rgba(255,255,255,.92)">
      <div style="display:flex;gap:5px;margin-bottom:6px;overflow-x:auto">
        <span class="quick-chip" data-action="quick-komentar" data-value="Saya juga melihat masalah ini">Saya juga melihat ini</span>
        <span class="quick-chip" data-action="quick-komentar" data-value="Perlu penanganan segera">Perlu penanganan segera</span>
      </div>
      <div style="display:flex;gap:6px;align-items:flex-end">
        <textarea class="input-box" style="flex:1;height:38px;padding:9px 12px" placeholder="Tulis komentar..." oninput="state.komentarDraft=this.value">${state.komentarDraft}</textarea>
        <span class="icon-btn pressable" style="background:var(--blue);color:#fff;border-color:transparent;flex-shrink:0" data-action="submit-komentar" title="Kirim">${ICONS.chev}</span>
      </div>
    </div>`;
  }
  if(screen==='form'){
    if(state.formStep===1) {
      return `<div style="padding:10px 12px;display:flex;flex-direction:column;gap:8px">
        <div class="btn btn-primary pressable" data-action="form-save-next">Simpan &amp; Lanjut Upload Bukti →</div>
        <div class="btn btn-ghost pressable" style="font-size:12px" data-action="form-save-later">Simpan Niat &amp; Kerjakan Nanti (Lihat di Aktivitas)</div>
      </div>`;
    }
    return `<div style="padding:10px 12px;display:flex;gap:8px">
      <div class="btn btn-ghost pressable" style="flex:1" data-action="form-back">‹ Kembali</div>
      <div class="btn btn-success pressable" style="flex:2" data-action="form-submit">Kirim Bukti Selesai</div>
    </div>`;
  }
  if(screen==='lapor'){
    return `<div style="padding:12px"><div class="btn btn-primary pressable" data-action="lapor-submit">Kirim Laporan</div></div>`;
  }
  if(screen==='usaha-daftar'){
    return `<div style="padding:12px"><div class="btn btn-primary pressable" data-action="usaha-daftar-submit">Daftarkan Usaha</div></div>`;
  }
  if(screen==='jam-operasional'){
    return `<div style="padding:12px"><div class="btn btn-primary pressable" data-action="jam-operasional-save">Simpan Jam Operasional</div></div>`;
  }
  if(screen==='produk-tambah'){
    return `<div style="padding:12px"><div class="btn btn-primary pressable" data-action="produk-tambah-submit">Tambah Produk</div></div>`;
  }
  if(screen==='invoice-tambah'){
    return `<div style="padding:12px"><div class="btn btn-primary pressable" data-action="invoice-tambah-submit">Buat Invoice</div></div>`;
  }
  if(screen==='transaksi-tambah'){
    return `<div style="padding:12px"><div class="btn btn-primary pressable" data-action="transaksi-tambah-submit">Simpan Transaksi</div></div>`;
  }
  if(screen==='info-usaha'){
    return `<div style="padding:12px"><div class="btn btn-primary pressable" data-action="info-usaha-save">Simpan Info Usaha</div></div>`;
  }
  if(screen==='metode-pembayaran'){
    return `<div style="padding:12px"><div class="btn btn-primary pressable" data-action="metode-pembayaran-save">Simpan Metode Pembayaran</div></div>`;
  }
  return '';
}
function fullscreenHeader(screen){
  if(screen==='detail') return `<div class="fullscreen-header"><span class="icon-btn pressable" data-action="close-pushed">${ICONS.close}</span><b style="font-size:13px">Detail Laporan</b><span class="icon-btn pressable" data-action="open-flag" title="Laporkan">${ICONS.flag}</span></div>`;
  if(screen==='form'){
    const backAction = state.formStep===1 ? 'close-pushed' : 'form-back';
    const icon = state.formStep===1 ? ICONS.close : ICONS.back;
    const title = state.formStep===1 ? 'Isi Niat' : 'Bukti Selesai';
    return `<div class="fullscreen-header"><span class="icon-btn pressable" data-action="${backAction}">${icon}</span><b style="font-size:13px">${title}</b><span style="width:30px"></span></div>`;
  }
  if(screen==='lapor') return `<div class="fullscreen-header"><span class="icon-btn pressable" data-action="close-pushed">${ICONS.close}</span><b style="font-size:13px">Lapor Masalah</b><span style="width:30px"></span></div>`;
  if(screen==='leaderboard') return `<div class="fullscreen-header"><span class="icon-btn pressable" data-action="close-pushed">${ICONS.close}</span><b style="font-size:13px">Papan Kontribusi</b><span style="width:30px"></span></div>`;
  if(screen==='settings') return `<div class="fullscreen-header"><span class="icon-btn pressable" data-action="close-pushed">${ICONS.close}</span><b style="font-size:13px">Pengaturan Akun</b><span style="width:30px"></span></div>`;
  if(screen==='usaha-daftar') return `<div class="fullscreen-header"><span class="icon-btn pressable" data-action="close-pushed">${ICONS.close}</span><b style="font-size:13px">Daftarkan Usaha</b><span style="width:30px"></span></div>`;
  if(screen==='jam-operasional') return `<div class="fullscreen-header"><span class="icon-btn pressable" data-action="close-pushed">${ICONS.close}</span><b style="font-size:13px">Jam Operasional</b><span style="width:30px"></span></div>`;
  if(screen==='produk-tambah') return `<div class="fullscreen-header"><span class="icon-btn pressable" data-action="close-pushed">${ICONS.close}</span><b style="font-size:13px">Tambah Produk</b><span style="width:30px"></span></div>`;
  if(screen==='invoice-tambah') return `<div class="fullscreen-header"><span class="icon-btn pressable" data-action="close-pushed">${ICONS.close}</span><b style="font-size:13px">Buat Invoice</b><span style="width:30px"></span></div>`;
  if(screen==='transaksi-tambah') return `<div class="fullscreen-header"><span class="icon-btn pressable" data-action="close-pushed">${ICONS.close}</span><b style="font-size:13px">Catat Transaksi</b><span style="width:30px"></span></div>`;
  if(screen==='invoice-detail') return `<div class="fullscreen-header"><span class="icon-btn pressable" data-action="close-pushed">${ICONS.close}</span><b style="font-size:13px">Struk Digital</b><span style="width:30px"></span></div>`;
  if(screen==='info-usaha') return `<div class="fullscreen-header"><span class="icon-btn pressable" data-action="close-pushed">${ICONS.close}</span><b style="font-size:13px">Info Usaha</b><span style="width:30px"></span></div>`;
  if(screen==='metode-pembayaran') return `<div class="fullscreen-header"><span class="icon-btn pressable" data-action="close-pushed">${ICONS.close}</span><b style="font-size:13px">Metode Pembayaran</b><span style="width:30px"></span></div>`;
  return '';
}
function amberSheetInner(){
  const rep = (firestoreReports || []).find(r => r.id === currentReportId);
  const reporter = rep?.username || 'Warga';
  const helper = rep?.helperName || 'Warga peduli';
  const beforePhoto = rep?.photoUrl;
  const afterPhoto = rep?.proofPhotoUrl;
  const valCount = Number(rep?.validateCount) || 0;
  const notValCount = Number(rep?.notValidateCount) || 0;
  const desc = rep?.proofDescription || rep?.description || 'Gotong royong selesai dilakukan.';

  return `<div class="sheet-body">
    <div class="grabber"></div>
    <div style="display:flex;justify-content:space-between;align-items:flex-start">
      <span class="chip chip-amber">● Menunggu validasi warga</span>
      <span class="icon-btn pressable" style="width:26px;height:26px;font-size:12px" data-action="open-flag" title="Laporkan">${ICONS.flag}</span>
    </div>
    <div style="display:flex;gap:12px;margin:10px 0;font-size:11.5px">
      <span>Dilaporkan: <b style="color:var(--blue)">${reporter}</b></span>
      <span>Diperbaiki: <b style="color:var(--green)">${helper}</b></span>
    </div>

    <!-- Perbandingan Foto Sebelum & Sesudah -->
    <div style="display:flex;gap:8px;margin-bottom:8px">
      <div style="flex:1;height:105px;background:#E5E5EA;border-radius:10px;position:relative;overflow:hidden;cursor:pointer" data-action="zoom-photo" data-photo="${beforePhoto || ''}">
        ${beforePhoto ? `<img src="${beforePhoto}" style="width:100%;height:100%;object-fit:cover" alt="Sebelum"/>` : `<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:10px;color:var(--text-3)">Tidak ada foto</div>`}
        <span style="position:absolute;bottom:4px;left:4px;font-size:8.5px;background:rgba(0,0,0,0.6);color:#fff;padding:2px 6px;border-radius:4px">Sebelum</span>
      </div>
      <div style="flex:1;height:105px;background:#DDEEDD;border-radius:10px;position:relative;overflow:hidden;cursor:pointer" data-action="zoom-photo" data-photo="${afterPhoto || ''}">
        ${afterPhoto ? `<img src="${afterPhoto}" style="width:100%;height:100%;object-fit:cover" alt="Sesudah"/>` : `<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:10px;color:var(--text-3)">Tidak ada foto</div>`}
        <span style="position:absolute;bottom:4px;left:4px;font-size:8.5px;background:rgba(0,0,0,0.6);color:#fff;padding:2px 6px;border-radius:4px">Sesudah</span>
      </div>
    </div>
    <p style="font-size:10.5px;color:var(--text-3);margin:0 0 8px">Ketuk foto untuk memperbesar tampilan</p>
    <p style="font-size:11px;color:var(--text-2);margin:0 0 10px;line-height:1.4">${desc}</p>

    <!-- Status Validasi Warga -->
    <div style="background:rgba(0,0,0,0.03);border-radius:8px;padding:8px 12px;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center;font-size:11.5px">
      <span>Status Gotong Royong:</span>
      <b style="color:var(--green)">Menunggu Validasi Warga</b>
    </div>

    <div style="display:flex;gap:8px">
      <div class="btn btn-success pressable" style="flex:1;height:40px;font-size:12.5px" data-action="validate">Validasi Selesai</div>
      <div class="btn btn-danger-outline pressable" style="flex:1;height:40px;font-size:12.5px" data-action="not-validate">Belum Selesai</div>
    </div>
  </div>`;
}
function renderWilayahResultsHTML(query){
  const q = (query || '').toLowerCase().trim();
  const allCities = Object.keys(KOTA_KECAMATAN);
  let results = [];

  if(!q){
    // Show kecamatans of active tempKota or selected city
    const curCity = state.tempKota || allCities[0];
    const kecs = KOTA_KECAMATAN[curCity] || [];
    kecs.forEach(k => {
      results.push({ kota: curCity, kecamatan: k });
    });
  } else {
    // Search across ALL cities and kecamatans
    allCities.forEach(c => {
      const kecs = KOTA_KECAMATAN[c] || [];
      const cityMatches = c.toLowerCase().includes(q);
      kecs.forEach(k => {
        if(cityMatches || k.toLowerCase().includes(q)){
          results.push({ kota: c, kecamatan: k });
        }
      });
    });
  }

  if(results.length === 0){
    return `<div style="padding:24px 12px;text-align:center">
      <p style="font-size:12.5px;color:var(--text-3);margin:0">Daerah "${q}" tidak ditemukan.</p>
      <p style="font-size:11px;color:var(--text-3);margin:4px 0 0">Coba ketik nama daerah lain seperti Lamongan, Gresik, Malang, atau Jember.</p>
    </div>`;
  }

  return results.slice(0, 35).map(item => {
    const isSelected = (state.tempKota === item.kota && state.tempKecamatan === item.kecamatan);
    return `
    <div class="wilayah-card ${isSelected ? 'active' : ''} pressable" data-action="pick-wilayah" data-kota="${item.kota}" data-kecamatan="${item.kecamatan}">
      <div>
        <div style="font-size:13.5px;font-weight:700;color:var(--text-1)">Kec. ${item.kecamatan}</div>
        <div style="font-size:11px;color:var(--text-2);margin-top:2px">${item.kota}</div>
      </div>
      ${isSelected ? '<span style="color:var(--blue);font-weight:700;font-size:12px;display:flex;align-items:center;gap:4px">Terpilih</span>' : '<span style="color:var(--text-3);font-size:12px">Pilih ›</span>'}
    </div>`;
  }).join('');
}

function updateWilayahResultsContainer(){
  const c = document.getElementById('wilayahResultsContainer');
  if(c){
    c.innerHTML = renderWilayahResultsHTML(state.wilayahSearch);
  }
  const badge = document.getElementById('wilayahActiveSelectedLabel');
  if(badge){
    badge.innerText = `Kec. ${state.tempKecamatan || state.kecamatan}, ${state.tempKota || state.kota}`;
  }
}

function wilayahSheetInner(){
  const isBusiness = state.wilayahTarget==='business';
  const popularCities = ['Surabaya','Malang','Lamongan','Gresik','Jember','Sidoarjo','Bandung','Jakarta Selatan','Semarang','Yogyakarta'];
  const curKota = state.tempKota || (isBusiness ? state.businessKota : state.kota) || '';
  const curKec = state.tempKecamatan || (isBusiness ? state.businessKecamatan : state.kecamatan) || '';

  return `<div class="sheet-body">
    <div class="grabber"></div>
    <p style="font-weight:700;font-size:16px;margin:2px 0 3px">${isBusiness? 'Ubah Lokasi Usaha' : 'Pilih Wilayah Anda'}</p>
    <p style="font-size:11.5px;color:var(--text-2);margin:0 0 14px">Ketik nama kota &amp; kecamatan. Muncul koreksi abu-abu, tekan <b>Enter</b> untuk langsung memilih:</p>
    
    ${ghostInputHTML('wilKotaInput', 'wilKota', 'Ketik nama kota (misal: Lamongan, Gresik, Malang)...', curKota, 'Kota')}
    ${ghostInputHTML('wilKecamatanInput', 'wilKecamatan', 'Ketik nama kecamatan (misal: Babat, Kebomas, Sukun)...', curKec, 'Kecamatan')}

    <!-- Quick City Suggestion Chips -->
    <div style="font-size:11px;color:var(--text-3);margin-bottom:6px">Pilih cepat kota:</div>
    <div style="display:flex;gap:6px;overflow-x:auto;padding-bottom:6px;margin-bottom:12px;-webkit-overflow-scrolling:touch">
      ${popularCities.map(c => {
        const isCur = state.tempKota === c;
        return `<span class="quick-city-chip ${isCur?'selected':''} pressable" data-action="quick-pick-city" data-value="${c}">${c}</span>`;
      }).join('')}
    </div>

    <!-- Active Selection Pill -->
    <div style="background:rgba(0,122,255,0.06);border:1px solid rgba(0,122,255,0.16);border-radius:12px;padding:9px 12px;margin-bottom:14px;display:flex;align-items:center;justify-content:space-between">
      <div>
        <div style="font-size:10px;color:var(--text-3);font-weight:600;text-transform:uppercase">Wilayah Terpilih:</div>
        <div id="wilayahActiveSelectedLabel" style="font-size:13.5px;font-weight:700;color:var(--text-1);margin-top:2px">Kec. ${curKec || '...'}, ${curKota || '...'}</div>
      </div>
      <span style="display:inline-flex;width:18px;height:18px;color:var(--blue)">${ICONS.pin}</span>
    </div>

    <div class="btn btn-primary pressable" style="height:42px;font-size:13.5px;font-weight:700" data-action="wilayah-submit">Terapkan Wilayah Ini</div>
    <p style="text-align:center;font-size:11.5px;color:var(--text-3);margin-top:10px;cursor:pointer" data-action="close-overlay">Batal</p>
  </div>`;
}
function flagSheetInner(){
  return `<div class="sheet-body">
    <div class="grabber"></div>
    <p style="font-weight:600;font-size:14px;margin:2px 0 4px">Laporkan konten ini</p>
    <p style="font-size:11.5px;color:var(--text-2);margin:0 0 14px">Pilih alasan kenapa laporan ini perlu ditinjau admin.</p>
    <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px">
      ${FLAG_REASONS.map(r=>`<div class="quick-chip ${state.flagCategory===r?'selected':''} pressable" style="text-align:left;padding:11px 13px" data-action="select-flag-reason" data-value="${r}">${r}</div>`).join('')}
    </div>
    <div class="btn btn-primary pressable" data-action="flag-submit">Kirim</div>
    <p style="text-align:center;font-size:11px;color:var(--text-3);margin-top:8px;cursor:pointer" data-action="close-overlay">Batal</p>
  </div>`;
}
function contentLeaderboard(){
  const users = state.leaderboardUsers || [];
  return `<div style="padding:14px">
    <p style="font-size:11.5px;color:var(--text-2);margin:0 0 4px">Kec. ${state.kecamatan}, ${state.kota}</p>
    <p style="font-size:10.5px;color:var(--text-3);margin:0 0 14px;line-height:1.5">Daftar warga yang sudah berkontribusi gotong royong di kecamatanmu.</p>
    <div class="card" style="padding:0;overflow:hidden">
      ${users.length === 0 ? `
        <div style="padding:24px 12px;text-align:center;font-size:12px;color:var(--text-2)">
          Belum ada kontributor gotong royong di kecamatan ini. Jadilah yang pertama!
        </div>
      ` : users.map(u => {
        const isMe = (auth.currentUser && u.uid === auth.currentUser.uid) || u.username === state.username;
        const initial = (u.username || 'W')[0].toUpperCase();
        return `<div class="lb-row">
          <span class="n">${initial}</span>
          <span style="flex:1">${u.username || 'Warga'}${isMe ? ' <span style="color:var(--blue);font-weight:600">(kamu)</span>' : ''}</span>
          <span class="chip chip-green" style="font-size:10.5px">${u.contributionCount || 0} aksi</span>
        </div>`;
      }).join('')}
    </div>
  </div>`;
}
function contentSettings(){
  return `<div>
    <div style="display:flex;flex-direction:column;align-items:center;padding:20px 14px 8px">
      ${state.profilePhoto
        ? `<div class="avatar" style="width:84px;height:84px;background-image:url('${state.profilePhoto}');background-size:cover;background-position:center;margin-bottom:10px"></div>`
        : `<div class="avatar" style="width:84px;height:84px;margin-bottom:10px;display:flex;align-items:center;justify-content:center;font-size:30px;color:var(--text-3)"><span style="width:40px;height:40px;display:inline-flex">${ICONS.person}</span></div>`}
      <div style="display:flex;gap:8px">
        <button type="button" class="btn btn-ghost pressable upload-label" style="font-size:11.5px;padding:8px 14px" data-action="open-camera" data-target="profilePhoto">
          <span style="width:14px;height:14px;display:inline-flex">${ICONS.camera}</span> Kamera
        </button>
        <label class="btn btn-ghost pressable upload-label" style="font-size:11.5px;padding:8px 14px">
          <span style="width:14px;height:14px;display:inline-flex">${ICONS.image}</span> Galeri/File
          <input type="file" id="fileFallback_profilePhoto" accept="image/*" style="display:none" onchange="handlePhotoInput(event,'profilePhoto')">
        </label>
        ${state.profilePhoto ? `<span class="icon-btn pressable" data-action="clear-photo" data-value="profilePhoto" title="Hapus foto">${ICONS.close}</span>` : ''}
      </div>
    </div>
    <div class="settings-row" style="padding-top:12px"><span class="left">${ICONS.person}Nama pengguna</span><input class="field-input" style="width:150px;margin:0;padding:6px 10px;text-align:right;font-size:13px;font-weight:600;color:var(--blue)" value="${state.username.replace(/"/g,'&quot;')}" oninput="state.username=this.value"></div>
    <div class="settings-row"><span class="left">${ICONS.pin}Lokasi</span><span style="color:var(--text-2)">Kec. ${state.kecamatan}, ${state.kota}</span></div>
    <div style="padding:8px 14px 14px;font-size:10.5px;color:var(--text-3);line-height:1.5">Lokasi hanya bisa diganti 1x per 30 hari untuk mencegah abuse. ${state.locationCooldownDays>0? `Terakhir diganti ${state.locationCooldownDays} hari lalu — bisa diganti lagi dalam ${30-state.locationCooldownDays} hari.` : 'Kamu bisa mengganti lokasi sekarang.'}</div>
    <div class="list-row" data-action="open-wilayah" data-value="account"><span class="left">${ICONS.map}Ganti Lokasi</span><span>${ICONS.chev}</span></div>
    <div class="list-row" data-action="trigger-pwa-install"><span class="left">${ICONS.phone}Pasang Aplikasi di Layar Utama</span><span>${ICONS.chev}</span></div>
    <div class="list-row" data-action="logout" style="margin-top:10px"><span class="left" style="color:var(--blue)">${ICONS.back}Keluar (Logout)</span></div>
    <div class="list-row" data-action="delete-account"><span class="left" style="color:var(--red)">${ICONS.close}${state.deleteArmed? 'Tap sekali lagi untuk konfirmasi' : 'Hapus Akun'}</span></div>
  </div>`;
}
function contentUsahaDaftar(){
  const cat = BUSINESS_CATEGORIES.find(c=>c.id===state.businessCategory);
  const curKota = state.businessKota || state.kota || 'Surabaya';
  const curKec = state.businessKecamatan || state.kecamatan || 'Gubeng';
  const defCoords = getCityCoords(curKota);
  const curLat = (state.businessLat !== null && state.businessLat !== undefined ? state.businessLat : defCoords[0]).toFixed(4);
  const curLng = (state.businessLng !== null && state.businessLng !== undefined ? state.businessLng : defCoords[1]).toFixed(4);

  return `<div style="padding:14px">
    <p style="font-size:13px;font-weight:600;margin:0 0 8px">Nama usaha <span style="color:var(--red)">*</span></p>
    <input class="field-input" style="margin-bottom:14px" placeholder="Tulis nama usahamu..." value="${state.businessName.replace(/"/g,'&quot;')}" oninput="state.businessName=this.value">
    
    <p style="font-size:13px;font-weight:600;margin:0 0 8px">Kategori usaha <span style="color:var(--red)">*</span></p>
    <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px">
      ${BUSINESS_CATEGORIES.map(c=>`<span class="quick-chip ${state.businessCategory===c.id?'selected':''}" data-action="select-business-category" data-value="${c.id}">${c.label}</span>`).join('')}
    </div>

    <p style="font-size:13px;font-weight:600;margin:0 0 8px">Foto Tempat / Usaha</p>
    ${photoUploadBox('businessPhoto')}

    <p style="font-size:13px;font-weight:600;margin:0 0 8px">Wilayah Usaha</p>
    <div class="card pressable" style="font-size:11.5px;color:var(--text-2);margin-bottom:14px;display:flex;justify-content:space-between;align-items:center" data-action="open-wilayah" data-value="business">
      <span>Kec. ${curKec}, ${curKota}</span>
      <span style="color:var(--blue);font-weight:600;flex-shrink:0;margin-left:8px">Ubah</span>
    </div>

    <p style="font-size:13px;font-weight:600;margin:0 0 8px">Titik Lokasi Usaha di Peta <span style="color:var(--red)">*</span></p>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">
      <span class="quick-chip ${state.isPickingBizLocation?'selected':''}" data-action="pick-biz-location">Tentukan di Peta</span>
      <span class="quick-chip" data-action="get-my-biz-location">Lokasi Saya (GPS)</span>
    </div>
    <div style="font-size:11px;color:var(--text-2);background:rgba(0,0,0,0.04);padding:8px 12px;border-radius:10px;line-height:1.4;margin-bottom:10px">
      Titik terpilih: <b>${curLat}, ${curLng}</b>
      <span style="display:block;font-size:9.5px;color:var(--text-3);margin-top:2px">Ketuk "Tentukan di Peta" lalu klik titik toko/warung pada peta agar pin biru UMKM muncul tepat di lokasi usahamu.</span>
    </div>
  </div>`;
}
function renderPaymentMethodChips(methods){
  const list = Array.isArray(methods) && methods.length > 0 ? methods : ['tunai'];
  const labels = {
    'tunai': { label: 'Tunai / COD', color: 'chip-gray' },
    'qris': { label: 'QRIS', color: 'chip-blue' },
    'transfer': { label: 'Transfer Bank', color: 'chip-green' },
    'ewallet': { label: 'E-Wallet', color: 'chip-amber' },
    'kartu': { label: 'Kartu Debit/Kredit', color: 'chip-red' }
  };
  return list.map(m => {
    const item = labels[m] || { label: m, color: 'chip-gray' };
    return `<span class="chip ${item.color}" style="font-size:10px;padding:3px 8px">${item.label}</span>`;
  }).join('');
}

function contentInfoUsaha(){
  const curKota = state.businessKota || state.kota || 'Surabaya';
  const curKec = state.businessKecamatan || state.kecamatan || 'Gubeng';
  const defCoords = getCityCoords(curKota);
  const curLat = (state.businessLat !== null && state.businessLat !== undefined ? state.businessLat : defCoords[0]).toFixed(4);
  const curLng = (state.businessLng !== null && state.businessLng !== undefined ? state.businessLng : defCoords[1]).toFixed(4);

  return `<div style="padding:14px">
    <p style="font-size:11px;color:var(--text-2);margin:0 0 14px;line-height:1.5">Lengkapi profil dan informasi tempat usahamu. Warga sekitar dapat melihat rincian ini di peta ketika mengeklik usahamu.</p>

    <p style="font-size:12.5px;font-weight:600;margin:0 0 6px">Nama Usaha <span style="color:var(--red)">*</span></p>
    <input class="field-input" style="margin-bottom:14px" placeholder="Tulis nama usahamu..." value="${(state.businessName || '').replace(/"/g,'&quot;')}" oninput="state.businessName=this.value">

    <p style="font-size:12.5px;font-weight:600;margin:0 0 6px">Kategori Usaha <span style="color:var(--red)">*</span></p>
    <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px">
      ${BUSINESS_CATEGORIES.map(c=>`<span class="quick-chip ${state.businessCategory===c.id?'selected':''}" data-action="select-business-category" data-value="${c.id}">${c.label}</span>`).join('')}
    </div>

    <p style="font-size:12.5px;font-weight:600;margin:0 0 6px">Deskripsi Singkat Usaha</p>
    <textarea class="input-box" style="width:100%;height:84px;margin-bottom:14px;font-size:12px;box-sizing:border-box;line-height:1.4" placeholder="Ceritakan secara singkat mengenai menu/produk unggulan, layanan, jam ramai, atau pesanan katering..." oninput="state.businessDescription=this.value">${(state.businessDescription || '').replace(/</g,'&lt;')}</textarea>

    <p style="font-size:12.5px;font-weight:600;margin:0 0 6px">Nomor Kontak / WhatsApp</p>
    <input class="field-input" style="margin-bottom:14px" placeholder="Contoh: 081234567890 (bisa diklik warga untuk hubungi via WA)" value="${(state.businessPhone || '').replace(/"/g,'&quot;')}" oninput="state.businessPhone=this.value">

    <p style="font-size:12.5px;font-weight:600;margin:0 0 6px">Foto Tempat Usaha</p>
    ${photoUploadBox('businessPhoto')}

    <p style="font-size:12.5px;font-weight:600;margin:0 0 6px">Wilayah Usaha</p>
    <div class="card pressable" style="font-size:11.5px;color:var(--text-2);margin-bottom:14px;display:flex;justify-content:space-between;align-items:center" data-action="open-wilayah" data-value="business">
      <span>Kec. ${curKec}, ${curKota}</span>
      <span style="color:var(--blue);font-weight:600;flex-shrink:0;margin-left:8px">Ubah</span>
    </div>

    <p style="font-size:12.5px;font-weight:600;margin:0 0 6px">Titik Lokasi Usaha di Peta <span style="color:var(--red)">*</span></p>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">
      <span class="quick-chip ${state.isPickingBizLocation?'selected':''}" data-action="pick-biz-location">Tentukan di Peta</span>
      <span class="quick-chip" data-action="get-my-biz-location">Lokasi Saya (GPS)</span>
    </div>
    <div style="font-size:11px;color:var(--text-2);background:rgba(0,0,0,0.04);padding:8px 12px;border-radius:10px;line-height:1.4;margin-bottom:10px">
      Titik terpilih: <b>${curLat}, ${curLng}</b>
      <span style="display:block;font-size:9.5px;color:var(--text-3);margin-top:2px">Pin biru usahamu akan diletakkan di titik ini pada peta KoneKA warga sekitar.</span>
    </div>
  </div>`;
}

function contentMetodePembayaran(){
  const activeMethods = Array.isArray(state.businessPaymentMethods) ? state.businessPaymentMethods : ['tunai'];
  return `<div style="padding:14px">
    <p style="font-size:11px;color:var(--text-2);margin:0 0 14px;line-height:1.5">Centang metode pembayaran yang diterima di usaha atau toko Anda. Informasi ini akan ditampilkan di kartu usaha (marker biru) agar warga tahu cara bertransaksi.</p>

    <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px">
      ${PAYMENT_METHODS_LIST.map(m => {
        const isChecked = activeMethods.includes(m.id);
        return `<div class="card pressable" style="padding:12px;display:flex;align-items:flex-start;gap:12px;cursor:pointer;border-color:${isChecked ? 'var(--blue)' : 'var(--border)'};background:${isChecked ? 'rgba(0,122,255,0.03)' : 'var(--card-bg)'}" data-action="toggle-biz-payment" data-value="${m.id}">
          <input type="checkbox" style="margin-top:3px;width:16px;height:16px;cursor:pointer;pointer-events:none" ${isChecked ? 'checked' : ''}/>
          <div style="flex:1">
            <div style="display:flex;align-items:center;justify-content:space-between">
              <span style="font-size:12.5px;font-weight:600;color:var(--text-1)">${m.name}</span>
              ${isChecked ? `<span class="chip chip-blue" style="font-size:9.5px;padding:2px 6px">Aktif</span>` : ''}
            </div>
            <p style="font-size:11px;color:var(--text-3);margin:3px 0 0;line-height:1.35">${m.desc}</p>
          </div>
        </div>`;
      }).join('')}
    </div>

    <div style="background:rgba(0,0,0,0.03);padding:10px 12px;border-radius:10px;font-size:11px;color:var(--text-2);line-height:1.4">
      <span style="font-weight:600">Metode aktif:</span> ${activeMethods.map(id => {
        const f = PAYMENT_METHODS_LIST.find(p => p.id === id);
        return f ? f.name : id;
      }).join(', ')}
    </div>
  </div>`;
}

function umkmCardInner(){
  const b = state.selectedBiz || (state.hasBusiness ? {
    id: state._bizId,
    name: state.businessName,
    category: state.businessCategory,
    description: state.businessDescription,
    phone: state.businessPhone,
    paymentMethods: state.businessPaymentMethods,
    businessHours: state.businessHours,
    holidayActive: state.holidayActive,
    holidayNote: state.holidayNote,
    kota: state.businessKota || state.kota,
    kecamatan: state.businessKecamatan || state.kecamatan,
    photoUrl: state.businessPhoto
  } : null);

  const bizId = b?.id || b?._bizId || state._bizId || 'biz_temp';
  const name = b && b.name ? b.name : 'Usaha Warga Sekitar';
  const cat = b && b.category ? b.category : 'UMKM';
  const loc = `Kec. ${b && b.kecamatan ? b.kecamatan : state.kecamatan}, ${b && b.kota ? b.kota : state.kota}`;
  const photo = b && b.photoUrl ? b.photoUrl : null;
  const desc = b && (b.description || b.businessDescription) ? (b.description || b.businessDescription) : '';
  const phone = b && (b.phone || b.businessPhone) ? (b.phone || b.businessPhone) : '';
  const payMethods = b && (b.paymentMethods || b.businessPaymentMethods) ? (b.paymentMethods || b.businessPaymentMethods) : ['tunai'];

  // Trigger loading comments if not yet loaded for this business
  if(!state._bizCommentsCache) state._bizCommentsCache = {};
  if(bizId && state._loadedBizCommentsId !== bizId){
    state._loadedBizCommentsId = bizId;
    if(state.bizDetailComments && state.bizDetailComments.length > 0 && !state._bizCommentsCache[bizId]){
      state._bizCommentsCache[bizId] = [...state.bizDetailComments];
    } else if(Array.isArray(b?.comments) && b.comments.length > 0 && !state._bizCommentsCache[bizId]){
      state._bizCommentsCache[bizId] = [...b.comments];
    }
    state.bizDetailComments = state._bizCommentsCache[bizId] ? [...state._bizCommentsCache[bizId]] : [];
    if(state.bizDetailComments.length === 0){
      try {
        const stored = JSON.parse(localStorage.getItem('koneka_biz_comments_' + bizId) || '[]');
        if(Array.isArray(stored) && stored.length > 0){
          state.bizDetailComments = stored;
          state._bizCommentsCache[bizId] = stored;
        }
      } catch(e){}
    }

    if(typeof fbLoadBizComments === 'function'){
      state.isLoadingBizComments = (state.bizDetailComments.length === 0);
      fbLoadBizComments(bizId).then(list => {
        if(state._loadedBizCommentsId === bizId){
          state.isLoadingBizComments = false;
          state.bizDetailComments = Array.isArray(list) ? list : [];
          state._bizCommentsCache[bizId] = state.bizDetailComments;
          render();
        }
      }).catch(()=>{
        if(state._loadedBizCommentsId === bizId){
          state.isLoadingBizComments = false;
          render();
        }
      });
    }
  }

  // Today's hours calculation
  const DAY_NAMES = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
  const todayDay = DAY_NAMES[new Date().getDay()];
  const bHours = b?.businessHours || state.businessHours;
  const todayH = bHours ? bHours[todayDay] : null;
  let statusChip = '';
  if(b?.holidayActive){
    statusChip = `<span class="chip chip-red" style="font-size:10px">Tutup Sementara${b.holidayNote ? ' ('+b.holidayNote+')' : ''}</span>`;
  } else if(todayH && todayH.open){
    statusChip = `<span class="chip chip-green" style="font-size:10px">Buka Hari Ini (${todayH.from} - ${todayH.to})</span>`;
  } else {
    statusChip = `<span class="chip chip-gray" style="font-size:10px">Tutup Hari Ini</span>`;
  }

  const cleanPhone = phone ? phone.replace(/[^0-9]/g,'') : '';
  const waUrl = cleanPhone ? `https://wa.me/${cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone}` : null;

  const comments = state.bizDetailComments || [];

  return `<div class="sheet-body" style="max-height:85vh;overflow-y:auto">
    <div class="grabber"></div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
      <span style="font-size:10.5px;font-weight:600;color:var(--text-3);text-transform:uppercase;letter-spacing:0.4px">Detail Usaha Warga</span>
      <button type="button" class="icon-btn pressable" data-action="open-flag-biz" title="Laporkan Usaha" style="width:28px;height:28px;color:var(--red);display:inline-flex;align-items:center;justify-content:center">
        ${ICONS.flag}
      </button>
    </div>

    ${photo ? `<div class="umkm-photo pressable" data-action="zoom-photo" data-photo="${photo}" style="height:150px;background:#eee;border-radius:12px;overflow:hidden;margin-bottom:10px;cursor:pointer;position:relative">
      <img src="${photo}" style="width:100%;height:100%;object-fit:cover" alt="${name}"/>
      <span style="position:absolute;bottom:6px;right:6px;background:rgba(0,0,0,0.55);color:#fff;font-size:9.5px;padding:2px 6px;border-radius:4px">Ketuk untuk perbesar</span>
    </div>` : `<div class="umkm-photo" style="height:100px;background:rgba(0,122,255,0.06);border-radius:12px;display:flex;align-items:center;justify-content:center;color:var(--blue);margin-bottom:10px">
      <span style="width:36px;height:36px;display:inline-flex">${ICONS.store}</span>
    </div>`}

    <div style="font-weight:700;font-size:16px;margin:0 0 4px;color:var(--text-1)">${name}</div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-bottom:8px">
      <span class="chip chip-blue" style="font-size:10px">UMKM · ${cat}</span>
      ${statusChip}
    </div>

    <div style="display:flex;gap:6px;align-items:flex-start;margin:6px 0 10px;font-size:11.5px;color:var(--text-2)">
      <span style="flex-shrink:0;display:inline-flex;width:14px;height:14px;color:var(--text-3)">${ICONS.pin}</span>
      <span>${loc}</span>
    </div>

    ${desc ? `<div style="font-size:11.5px;line-height:1.5;color:var(--text-1);background:rgba(0,0,0,0.03);padding:8px 10px;border-radius:8px;margin-bottom:10px">
      ${desc.replace(/\n/g, '<br/>')}
    </div>` : ''}

    ${waUrl ? `<a href="${waUrl}" target="_blank" rel="noopener" class="btn btn-ghost pressable" style="display:flex;align-items:center;justify-content:center;gap:6px;font-size:11.5px;margin-bottom:10px;text-decoration:none;color:#16a34a;border:1px solid rgba(22,163,74,0.3);background:rgba(22,163,74,0.05);border-radius:8px;padding:8px 12px">
      Hubungi via WhatsApp (${phone})
    </a>` : ''}

    <div style="margin-bottom:12px">
      <div style="font-size:10.5px;font-weight:600;color:var(--text-3);text-transform:uppercase;letter-spacing:0.4px;margin-bottom:5px">Metode Pembayaran</div>
      <div style="display:flex;flex-wrap:wrap;gap:5px">
        ${renderPaymentMethodChips(payMethods)}
      </div>
    </div>

    <!-- Komentar & Ulasan Warga -->
    <div style="border-top:1px solid var(--border);padding-top:12px;margin-top:6px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <span style="font-size:11.5px;font-weight:600">Komentar &amp; Ulasan Warga (${comments.length})</span>
      </div>

      <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:10px;max-height:180px;overflow-y:auto">
        ${(state.isLoadingBizComments && comments.length === 0) ? renderCommentsSkeletonHTML() : (
          comments.length === 0 ? `
            <div style="text-align:center;font-size:11px;color:var(--text-3);padding:14px 0">
              Belum ada komentar. Berikan ulasan pertamamu untuk usaha ini!
            </div>
          ` : comments.map(c => `
            <div style="background:var(--card-bg, rgba(0,0,0,0.02));border:1px solid var(--border);border-radius:8px;padding:8px 10px">
              <div style="display:flex;justify-content:space-between;margin-bottom:3px">
                <span style="font-size:11px;font-weight:600;color:var(--text-1)">${c.username || 'Warga'}</span>
                <span style="font-size:9.5px;color:var(--text-3)">${c.createdAt ? _timeAgo(c.createdAt) : (c.createdAtIso ? 'Baru saja' : 'Baru saja')}</span>
              </div>
              <div style="font-size:11.5px;color:var(--text-2);line-height:1.4">${(c.text || '').replace(/</g,'&lt;')}</div>
            </div>
          `).join('')
        )}
      </div>

      <div style="display:flex;gap:6px">
        <input class="field-input" style="margin:0;font-size:11.5px;padding:7px 10px;flex:1" placeholder="Tulis komentar ulasan..." value="${(state.bizKomentarDraft || '').replace(/"/g,'&quot;')}" oninput="state.bizKomentarDraft=this.value" onkeydown="if(event.key==='Enter')dispatch('submit-biz-comment')">
        <button type="button" class="btn btn-primary pressable" style="height:34px;padding:0 12px;font-size:11.5px" data-action="submit-biz-comment">Kirim</button>
      </div>
    </div>

    ${((state.isAdmin || (typeof isUserAdmin === 'function' && isUserAdmin())) && b && (Number(b.flagCount || 0) >= 5 || b.needsAdminReview || b.flagStatus === 'pending_admin')) ? `
      <div style="margin-top:14px;padding:12px;border-radius:10px;background:rgba(220,38,38,0.06);border:1px solid rgba(220,38,38,0.25)">
        <div style="font-size:12px;font-weight:700;color:var(--red);margin-bottom:8px">Tindakan Moderasi Admin (${b.flagCount || 5} Laporan):</div>
        <div style="display:flex;gap:8px">
          <button type="button" class="btn btn-success pressable" style="flex:1;height:36px;font-size:11.5px;font-weight:700" data-action="admin-approve-biz" data-id="${bizId}">
            Setujui (Aman)
          </button>
          <button type="button" class="btn btn-danger pressable" style="flex:1;height:36px;font-size:11.5px;font-weight:700;background:var(--red);border-color:var(--red);color:#fff" data-action="admin-reject-biz" data-id="${bizId}">
            Tolak (Hapus)
          </button>
        </div>
      </div>
    ` : ''}

    ${((state.isAdmin || (typeof isUserAdmin === 'function' && isUserAdmin())) && b && !(Number(b.flagCount || 0) >= 5 || b.needsAdminReview || b.flagStatus === 'pending_admin')) ? `
      <div style="margin-top:14px;padding:10px 12px;border-radius:10px;background:rgba(0,122,255,0.06);border:1px solid rgba(0,122,255,0.2);display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:11px;font-weight:600;color:var(--blue)">Opsi Admin (Hak Akses Penuh)</span>
        <button type="button" class="btn btn-danger pressable" style="height:30px;padding:0 10px;font-size:11px;background:var(--red);border-color:var(--red);color:#fff" data-action="admin-reject-biz" data-id="${bizId}">
          Hapus Usaha
        </button>
      </div>
    ` : ''}

    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:14px;padding-top:10px;border-top:1px solid var(--border)">
      <button type="button" class="btn btn-ghost pressable" style="font-size:10.5px;color:var(--red);border-color:rgba(220,38,38,0.2)" data-action="open-flag-biz">
        Laporkan Usaha
      </button>
      <div class="btn btn-ghost pressable" style="font-size:11.5px;padding:6px 16px" data-action="close-overlay">Tutup</div>
    </div>
  </div>`;
}

function flagBizSheetInner(){
  return `<div class="sheet-body">
    <div class="grabber"></div>
    <p style="font-weight:600;font-size:14px;margin:2px 0 4px;color:var(--text-1)">Laporkan Usaha Ini</p>
    <p style="font-size:11px;color:var(--text-2);margin:0 0 12px;line-height:1.4">
      Bantu warga menjaga keakuratan informasi UMKM di lingkungan sekitar.
    </p>
    <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:14px">
      ${BIZ_FLAG_REASONS.map(r=>`<div class="quick-chip ${state.flagBizCategory===r?'selected':''} pressable" style="text-align:left;padding:10px 12px;font-size:11.5px" data-action="select-flag-biz-reason" data-value="${r}">${r}</div>`).join('')}
    </div>
    <div class="btn btn-primary pressable" style="background:var(--red);border-color:var(--red);color:#fff" data-action="flag-biz-submit">Kirim Laporan Usaha</div>
    <p style="text-align:center;font-size:11px;color:var(--text-3);margin-top:10px;cursor:pointer" data-action="close-overlay">Batal</p>
  </div>`;
}
function lightboxHTML(){
  const url = state.zoomPhotoUrl;
  return `<div class="lightbox" data-action="close-zoom" style="position:fixed;inset:0;background:rgba(0,0,0,0.92);z-index:10000;display:flex;align-items:center;justify-content:center">
    <button type="button" class="icon-btn pressable" style="position:absolute;top:18px;right:18px;background:rgba(255,255,255,0.18);border:none;color:#fff;width:40px;height:40px;border-radius:50%;z-index:10002" data-action="close-zoom">
      ${ICONS.close}
    </button>
    <div class="lightbox-inner" style="display:flex;align-items:center;justify-content:center;background:transparent;box-shadow:none;border:none;max-width:96vw;max-height:92vh;padding:0" data-action="close-zoom">
      ${url ? `<img src="${url}" style="max-width:92vw;max-height:88vh;object-fit:contain;border-radius:8px;box-shadow:0 12px 40px rgba(0,0,0,0.8);background:transparent" alt="Foto"/>` : `<div style="padding:20px;background:#18181B;border-radius:12px;color:#fff;text-align:center">Foto tidak tersedia</div>`}
    </div>
  </div>`;
}
function splashInner(){
  return `
    ${wordmark(true)}
    <p class="auth-tagline">Laporkan &amp; pantau masalah di sekitarmu langsung dari warga ke warga</p>
    <div style="margin:6px 0 6px">
      <div class="splash-feature"><span class="icon-wrap" style="width:16px;height:16px;display:inline-flex;color:var(--blue);margin-right:8px">${ICONS.map}</span><span>Lihat laporan &amp; UMKM di peta sekitarmu</span></div>
      <div class="splash-feature"><span class="icon-wrap" style="width:16px;height:16px;display:inline-flex;color:var(--blue);margin-right:8px">${ICONS.bell}</span><span>Lapor masalah, dibantu &amp; divalidasi tetangga</span></div>
      <div class="splash-feature"><span class="icon-wrap" style="width:16px;height:16px;display:inline-flex;color:var(--blue);margin-right:8px">${ICONS.store}</span><span>Temukan &amp; dukung usaha warga lokal</span></div>
    </div>
    <div class="btn btn-primary pressable" style="margin-top:12px" data-action="browse-guest">Lihat Peta Sekitar</div>
    <p class="auth-footer">Sudah punya akun? <b data-action="go-login" data-value="masuk">Masuk</b> &nbsp;·&nbsp; Baru di sini? <b data-action="go-login" data-value="daftar">Daftar</b></p>
  `;
}
function authRequiredInner(){
  return `<div class="sheet-body" style="text-align:center;padding-top:6px">
    <div class="grabber"></div>
    <div style="margin:6px 0 10px;display:flex;justify-content:center"><span style="width:32px;height:32px;display:inline-flex;color:var(--text-2)">${ICONS.lock}</span></div>
    <p style="font-weight:600;font-size:14px;margin:0 0 6px">Masuk dulu, yuk</p>
    <p style="font-size:12px;color:var(--text-2);margin:0 0 18px;line-height:1.5">${state.authPromptMsg || 'Fitur ini butuh akun supaya laporan & kontribusimu tersimpan.'}</p>
    <div class="btn btn-primary pressable" style="margin-bottom:8px" data-action="go-login" data-value="masuk">Masuk</div>
    <div class="btn btn-ghost pressable" style="margin-bottom:10px" data-action="go-login" data-value="daftar">Buat akun baru</div>
    <p style="font-size:11px;color:var(--text-3);cursor:pointer" data-action="close-overlay">Nanti dulu</p>
  </div>`;
}
function desktopSplashWrap(){
  return `<div style="min-height:400px;position:relative;display:flex;align-items:center;justify-content:center;overflow:hidden">
    <div class="card" style="max-width:340px;width:100%;padding:26px;position:relative;z-index:1">${splashInner()}</div>
  </div>`;
}
function authCardInner(){
  const isLogin = state.authMode !== 'daftar';
  return `
    ${wordmark(true)}
    <p class="auth-tagline">Bantu tetangga, bangun kampung</p>
    <div class="auth-tabs">
      <div class="auth-tab ${isLogin?'active':''}" data-action="switch-auth" data-value="masuk">Masuk</div>
      <div class="auth-tab ${!isLogin?'active':''}" data-action="switch-auth" data-value="daftar">Daftar</div>
    </div>
    ${!isLogin ? `<label class="field-label">Nama pengguna</label><input class="field-input" placeholder="Nama kamu" value="${state.regUsername.replace(/"/g,'&quot;')}" oninput="state.regUsername=this.value">` : ''}
    <label class="field-label">Email atau No. HP</label>
    <input class="field-input" placeholder="nama@email.com" value="${state.authEmail.replace(/"/g,'&quot;')}" oninput="state.authEmail=this.value">
    <label class="field-label">Kata sandi</label>
    <input class="field-input" type="password" placeholder="••••••••" value="${state.authPassword}" oninput="state.authPassword=this.value">
    ${!isLogin ? `
    ${ghostInputHTML('regKotaInput', 'regKota', 'Ketik nama kota (misal: Lamongan, Gresik, Malang)...', state.regKota, 'Kota Asal')}
    ${ghostInputHTML('regKecamatanInput', 'regKecamatan', 'Ketik nama kecamatan (misal: Babat, Kebomas, Klojen)...', state.regKecamatan, 'Kecamatan')}
    ` : ''}
    <div style="height:12px"></div>
    <div class="btn btn-primary pressable" data-action="do-login">${isLogin?'Masuk':'Buat akun'}</div>
    <p class="auth-footer" style="margin-top:14px">${isLogin? 'Belum punya akun? ' : 'Sudah punya akun? '}<b data-action="switch-auth" data-value="${isLogin?'daftar':'masuk'}">${isLogin?'Daftar':'Masuk'}</b></p>
  `;
}
/* ---------- Email Verification System (5-character code, 3-minute expiry) ---------- */
function generateVerificationCode(){
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let res = '';
  for(let i = 0; i < 5; i++){
    res += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return res;
}

function getVerificationEmailHTML(name, code){
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verifikasi Akun KoneKA</title>
</head>
<body style="margin:0;padding:32px 14px;background-color:#F2F4F7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111827;-webkit-font-smoothing:antialiased;">
  <div style="max-width:460px;margin:0 auto;background:#FFFFFF;border-radius:18px;overflow:hidden;border:1px solid #E5E7EB;box-shadow:0 8px 30px rgba(0,0,0,0.06);">
    <!-- Header Brand & Profile Photo -->
    <div style="background:#FFFFFF;border-top:4px solid #007AFF;padding:28px 24px 18px;text-align:center;">
      <img src="https://koneka.netlify.app/icon-192.png" alt="KoneKA" width="58" height="58" style="width:58px;height:58px;border-radius:50%;display:block;margin:0 auto 12px;box-shadow:0 4px 14px rgba(0,122,255,0.22);border:2px solid #FFFFFF;">
      <h1 style="margin:0 0 4px;font-size:20px;font-weight:800;color:#111827;letter-spacing:-0.02em;">Verifikasi Akun KoneKA</h1>
      <p style="margin:0;font-size:12.5px;color:#6B7280;font-weight:500;">Portal Kolaborasi Warga &amp; Pemberdayaan UMKM</p>
    </div>

    <!-- Divider -->
    <div style="height:1px;background:#F3F4F6;margin:0 24px;"></div>

    <!-- Message Body: Menyapa nama dan langsung ngasih kode -->
    <div style="padding:24px 24px 28px;text-align:center;">
      <h2 style="margin:0 0 12px;font-size:18px;font-weight:700;color:#1F2937;">Halo, ${name}!</h2>
      <p style="margin:0 0 14px;font-size:13.5px;color:#4B5563;line-height:1.5;">Kode verifikasi akun Anda:</p>
      <div style="background:#F0F7FF;border:2px dashed #007AFF;border-radius:14px;padding:14px 24px;display:inline-block;margin:6px 0 14px;">
        <span style="font-family:'SF Mono',Menlo,Monaco,Consolas,'Courier New',monospace;font-size:34px;font-weight:800;letter-spacing:9px;color:#007AFF;display:inline-block;">
          ${code}
        </span>
      </div>
      <p style="margin:0;font-size:12px;color:#9CA3AF;">Kode ini berlaku selama 15 menit.</p>
    </div>

    <!-- Footer -->
    <div style="background:#F9FAFB;border-top:1px solid #F3F4F6;padding:14px 24px;text-align:center;">
      <p style="margin:0;font-size:11px;color:#9CA3AF;line-height:1.5;">Email verifikasi resmi dari KoneKA. Jangan berikan kode ini kepada siapa pun.</p>
    </div>
  </div>
</body>
</html>`;
}

async function sendVerificationEmail(email, code, userInstance){
  const recipientName = (state.pendingReg && state.pendingReg.username) || state.username || 'Warga';
  console.log(`[KoneKA Auth] Memproses pengiriman kode verifikasi ke ${email}`);
  const emailHtml = getVerificationEmailHTML(recipientName, code);
  const emailSubject = `Kode Verifikasi Akun KoneKA: ${code}`;
  const emailText = `Halo ${recipientName},\n\nKode verifikasi akun KoneKA Anda: ${code}\n\nKode ini berlaku selama 15 menit.\n\nVerifikasi Akun KoneKA — Portal Kolaborasi Warga & Pemberdayaan UMKM.\nJangan berikan kode ini kepada siapa pun.`;

  let emailSent = false;

  // 1. Pengiriman Utama: EmailJS (Terhubung langsung ke Gmail, bebas DNS, masuk tab Utama)
  try {
    const controller = new AbortController();
    const timerId = setTimeout(() => controller.abort(), 4500);
    const emailjsRes = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: 'service_45cinls',
        template_id: 'template_foh0gmm',
        user_id: 'Oe-D89PMSxaBBDxZB',
        template_params: {
          to_email: email,
          email: email,
          to_name: recipientName,
          name: recipientName,
          user_name: recipientName,
          otp_code: code,
          code: code,
          subject: emailSubject,
          message: emailText,
          logo_url: 'https://koneka.netlify.app/icon-192.png',
          logo: 'https://koneka.netlify.app/icon-192.png',
          icon_url: 'https://koneka.netlify.app/icon-192.png',
          image_url: 'https://koneka.netlify.app/icon-192.png',
          koneka_logo: 'https://koneka.netlify.app/icon-192.png',
          html: emailHtml,
          html_content: emailHtml
        }
      })
    });
    clearTimeout(timerId);
    if(emailjsRes.ok){
      console.log('[KoneKA Auth] Email verifikasi berhasil dikirim via EmailJS');
      showToast('Kode verifikasi telah dikirim ke ' + email, 'success');
      emailSent = true;
      return true;
    } else {
      const ejErr = await emailjsRes.text();
      console.warn('[KoneKA Auth] EmailJS notice:', ejErr);
    }
  } catch(ejErr){
    console.warn('[KoneKA Auth] EmailJS fetch notice:', ejErr);
  }

  // 2. Pengiriman Cadangan: Netlify Serverless Function (Resend / EmailJS server)
  try {
    const netlifyRes = await fetch('/.netlify/functions/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: email,
        name: recipientName,
        code: code,
        subject: emailSubject,
        html: emailHtml,
        text: emailText
      })
    });
    if(netlifyRes.ok){
      const netlifyData = await netlifyRes.json();
      if(netlifyData && netlifyData.success){
        console.log('[KoneKA Auth] Email verifikasi berhasil dikirim via server function:', netlifyData);
        showToast('Kode verifikasi telah dikirim ke ' + email, 'success');
        emailSent = true;
        return true;
      } else if(netlifyData && netlifyData.error){
        console.warn('[KoneKA Auth] Server function notice:', netlifyData.error);
      }
    }
  } catch(netErr){
    console.warn('[KoneKA Auth] Server function dispatch notice:', netErr);
  }

  // 3. Intelligent Failover: Jika provider eksternal mengalami kendala
  if(!emailSent){
    console.log('[KoneKA Auth] Mengaktifkan failover pengiriman email cadangan');
    try {
      let targetUser = userInstance || (typeof auth !== 'undefined' && auth.currentUser);
      if(targetUser){
        await targetUser.updateProfile({ displayName: recipientName }).catch(()=>{});
        await targetUser.sendEmailVerification();
        console.log('[KoneKA Auth] Email verifikasi berhasil dikirim via failover channel');
        showToast('Email verifikasi dikirim ke ' + email, 'info');
      }
    } catch(fbErr){
      console.warn('Failover email dispatch notice:', fbErr);
    }
  }
}

async function finalizeRegistration(){
  const p = state.pendingReg;
  if(!p) return null;

  // Daftarkan ke Firebase Auth dan Firestore HANYA setelah kode terverifikasi!
  let userUid = null;
  if(!auth.currentUser){
    const credUser = await fbRegister(p.email, p.pass, p.username, p.kota, p.kecamatan);
    userUid = credUser ? credUser.uid : null;
  } else {
    userUid = auth.currentUser.uid;
    await db.collection('users').doc(userUid).set({
      username: p.username,
      email: p.email,
      kota: p.kota,
      kecamatan: p.kecamatan,
      avatarUrl: null,
      theme: 'light',
      locationChangedAt: null,
      contributionCount: 0,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  }

  // Bersihkan timer dan state verifikasi
  if(_verifyTimerInterval){ clearInterval(_verifyTimerInterval); _verifyTimerInterval = null; }
  state.pendingReg = null;
  state.verifyTargetCode = '';
  state.verifyCode = '';
  state.verifyExpiresAt = 0;
  state.resendCooldownUntil = 0;
  const userCityCoords = getCityCoords(p.kota);
  state.reportLat = userCityCoords[0];
  state.reportLng = userCityCoords[1];
  if(mapInstance){
    mapInstance.setView(userCityCoords, 14);
  }
  state.guest = false;
  state.screen = 'map';
  state.tab = 'map';
  state.overlay = null;
  render(true);
  showToast('Akun berhasil diverifikasi & didaftarkan! Selamat datang di KoneKA', 'success');
  setTimeout(() => showPushNotification('Selamat bergabung', 'Cek peta untuk melihat laporan di sekitarmu'), 1200);
  triggerPwaInstallPromptIfNeeded();

  return userUid;
}

let _verifyTimerInterval = null;
let _lastReloadCheck = 0;
let _isReloading = false;
function startVerifyTimer(){
  if(_verifyTimerInterval) clearInterval(_verifyTimerInterval);
  _lastReloadCheck = 0;
  _isReloading = false;
  _verifyTimerInterval = setInterval(() => {
    if(state.screen !== 'verify-email'){
      clearInterval(_verifyTimerInterval);
      _verifyTimerInterval = null;
      return;
    }
    const timeLeft = Math.max(0, Math.floor((state.verifyExpiresAt - Date.now()) / 1000));
    const elTimer = el('verifyTimerCountdown');
    if(elTimer){
      if(timeLeft > 0){
        const m = String(Math.floor(timeLeft / 60)).padStart(2, '0');
        const s = String(timeLeft % 60).padStart(2, '0');
        elTimer.innerHTML = `Sisa waktu kode: <b style="color:var(--blue)">${m}:${s}</b>`;
      } else {
        elTimer.innerHTML = `<span style="color:var(--red);font-weight:600">Kode telah kedaluwarsa. Silakan kirim ulang.</span>`;
      }
    }

    // Cooldown Kirim Ulang (1 menit / 60 detik)
    const resendLeft = Math.max(0, Math.ceil(((state.resendCooldownUntil || 0) - Date.now()) / 1000));
    const btnResend = el('btnResendVerify');
    if(btnResend){
      if(resendLeft > 0){
        btnResend.textContent = `Kirim Ulang Kode (${resendLeft}d)`;
        btnResend.style.opacity = '0.5';
        btnResend.style.pointerEvents = 'none';
        btnResend.removeAttribute('data-action');
      } else {
        btnResend.textContent = 'Kirim Ulang Kode';
        btnResend.style.opacity = '1';
        btnResend.style.pointerEvents = 'auto';
        btnResend.setAttribute('data-action', 'resend-verify-code');
      }
    }

    // Auto-detect jika user klik link di Gmail (dibatasi tiap 8 detik agar hemat bandwidth dan bebas delay)
    const now = Date.now();
    if(now - _lastReloadCheck >= 8000 && !_isReloading && auth.currentUser && !auth.currentUser.emailVerified && typeof auth.currentUser.reload === 'function'){
      _lastReloadCheck = now;
      _isReloading = true;
      auth.currentUser.reload().then(() => {
        _isReloading = false;
        if(auth.currentUser && auth.currentUser.emailVerified && state.pendingReg){
          console.log('[KoneKA Auth] Email terverifikasi via link Gmail');
          finalizeRegistration();
        }
      }).catch(() => { _isReloading = false; });
    }
  }, 1000);
}

function verifyEmailCardInner(){
  const email = (state.pendingReg && state.pendingReg.email) || state.authEmail || 'email Anda';
  const timeLeft = Math.max(0, Math.floor((state.verifyExpiresAt - Date.now()) / 1000));
  const m = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const s = String(timeLeft % 60).padStart(2, '0');
  const isExpired = timeLeft <= 0;

  const resendLeft = Math.max(0, Math.ceil(((state.resendCooldownUntil || 0) - Date.now()) / 1000));
  const isResendDisabled = resendLeft > 0;
  const resendBtnText = isResendDisabled ? `Kirim Ulang Kode (${resendLeft}d)` : 'Kirim Ulang Kode';

  return `
    ${wordmark(true)}
    <p class="auth-tagline" style="margin-bottom:16px">Verifikasi Akun KoneKA</p>
    <div style="background:rgba(0,122,255,0.06);border:1px solid rgba(0,122,255,0.18);border-radius:12px;padding:14px 16px;margin-bottom:16px;text-align:left">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
        <span style="display:inline-flex;width:18px;height:18px;color:var(--blue)">${ICONS.bell || ICONS.receipt}</span>
        <span style="font-size:13px;color:var(--text-1);font-weight:700">Kode Verifikasi Telah Dikirim</span>
      </div>
      <p style="font-size:12px;color:var(--text-2);margin:0 0 6px;line-height:1.5">
        Kode verifikasi telah dikirim ke <b>${email}</b>. Periksa <b>Kotak Masuk (Inbox)</b>, tab <b>Pembaruan</b>, atau folder <b>Spam</b> di Gmail Anda.
      </p>
      <p style="font-size:11px;color:var(--text-3);margin:0;line-height:1.4">
        Buka email verifikasi dari <b>KoneKA</b> di Gmail Anda lalu masukkan 5 karakter kode di bawah.
      </p>
    </div>

    <label class="field-label" style="text-align:center;display:block;margin-bottom:8px">Masukkan Kode 5 Karakter</label>
    <div style="margin-bottom:10px">
      <input class="field-input" id="verifyCodeInput" maxlength="5" autocomplete="off"
        style="text-align:center;font-size:24px;letter-spacing:10px;text-transform:uppercase;font-weight:800;font-family:monospace;padding:12px;box-sizing:border-box"
        placeholder="•••••" value="${state.verifyCode || ''}"
        oninput="state.verifyCode=this.value.toUpperCase(); if(this.value.length===5){ const b=document.querySelector('[data-action=submit-verify-code]'); if(b) b.click(); }"
        onkeydown="if(event.key==='Enter'){ const b=document.querySelector('[data-action=submit-verify-code]'); if(b) b.click(); }">
    </div>

    <div id="verifyTimerCountdown" style="text-align:center;font-size:12px;color:var(--text-2);margin-bottom:14px">
      ${isExpired ? '<span style="color:var(--red);font-weight:600">Kode telah kedaluwarsa. Silakan kirim ulang.</span>' : `Sisa waktu kode: <b style="color:var(--blue)">${m}:${s}</b>`}
    </div>

    <div class="btn btn-primary pressable" data-action="submit-verify-code" style="font-weight:700">
      Verifikasi &amp; Buat Akun
    </div>

    <div class="btn btn-ghost pressable" id="btnResendVerify" ${isResendDisabled ? 'style="margin-top:8px;opacity:0.5;pointer-events:none"' : 'data-action="resend-verify-code" style="margin-top:8px"'}>
      ${resendBtnText}
    </div>

    <div style="text-align:center;margin-top:12px">
      <span class="pressable" data-action="check-email-verified" style="font-size:11.5px;color:var(--blue);cursor:pointer;text-decoration:underline">
        Sudah klik link di Gmail? Ketuk untuk verifikasi
      </span>
    </div>

    <p class="auth-footer" style="margin-top:14px"><b data-action="cancel-verify">Kembali ke Pendaftaran</b></p>
  `;
}

function desktopAuthWrap(){
  const inner = state.screen === 'verify-email' ? verifyEmailCardInner() : authCardInner();
  return `<div style="min-height:400px;position:relative;display:flex;align-items:center;justify-content:center;overflow:hidden">
    <div class="card" style="max-width:340px;width:100%;padding:26px;position:relative;z-index:1">${inner}</div>
  </div>`;
}

/* ---------- Mobile renderer ---------- */
/* ---------- Desktop renderer ---------- */
function desktopNavHTML(){
  if(state.screen==='login' || state.screen==='splash' || state.screen==='verify-email'){
    return `<div class="nav-brand">${wordmark(false)}</div>`;
  }
  return `<div class="nav-brand pressable" data-action="set-tab" data-value="map" title="KoneKA">
      ${wordmark(false)}
    </div>
    <div class="links">
      ${TABS.map(t=>`<span class="nav-tab pressable ${state.tab===t.id?'active':''}" data-action="set-tab" data-value="${t.id}">${t.icon}${t.label}</span>`).join('')}
    </div>
    <span class="nav-actions" style="display:flex;align-items:center;gap:8px">
      <span class="pill pressable" data-action="open-wilayah" data-value="account">${miniPin()} Kec. ${state.kecamatan}, ${state.kota}</span>
      ${!state.guest ? `<span class="icon-btn pressable" data-action="open-leaderboard" title="Papan Kontribusi">${ICONS.badge}</span>` : ''}
      ${state.guest ? `<span class="btn btn-primary pressable" style="padding:6px 14px;font-size:11.5px" data-action="go-login" data-value="masuk">Masuk</span>` : ''}
    </span>`;
}

function mobileBottomNavHTML(){
  if(state.screen==='login' || state.screen==='splash' || state.screen==='verify-email') return '';
  return TABS.map(t => {
    const isActive = state.tab === t.id;
    return `<div class="mobile-tab pressable ${isActive?'active':''}" data-action="set-tab" data-value="${t.id}">
      <span class="mobile-tab-icon">${t.icon}</span>
      <span class="mobile-tab-label">${t.label}</span>
    </div>`;
  }).join('');
}

function pwaInstallInner(){
  return `<div class="sheet-body" style="text-align:center;padding:22px 18px">
    <div class="grabber"></div>
    <div style="width:58px;height:58px;margin:8px auto 14px;border-radius:18px;background:linear-gradient(135deg,#007AFF,#0051C6);display:flex;align-items:center;justify-content:center;box-shadow:0 8px 24px rgba(0,122,255,0.35);color:#fff;font-weight:900;font-size:24px;letter-spacing:-0.5px">
      K
    </div>
    <p style="font-weight:800;font-size:16.5px;margin:0 0 6px;color:var(--text-1)">Pasang Aplikasi KoneKA</p>
    <p style="font-size:12.5px;color:var(--text-2);margin:0 0 20px;line-height:1.5;max-width:300px;margin-left:auto;margin-right:auto">
      Pasang aplikasi di layar utama ponsel Anda untuk akses lebih cepat, ringan, dan praktis langsung tanpa membuka peramban.
    </p>
    <div class="btn btn-primary pressable" style="height:44px;font-size:13.5px;font-weight:700;margin-bottom:10px" data-action="do-pwa-install">
      Pasang Sekarang
    </div>
    <div class="btn btn-ghost pressable" style="height:40px;font-size:12px" data-action="close-pwa-install">
      Nanti Saja
    </div>
  </div>`;
}
function contentAreaDHTML(){
  if(state.isPickingBizLocation || state.isPickingLocation) return contentMap();
  const s = state.screen;
  if(s==='splash') return desktopSplashWrap();
  if(s==='login' || s==='verify-email') return desktopAuthWrap();
  if(s==='usaha') return contentUsaha();
  if(s==='aktivitas') return contentAktivitas();
  if(s==='profil') return contentProfil();
  // when on a pushed screen (detail/form/leaderboard/settings/usaha-daftar), show the underlying tab content behind the modal
  const PUSHED = ['detail','form','lapor','leaderboard','settings','usaha-daftar','jam-operasional','produk-tambah','invoice-tambah','transaksi-tambah','invoice-detail','info-usaha','metode-pembayaran'];
  const base = PUSHED.includes(s) ? state.tab : s;
  if(base==='usaha') return contentUsaha();
  if(base==='aktivitas') return contentAktivitas();
  if(base==='profil') return contentProfil();
  return contentMap();
}

/* ---------- Progressive Web App (PWA) Support ---------- */
let deferredInstallPrompt = null;

if ('serviceWorker' in navigator) {
  if ('caches' in window) {
    caches.keys().then(keys => {
      keys.forEach(k => {
        if (k !== 'koneka-cache-v6') caches.delete(k);
      });
    });
  }
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js?v=6').then(reg => {
      reg.update();
      reg.onupdatefound = () => {
        const worker = reg.installing;
        if(worker) {
          worker.onstatechange = () => {
            if(worker.state === 'installed' && navigator.serviceWorker.controller) {
              window.location.reload();
            }
          };
        }
      };
    }).catch(err => console.log('SW reg error:', err));
  });
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  state.canInstallPWA = true;
});

window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
  localStorage.setItem('koneka_pwa_installed', 'true');
  showToast('Aplikasi KoneKA telah berhasil dipasang di ponsel Anda', 'success');
});

function triggerPwaInstallPromptIfNeeded() {
  setTimeout(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    const installed = localStorage.getItem('koneka_pwa_installed') === 'true';
    const lastDismissed = parseInt(localStorage.getItem('koneka_pwa_dismissed') || '0', 10);
    const cooldownPassed = (Date.now() - lastDismissed) > (24 * 60 * 60 * 1000);

    if (!isStandalone && !installed && cooldownPassed) {
      state.overlay = 'pwaInstall';
      render();
    }
  }, 900);
}

let mapInstance = null;
let tileLayer = null;
let pickMarker = null;
let bizPickMarker = null;
let markerClusterGroup = null;

function initLeafletMap(){
  if(mapInstance) return;
  mapInstance = L.map('leafletMapContainer', {
    zoomControl: false,
    scrollWheelZoom: true,
    doubleClickZoom: true,
    touchZoom: true,
    dragging: true,
    inertia: true,
    inertiaDeceleration: 3000,
    zoomSnap: 0.5,
    zoomDelta: 0.5,
    maxZoom: 19,
    minZoom: 5
  }).setView(getCityCoords(state.kota), 14);

  const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  tileLayer = L.tileLayer(tileUrl, {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
  }).addTo(mapInstance);

  if(typeof L.markerClusterGroup === 'function'){
    markerClusterGroup = L.markerClusterGroup({
      maxClusterRadius: 45,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      disableClusteringAtZoom: 18,
      animate: true,
      animateAddingMarkers: false,
      iconCreateFunction: function(cluster){
        const count = cluster.getChildCount();
        return L.divIcon({
          html: `<div class="koneka-cluster-badge">${count}</div>`,
          className: 'koneka-cluster-icon',
          iconSize: [40, 40],
          iconAnchor: [20, 20]
        });
      }
    });
    mapInstance.addLayer(markerClusterGroup);
  }

  // Support interactive location picker
  mapInstance.on('click', (e) => {
    if(state.isPickingLocation){
      state.reportLat = e.latlng.lat;
      state.reportLng = e.latlng.lng;
      state.isPickingLocation = false;
      if(pickMarker) mapInstance.removeLayer(pickMarker);
      pickMarker = L.marker([state.reportLat, state.reportLng], {
        icon: L.divIcon({
          className: 'gmap-leaflet-marker',
          html: `<div class="gmap-pin-inner" style="width:28px;height:36px">${pinSvg('red')}</div>`,
          iconSize: [28, 36],
          iconAnchor: [14, 36]
        })
      }).addTo(mapInstance);
      pushScreen('lapor');
      showToast('Lokasi laporan berhasil disesuaikan (' + e.latlng.lat.toFixed(4) + ', ' + e.latlng.lng.toFixed(4) + ')', 'success');
      return;
    }
    if(state.isPickingBizLocation){
      state.businessLat = e.latlng.lat;
      state.businessLng = e.latlng.lng;
      state.isPickingBizLocation = false;
      if(bizPickMarker) mapInstance.removeLayer(bizPickMarker);
      bizPickMarker = L.marker([state.businessLat, state.businessLng], {
        icon: L.divIcon({
          className: 'gmap-leaflet-marker',
          html: `<div class="gmap-pin-inner" style="width:28px;height:36px">${pinSvg('var(--blue)')}</div>`,
          iconSize: [28, 36],
          iconAnchor: [14, 36]
        })
      }).addTo(mapInstance);
      pushScreen(state._pickingReturnScreen || 'usaha-daftar');
      showToast('Titik usaha berhasil disesuaikan (' + e.latlng.lat.toFixed(4) + ', ' + e.latlng.lng.toFixed(4) + ')', 'success');
      return;
    }
  });

  // Initial markers from Firestore
  if(typeof refreshMapMarkers === 'function') refreshMapMarkers();
}

function renderDesktopScreen(animated){
  el('desktopNavBar').innerHTML = desktopNavHTML();
  const mobNav = el('mobileBottomNav');
  if(mobNav) mobNav.innerHTML = mobileBottomNavHTML();

  const usahaActive = state.screen==='usaha' || ((state.screen==='detail'||state.screen==='form') && state.tab==='usaha');
  el('subtabAreaD').innerHTML = (state.screen==='login' || state.screen==='splash' || state.screen==='verify-email' || !usahaActive) ? '' : subtabFor('usaha');

  const contentEl = el('contentAreaD');
  contentEl.innerHTML = contentAreaDHTML();
  
  const PUSHED_SCREENS_LIST = ['detail','form','lapor','leaderboard','settings','usaha-daftar','jam-operasional','produk-tambah','invoice-tambah','transaksi-tambah','invoice-detail','info-usaha','metode-pembayaran'];
  const baseScreen = PUSHED_SCREENS_LIST.includes(state.screen) ? state.tab : state.screen;
  const mapContainer = el('leafletMapContainer');
  if(baseScreen === 'map' || state.isPickingBizLocation || state.isPickingLocation) {
    mapContainer.style.display = 'block';
    contentEl.style.pointerEvents = 'none';
    if(typeof initLeafletMap === 'function') initLeafletMap();
    if(mapInstance) setTimeout(()=> mapInstance.invalidateSize(), 50);
  } else {
    mapContainer.style.display = 'none';
    contentEl.style.pointerEvents = '';
  }

  const PUSHED_SCREENS = ['detail','form','lapor','leaderboard','settings','usaha-daftar','jam-operasional','produk-tambah','invoice-tambah','transaksi-tambah','invoice-detail','info-usaha','metode-pembayaran'];
  const needsModal = PUSHED_SCREENS.includes(state.screen) || !!state.overlay;
  const modalEl = el('modalLayerD');
  if(needsModal){
    contentEl.style.filter='blur(2px)'; contentEl.style.opacity='.5';
    let inner='', closeAction='close-overlay';
    if(state.overlay==='amber'){ inner = amberSheetInner(); }
    else if(state.overlay==='umkm'){ inner = umkmCardInner(); }
    else if(state.overlay==='authRequired'){ inner = authRequiredInner(); }
    else if(state.overlay==='flag'){ inner = flagSheetInner(); }
    else if(state.overlay==='flagBiz'){ inner = flagBizSheetInner(); }
    else if(state.overlay==='wilayah'){ inner = wilayahSheetInner(); }
    else if(state.overlay==='pwaInstall'){ inner = pwaInstallInner(); closeAction='close-pwa-install'; }
    else if(state.screen==='detail'){ inner = fullscreenHeader('detail') + `<div style="padding:14px 6px">${contentDetail()}</div>` + bottomFor('detail'); closeAction='close-pushed'; }
    else if(state.screen==='form'){ inner = fullscreenHeader('form') + `<div style="padding:14px 6px">${contentForm()}</div>` + bottomFor('form'); closeAction='close-pushed'; }
    else if(state.screen==='lapor'){ inner = fullscreenHeader('lapor') + `<div style="padding:14px 6px">${contentLapor()}</div>` + bottomFor('lapor'); closeAction='close-pushed'; }
    else if(state.screen==='leaderboard'){ inner = fullscreenHeader('leaderboard') + `<div style="padding:14px 6px">${contentLeaderboard()}</div>`; closeAction='close-pushed'; }
    else if(state.screen==='settings'){ inner = fullscreenHeader('settings') + `<div style="padding:0 6px">${contentSettings()}</div>`; closeAction='close-pushed'; }
    else if(state.screen==='usaha-daftar'){ inner = fullscreenHeader('usaha-daftar') + `<div style="padding:14px 6px">${contentUsahaDaftar()}</div>` + bottomFor('usaha-daftar'); closeAction='close-pushed'; }
    else if(state.screen==='jam-operasional'){ inner = fullscreenHeader('jam-operasional') + `<div style="padding:14px 6px">${contentJamOperasional()}</div>` + bottomFor('jam-operasional'); closeAction='close-pushed'; }
    else if(state.screen==='produk-tambah'){ inner = fullscreenHeader('produk-tambah') + `<div style="padding:14px 6px">${contentProdukTambah()}</div>` + bottomFor('produk-tambah'); closeAction='close-pushed'; }
    else if(state.screen==='invoice-tambah'){ inner = fullscreenHeader('invoice-tambah') + `<div style="padding:14px 6px">${contentInvoiceTambah()}</div>` + bottomFor('invoice-tambah'); closeAction='close-pushed'; }
    else if(state.screen==='transaksi-tambah'){ inner = fullscreenHeader('transaksi-tambah') + `<div style="padding:14px 6px">${contentTransaksiTambah()}</div>` + bottomFor('transaksi-tambah'); closeAction='close-pushed'; }
    else if(state.screen==='invoice-detail'){ inner = fullscreenHeader('invoice-detail') + contentInvoiceDetail(); closeAction='close-pushed'; }
    else if(state.screen==='info-usaha'){ inner = fullscreenHeader('info-usaha') + `<div style="padding:14px 6px">${contentInfoUsaha()}</div>` + bottomFor('info-usaha'); closeAction='close-pushed'; }
    else if(state.screen==='metode-pembayaran'){ inner = fullscreenHeader('metode-pembayaran') + `<div style="padding:14px 6px">${contentMetodePembayaran()}</div>` + bottomFor('metode-pembayaran'); closeAction='close-pushed'; }
    const currentModalKey = state.overlay
      ? ('overlay:' + state.overlay + ':' + (state.selectedBiz?.id || state._bizId || currentReportId || ''))
      : ('screen:' + state.screen + ':' + (currentReportId || ''));
    
    const existingScrim = modalEl && modalEl.querySelector ? modalEl.querySelector('.overlay-scrim') : null;
    const existingSheet = modalEl && modalEl.querySelector ? modalEl.querySelector('.sheet') : null;

    if(existingScrim && existingSheet && modalEl && modalEl.getAttribute && modalEl.getAttribute('data-active-modal') === currentModalKey){
      if(existingScrim.setAttribute) existingScrim.setAttribute('data-action', closeAction);
      const prevScrollTop = existingSheet.scrollTop;
      const activeEl = document.activeElement;
      const isInputFocused = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');
      const activePlaceholder = activeEl ? activeEl.placeholder : null;
      const selStart = isInputFocused ? activeEl.selectionStart : null;
      const selEnd = isInputFocused ? activeEl.selectionEnd : null;

      existingSheet.innerHTML = inner;
      existingSheet.scrollTop = prevScrollTop;

      if(isInputFocused && activePlaceholder && existingSheet.querySelector){
        const newFocusEl = existingSheet.querySelector(`[placeholder="${activePlaceholder}"]`);
        if(newFocusEl && newFocusEl.focus){
          newFocusEl.focus();
          try { newFocusEl.setSelectionRange(selStart, selEnd); } catch(e){}
        }
      }
    } else {
      if(modalEl && modalEl.setAttribute) modalEl.setAttribute('data-active-modal', currentModalKey);
      if(modalEl) modalEl.innerHTML = `<div class="overlay-scrim" style="position:absolute;inset:0" data-action="${closeAction}">
        <div class="sheet sheet-desktop">${inner}</div>
      </div>`;
    }
  } else {
    contentEl.style.filter=''; contentEl.style.opacity='';
    if(modalEl && modalEl.removeAttribute) modalEl.removeAttribute('data-active-modal');
    if(modalEl) modalEl.innerHTML = '';
  }

  el('lightboxLayerD').innerHTML = state.zoomPhoto ? lightboxHTML() : '';
  const camLayer = el('cameraLayerD');
  if(camLayer){
    if(state.cameraActive){
      if(!el('cameraLiveFeed')){
        camLayer.innerHTML = cameraModalHTML();
      }
    } else {
      camLayer.innerHTML = '';
    }
  }
}

function render(animated){
  renderDesktopScreen(animated);
  if(sessionStorage.getItem('koneka_turnstile_verified') !== 'true'){
    showTurnstileGate();
  }
}

/* ================================================================
   CLOUDFLARE TURNSTILE — Security Gate on Site Open
   ================================================================ */
const TURNSTILE_SITEKEY = '0x4AAAAAAEpozZwlq1Bkeq53';
let _turnstileGateShown = false;
let _turnstileWidgetId = null;

function showTurnstileGate(){
  if(sessionStorage.getItem('koneka_turnstile_verified') === 'true') return;
  if(_turnstileGateShown) return;
  _turnstileGateShown = true;

  const gateEl = document.getElementById('turnstileGateLayer');
  if(!gateEl) return;

  gateEl.style.display = 'flex';
  gateEl.innerHTML = `
    <div class="card" style="max-width:340px;width:100%;padding:28px 24px;text-align:center;box-shadow:0 20px 50px rgba(0,0,0,0.35);border-radius:20px;background:var(--card-bg, #FFFFFF)">
      <div style="display:flex;justify-content:center;margin-bottom:12px">
        ${wordmark(true)}
      </div>
      <div style="width:48px;height:48px;margin:0 auto 12px;border-radius:50%;background:rgba(0,122,255,0.08);display:flex;align-items:center;justify-content:center;color:var(--blue)">
        ${ICONS.lock}
      </div>
      <h3 style="margin:0 0 6px;font-size:16.5px;font-weight:700;color:var(--text-1)">Pemeriksaan Keamanan</h3>
      <p style="margin:0 0 16px;font-size:12px;color:var(--text-2);line-height:1.5">
        Verifikasi bahwa Anda bukan robot sebelum mengakses portal KoneKA.
      </p>
      <div id="turnstileWidgetContainer" style="display:flex;justify-content:center;min-height:65px;margin:10px 0"></div>
      <p id="turnstileGateStatus" style="margin:10px 0 0;font-size:11.5px;color:var(--text-3)">Menghubungkan ke Cloudflare...</p>
    </div>
  `;

  let checkCount = 0;
  function mountTurnstile(){
    checkCount++;
    const container = document.getElementById('turnstileWidgetContainer');
    if(window.turnstile && container){
      try {
        const theme = (state && state.theme === 'dark') ? 'dark' : 'light';
        _turnstileWidgetId = window.turnstile.render('#turnstileWidgetContainer', {
          sitekey: TURNSTILE_SITEKEY,
          theme: theme,
          callback: async function(token){
            const elStatus = document.getElementById('turnstileGateStatus');
            if(elStatus) elStatus.textContent = 'Memverifikasi keamanan...';
            try {
              const res = await fetch('/.netlify/functions/verify-turnstile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: token })
              });
              const data = await res.json();
              if(data.success){
                sessionStorage.setItem('koneka_turnstile_verified', 'true');
                if(elStatus) elStatus.textContent = 'Verifikasi berhasil!';
                setTimeout(() => {
                  gateEl.style.transition = 'opacity 0.3s ease';
                  gateEl.style.opacity = '0';
                  setTimeout(() => {
                    gateEl.style.display = 'none';
                    gateEl.style.opacity = '1';
                    showToast('Pemeriksaan keamanan berhasil. Selamat datang di KoneKA', 'success');
                  }, 300);
                }, 350);
              } else {
                if(elStatus) elStatus.textContent = 'Verifikasi gagal. Mencoba ulang...';
                setTimeout(() => {
                  if(window.turnstile && _turnstileWidgetId !== null) window.turnstile.reset(_turnstileWidgetId);
                }, 1200);
              }
            } catch(fetchErr){
              console.warn('Turnstile verify error:', fetchErr);
              sessionStorage.setItem('koneka_turnstile_verified', 'true');
              gateEl.style.display = 'none';
            }
          },
          'error-callback': function(){
            const elStatus = document.getElementById('turnstileGateStatus');
            if(elStatus) elStatus.textContent = 'Kendala memuat verifikasi.';
            addSkipFallback();
          }
        });
        const elStatus = document.getElementById('turnstileGateStatus');
        if(elStatus) elStatus.textContent = 'Silakan selesaikan verifikasi di atas';
      } catch(renderErr){
        console.warn('Turnstile render error:', renderErr);
        addSkipFallback();
      }
    } else if(checkCount < 30){
      setTimeout(mountTurnstile, 200);
    } else {
      addSkipFallback();
    }
  }

  function addSkipFallback(){
    if(!document.getElementById('btnSkipTurnstile')){
      const btnSkip = document.createElement('div');
      btnSkip.id = 'btnSkipTurnstile';
      btnSkip.className = 'btn btn-ghost pressable';
      btnSkip.style.cssText = 'margin-top:10px;font-size:12px;height:36px';
      btnSkip.textContent = 'Lanjutkan ke Website';
      btnSkip.onclick = () => {
        sessionStorage.setItem('koneka_turnstile_verified', 'true');
        gateEl.style.display = 'none';
      };
      gateEl.querySelector('.card')?.appendChild(btnSkip);
    }
  }

  mountTurnstile();
}

if(typeof window !== 'undefined'){
  window.addEventListener('load', () => {
    if(sessionStorage.getItem('koneka_turnstile_verified') !== 'true'){
      showTurnstileGate();
    }
  });
}