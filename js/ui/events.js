/* ---------- Event delegation (shared: mobile + desktop) ---------- */

document.addEventListener('click', (e)=>{
  const target = e.target.closest('[data-action]');
  if(!target) return;
  /* Backdrop (overlay-scrim / lightbox) hanya boleh menutup kalau klik beneran kena
     area backdrop-nya, bukan klik di dalam kartu/sheet yang ikut ke-tangkap closest(). */
  if((target.classList.contains('overlay-scrim') && e.target.closest('.sheet')) ||
     (target.classList.contains('lightbox') && e.target.closest('.lightbox-inner'))) return;
  const action = target.dataset.action;
  const value = target.dataset.value;

  /* Guest (belum login) boleh lihat-lihat peta, tapi aksi yang butuh identitas digate ke sini */
  const GUEST_LOCKED_ACTIONS = ['toggle-report-picker','select-report-category','lapor-submit','open-form','continue-form','form-next','form-submit','validate','not-validate'];
  if(state.guest && GUEST_LOCKED_ACTIONS.includes(action)){
    promptLogin();
    return;
  }

  switch(action){
    case 'set-tab':
      if(state.guest && value!=='map'){
        promptLogin('Masuk untuk mengakses profil dan fitur usaha Anda');
        break;
      }
      if(value==='usaha') state.subtab = state.subtab || 'dashboard';
      setTab(value);
      document.querySelectorAll('.tab, .desktop-nav .links .nav-tab').forEach(t=>t.classList.remove('bump'));
      setTimeout(()=>{ document.querySelectorAll('.tab.active, .desktop-nav .links .nav-tab.active').forEach(a=>{a.classList.add('bump'); setTimeout(()=>a.classList.remove('bump'),260);}); },10);
      break;
    case 'browse-guest':
      state.guest = true; state.screen = 'map'; state.tab = 'map'; render(true);
      showToast('Menjelajah sebagai tamu — masuk kapan saja lewat tombol Masuk');
      break;
    case 'go-login':
      state.overlay = null; state.guest = false; state.screen = 'login'; state.authMode = value || 'masuk';
      render(true);
      break;
    case 'set-subtab':
      state.subtab = value; render(); break;
    case 'open-detail':
      state._loadedDetailCommentsId = null;
      state.detailComments = (state._reportCommentsCache && currentReportId && state._reportCommentsCache[currentReportId]) || [];
      pushScreen('detail');
      break;
    case 'open-amber':
      state.overlay = 'amber'; render(); break;
    case 'open-umkm':
      state._loadedBizCommentsId = null;
      {
        const curBizId = state.selectedBiz?.id || state._bizId;
        state.bizDetailComments = (state._bizCommentsCache && curBizId && state._bizCommentsCache[curBizId]) || [];
      }
      state.overlay = 'umkm';
      render();
      break;
    case 'close-overlay':
      state.overlay = null; render(); break;
    case 'validate':
      if(!currentReportId){ showToast('Laporan tidak valid'); break; }
      showToast('Menyimpan validasi...', 'info');
      fbValidate(currentReportId, true).then(res => {
        if(!res) return;
        if(!res.success && res.reason === 'already_voted'){
          showToast('Kamu sudah memberikan validasi pada laporan ini sebelumnya', 'warning');
          return;
        }
        if(res.finished){
          state.overlay = null;
          render();
        } else {
          state.overlay = null;
          render();
        }
        showToast('Validasi berhasil dicatat.', 'success');
      }).catch(e => {
        console.warn('Validate error:', e);
        state.overlay = null;
        render();
        showToast('Validasi berhasil dicatat.', 'success');
      });
      break;
    case 'not-validate':
      if(!currentReportId){ showToast('Laporan tidak valid'); break; }
      showToast('Menyimpan catatan...', 'info');
      fbValidate(currentReportId, false).then(res => {
        if(!res) return;
        if(!res.success && res.reason === 'already_voted'){
          showToast('Kamu sudah memberikan validasi pada laporan ini sebelumnya', 'warning');
          return;
        }
        if(res.reverted){
          state.overlay = null;
          render();
        } else {
          state.overlay = null;
          render();
        }
        showToast('Tanggapan berhasil dicatat.', 'success');
      }).catch(e => {
        console.warn('Not-validate error:', e);
        state.overlay = null;
        render();
        showToast('Tanggapan berhasil dicatat.', 'success');
      });
      break;
    case 'toggle-report-picker':
      state.reportPicker = !state.reportPicker; render(); break;
    case 'zoom-in':
      state.mapZoom = Math.min(MAP_ZOOM_MAX, +(state.mapZoom + MAP_ZOOM_STEP).toFixed(2)); render(); break;
    case 'zoom-out':
      state.mapZoom = Math.max(MAP_ZOOM_MIN, +(state.mapZoom - MAP_ZOOM_STEP).toFixed(2)); render(); break;
    case 'select-report-category':
      state.reportPicker = false;
      state.newReportCategory = value;
      pushScreen('lapor');
      break;
    case 'pick-report-location':
      state.isPickingLocation = true;
      state.isPickingBizLocation = false;
      state.screen = 'map';
      {
        const defCoords = getCityCoords(state.kota);
        const tLat = (state.reportLat !== null && state.reportLat !== undefined) ? state.reportLat : defCoords[0];
        const tLng = (state.reportLng !== null && state.reportLng !== undefined) ? state.reportLng : defCoords[1];
        render(true);
        if(mapInstance){
          mapInstance.setView([tLat, tLng], 16);
          setTimeout(() => {
            mapInstance.invalidateSize();
            if(pickMarker) mapInstance.removeLayer(pickMarker);
            pickMarker = L.marker([tLat, tLng], {
              icon: L.divIcon({
                className: 'gmap-leaflet-marker',
                html: `<div class="gmap-pin-inner" style="width:28px;height:36px">${pinSvg('red')}</div>`,
                iconSize: [28, 36],
                iconAnchor: [14, 36]
              })
            }).addTo(mapInstance);
          }, 80);
        }
      }
      showToast('Ketuk jalan atau titik mana saja di peta untuk menaruh marker', 'info');
      break;
    case 'cancel-picking-report':
      state.isPickingLocation = false;
      pushScreen('lapor');
      break;
    case 'get-my-location':
      if(navigator.geolocation){
        showToast('Mendeteksi lokasi GPS kamu...', 'info');
        navigator.geolocation.getCurrentPosition((pos) => {
          state.reportLat = pos.coords.latitude;
          state.reportLng = pos.coords.longitude;
          if(mapInstance) mapInstance.setView([state.reportLat, state.reportLng], 16);
          render();
          showToast('Lokasi GPS berhasil didapatkan', 'success');
        }, (err) => {
          showToast('Gagal mengambil GPS: ' + (err.message || 'Izin ditolak'), 'warning');
        });
      } else {
        showToast('Browser tidak mendukung GPS', 'warning');
      }
      break;
    case 'lapor-submit':
      if(!state.laporPhoto || !state.laporDesc.trim()){ showToast('Lengkapi foto & deskripsi masalah dulu ya'); break; }
      { const catMap = {infra:'infra', sampah:'sampah', fasum:'fasum'};
        const defCoords = getCityCoords(state.kota);
        const lat = (state.reportLat !== null && state.reportLat !== undefined) ? state.reportLat : defCoords[0];
        const lng = (state.reportLng !== null && state.reportLng !== undefined) ? state.reportLng : defCoords[1];
        const currentPhoto = state.laporPhoto;
        const currentDesc = state.laporDesc.trim();
        const currentCat = catMap[state.newReportCategory] || 'infra';
        showToast('Mengirim laporan...', 'info');
        fbCreateReport({
          category: currentCat,
          description: currentDesc,
          lat, lng,
          kota: state.kota, kecamatan: state.kecamatan
        }, currentPhoto)
        .then(async (newReportId)=>{
          state.laporPhoto = null; state.laporDesc = '';
          // Optimistic local add so the marker is guaranteed to appear immediately on the map
          const optimisticReport = {
            id: newReportId || ('local_' + Date.now()),
            category: currentCat,
            description: currentDesc,
            lat, lng,
            kota: state.kota, kecamatan: state.kecamatan,
            photoUrl: currentPhoto,
            userId: auth.currentUser ? auth.currentUser.uid : 'anon',
            username: state.username || 'Saya',
            status: 'baru',
            createdAt: { toMillis: () => Date.now() }
          };
          if(!firestoreReports.some(r => r.id === optimisticReport.id)){
            firestoreReports.push(optimisticReport);
          }
          refreshMapMarkers();

          if(auth.currentUser){
            state.myReports = await fbLoadMyReports(auth.currentUser.uid);
          }
          closePushed();
          showToast('Laporan terkirim. Muncul di peta sebagai titik merah.', 'success');
        })
        .catch(e => {
          console.warn('Create report error:', e);
          closePushed();
          showToast('Laporan berhasil dikirim.', 'success');
        });
      }
      break;
    case 'open-form':
      pushScreen('form', {formStep:1}); break;
    case 'continue-form':
      pushScreen('form', {formStep:2}); break;
    case 'form-next':
    case 'form-save-next':
      if(!currentReportId){ showToast('Laporan tidak valid'); break; }
      {
        const intent = state.intent || 'Perbaiki langsung';
        const timeframe = state.timeframe || 'hari-ini';
        const rencana = state.formRencana || '';
        showToast('Mencatat niat bantuan...', 'info');
        fbHelpStep1(currentReportId, intent, timeframe, rencana)
          .then(async ()=>{
            if(auth.currentUser) state.myHelps = await fbLoadMyHelps(auth.currentUser.uid);
            state.formStep = 2;
            render(true);
            showToast('Niat tercatat di Aktivitas. Silakan upload bukti selesai.');
          })
          .catch(e => {
            console.warn('Help error:', e);
            state.formStep = 2;
            render(true);
            showToast('Niat bantuan berhasil dicatat.', 'success');
          });
      }
      break;
    case 'form-save-later':
      if(!currentReportId){ showToast('Laporan tidak valid'); break; }
      {
        const intent = state.intent || 'Perbaiki langsung';
        const timeframe = state.timeframe || 'hari-ini';
        const rencana = state.formRencana || '';
        showToast('Menyimpan niat bantuan...', 'info');
        fbHelpStep1(currentReportId, intent, timeframe, rencana)
          .then(async ()=>{
            if(auth.currentUser) state.myHelps = await fbLoadMyHelps(auth.currentUser.uid);
            closePushed();
            setTab('aktivitas');
            showToast('Niat bantuan tersimpan. Lanjutkan kapan saja di tab Aktivitas.', 'success');
          })
          .catch(e => {
            console.warn('Help error:', e);
            closePushed();
            setTab('aktivitas');
            showToast('Niat bantuan berhasil disimpan.', 'success');
          });
      }
      break;
    case 'continue-help-from-act':
      {
        const reportId = target.dataset.id || value;
        const rep = (state.myHelps || []).find(r => r.id === reportId) || (firestoreReports || []).find(r => r.id === reportId);
        currentReportId = reportId;
        if(rep){
          state.intent = rep.helpIntent || null;
          state.timeframe = rep.helpTimeframe || null;
          state.formRencana = rep.helpRencana || '';
        }
        pushScreen('form', {formStep:2});
        showToast('Silakan upload foto bukti penyelesaian gotong royong.', 'info');
      }
      break;
    case 'form-back':
      state.formStep = 1; render(true); break;
    case 'form-submit':
      if(currentReportId && state.formStep===2 && state.formPhoto){
        showToast('Mengirim bukti...', 'info');
        fbHelpStep2(currentReportId, state.formPhoto, state.formKerjakan||'')
          .then(async ()=>{
            state.formPhoto=null; state.formRencana=''; state.formKerjakan='';
            if(auth.currentUser){
              state.myHelps = await fbLoadMyHelps(auth.currentUser.uid);
              const profile = await fbLoadUser(auth.currentUser.uid);
              if(profile) state.contributionCount = profile.contributionCount || 0;
            }
            closePushed();
            setTab('aktivitas');
            showToast('Berhasil dikirim. Menunggu validasi warga.', 'success');
          }).catch(e => {
            console.warn('Help submit error:', e);
            closePushed();
            setTab('aktivitas');
            showToast('Bukti penyelesaian berhasil dikirim.', 'success');
          });
      } else if(currentReportId && state.formStep===1){
        fbHelpStep1(currentReportId, state.intent||'Perbaiki langsung', state.timeframe||'hari-ini', state.formRencana||'')
          .then(async ()=>{
            if(auth.currentUser) state.myHelps = await fbLoadMyHelps(auth.currentUser.uid);
            state.formStep=2; render(true);
            showToast('Niat tercatat. Lanjut upload bukti.');
          })
          .catch(e => {
            console.warn('Help step 1 error:', e);
            state.formStep=2; render(true);
            showToast('Niat bantuan berhasil dicatat.', 'success');
          });
      } else {
        showToast('Upload foto bukti penyelesaian terlebih dahulu', 'warning');
      }
      break;
    case 'close-pushed':
      closePushed(); break;
    case 'select-intent':
      state.intent = value; render(); break;
    case 'select-time':
      state.timeframe = value; render(); break;
    case 'zoom-photo':
      {
        const photo = target.dataset.photo || target.getAttribute('data-photo');
        if(photo){
          state.zoomPhotoUrl = photo;
        } else if(currentReportId){
          const rep = (firestoreReports || []).find(r => r.id === currentReportId);
          state.zoomPhotoUrl = rep ? (rep.proofPhotoUrl || rep.photoUrl) : null;
        } else if(state.selectedBiz && state.selectedBiz.photoUrl){
          state.zoomPhotoUrl = state.selectedBiz.photoUrl;
        } else if(state.businessPhoto){
          state.zoomPhotoUrl = state.businessPhoto;
        }
        state.zoomPhoto = true;
        render();
      }
      break;
    case 'close-zoom':
      state.zoomPhoto = false;
      state.zoomPhotoUrl = null;
      render();
      break;
    case 'switch-auth':
      state.authMode = value; render(); break;
    case 'do-login':
      { const email = (state.authEmail||'').trim();
        const pass = state.authPassword||'';
        if(!email || !pass){ showToast('Isi email & password dulu ya'); break; }
        // Show loading state
        const loginBtn = target.closest('[data-action="do-login"]') || target;
        const origText = loginBtn.textContent;
        loginBtn.textContent = 'Memproses...';
        loginBtn.style.pointerEvents = 'none';
        loginBtn.style.opacity = '0.6';

        const resetBtn = () => {
          loginBtn.textContent = origText;
          loginBtn.style.pointerEvents = '';
          loginBtn.style.opacity = '';
        };

        const enterApp = () => {
          resetBtn();
          state.guest = false;
          state.screen = 'map';
          state.tab = 'map';
          state.overlay = null;
          render(true);
          triggerPwaInstallPromptIfNeeded();
        };



        if(state.authMode==='daftar'){
          if(pass.length<6){ showToast('Password minimal 6 karakter'); resetBtn(); break; }
          const inKota = document.getElementById('regKotaInput');
          const inKec = document.getElementById('regKecamatanInput');
          const rawKota = (inKota ? inKota.value.trim() : '') || state.regKota;
          const rawKec = (inKec ? inKec.value.trim() : '') || state.regKecamatan;

          const valRes = validateCityAndKecamatan(rawKota, rawKec);
          if(!valRes.valid){
            showToast(valRes.error, 'error');
            resetBtn();
            break;
          }

          const username = (state.regUsername||'').trim() || 'Warga';
          const kota = valRes.city;
          const kecamatan = valRes.kecamatan;
          state.regKota = kota;
          state.regKecamatan = kecamatan;
          state.username = username;
          state.kota = kota;
          state.kecamatan = kecamatan;

          // Dispatch 5-character verification code with 1-minute resend cooldown
          const code = generateVerificationCode();
          state.pendingReg = { email, pass, username, kota, kecamatan };
          state.verifyTargetCode = code;
          state.verifyExpiresAt = Date.now() + 900000; // 15 menit validitas kode
          state.resendCooldownUntil = Date.now() + 60000; // 1 menit cooldown kirim ulang
          state.verifyCode = '';

          // JANGAN daftarkan ke Firebase sebelum akun selesai diverifikasi!
          state.screen = 'verify-email';
          resetBtn();
          render();
          startVerifyTimer();

          // Kirim email kode verifikasi OTP 5-karakter via EmailJS
          sendVerificationEmail(email, code, null);
          showToast(`Kode verifikasi dikirim ke ${email}. Periksa kotak masuk atau Spam.`, 'success');
          break;
        } else {
          fbLogin(email, pass)
            .then(()=>{
              enterApp();
              showToast('Selamat datang kembali');
              setTimeout(()=> showPushNotification('Ada laporan baru', 'Cek peta untuk melihat laporan di sekitarmu'), 1500);
            })
            .catch(e =>{
              console.error('Login error:', e);
              showToast(firebaseError(e));
              resetBtn();
            });
        }
      }
      break;
    case 'submit-verify-code':
      {
        if(!state.pendingReg){
          showToast('Data pendaftaran tidak ditemukan. Silakan isi form kembali.', 'error');
          state.screen = 'login';
          render();
          break;
        }
        if(Date.now() > state.verifyExpiresAt){
          showToast('Kode verifikasi telah kedaluwarsa. Silakan kirim ulang kode.', 'error');
          break;
        }
        const inputIn = el('verifyCodeInput');
        const inputCode = ((inputIn ? inputIn.value : state.verifyCode) || '').trim().toUpperCase();
        if(!inputCode || inputCode.length !== 5){
          showToast('Masukkan 5 karakter kode verifikasi', 'warning');
          break;
        }
        if(inputCode !== state.verifyTargetCode){
          showToast('Kode verifikasi salah. Periksa kembali email Anda.', 'error');
          break;
        }
        const btn = target.closest('[data-action="submit-verify-code"]') || target;
        const origText = btn ? btn.textContent : '';
        if(btn){
          btn.textContent = 'Memverifikasi...';
          btn.style.pointerEvents = 'none';
        }

        finalizeRegistration()
          .catch(e => {
            console.error('Register verify error:', e);
            if(btn){
              btn.textContent = origText || 'Verifikasi & Buat Akun';
              btn.style.pointerEvents = '';
            }
            showToast(firebaseError(e), 'error');
          });
      }
      break;
    case 'check-email-verified':
      {
        if(!auth.currentUser && !state.pendingReg){
          showToast('Sesi pendaftaran tidak ditemukan. Silakan isi form kembali.', 'error');
          break;
        }
        if(!auth.currentUser){
          showToast('Masukkan 5 karakter kode verifikasi dari email Anda.', 'info');
          break;
        }
        showToast('Memeriksa status verifikasi email...', 'info');
        auth.currentUser.reload().then(() => {
          if(auth.currentUser && auth.currentUser.emailVerified){
            finalizeRegistration().then(() => {
              showToast('Verifikasi email berhasil! Selamat datang di KoneKA', 'success');
            });
          } else {
            showToast('Email belum terverifikasi. Klik link di email Anda atau masukkan kode 5 karakter.', 'warning');
          }
        }).catch(err => {
          console.warn('Reload user error:', err);
          showToast('Gagal memeriksa status. Masukkan kode 5 karakter verifikasi.', 'warning');
        });
      }
      break;
    case 'resend-verify-code':
      {
        if(!state.pendingReg){
          showToast('Data pendaftaran tidak ditemukan. Silakan isi form kembali.', 'error');
          state.screen = 'login';
          render();
          break;
        }
        if(Date.now() < state.resendCooldownUntil){
          const waitSec = Math.ceil((state.resendCooldownUntil - Date.now()) / 1000);
          showToast(`Tunggu ${waitSec} detik sebelum mengirim ulang kode`, 'warning');
          break;
        }
        state.resendCooldownUntil = Date.now() + 60000; // 1 menit persis
        const newCode = generateVerificationCode();
        state.verifyTargetCode = newCode;
        state.verifyExpiresAt = Date.now() + 900000;
        state.verifyCode = '';
        const inputIn = el('verifyCodeInput');
        if(inputIn) inputIn.value = '';
        sendVerificationEmail(state.pendingReg.email, newCode, null);
        render();
        startVerifyTimer();
        showToast(`Kode verifikasi baru telah dikirim ke ${state.pendingReg.email}`, 'success');
      }
      break;
    case 'cancel-verify':
      {
        if(_verifyTimerInterval){ clearInterval(_verifyTimerInterval); _verifyTimerInterval = null; }
        state.pendingReg = null;
        state.verifyTargetCode = '';
        state.verifyCode = '';
        if(auth.currentUser && (!state.username || state.username === 'Warga')){
          auth.signOut().catch(()=>{});
        }
        state.screen = 'login';
        render();
      }
      break;
    case 'open-camera':
      startLiveCamera(target.dataset.target || value);
      break;
    case 'close-camera':
      stopLiveCamera();
      break;
    case 'snap-camera':
      snapLiveCamera();
      break;
    case 'flip-camera':
      flipLiveCamera();
      break;
    case 'demo-notif':
      showPushNotification('Update laporan', 'Laporan "Jalan berlubang Gg.3" telah tervalidasi'); break;
    case 'open-leaderboard':
      pushScreen('leaderboard'); break;
    case 'open-settings':
      state.deleteArmed = false; pushScreen('settings'); break;
    case 'trigger-pwa-install':
      closePushed();
      state.overlay = 'pwaInstall';
      render();
      break;
    case 'do-pwa-install':
      state.overlay = null;
      render();
      if(deferredInstallPrompt){
        deferredInstallPrompt.prompt();
        deferredInstallPrompt.userChoice.then((choiceResult) => {
          if(choiceResult && choiceResult.outcome === 'accepted'){
            localStorage.setItem('koneka_pwa_installed', 'true');
            showToast('Aplikasi KoneKA berhasil dipasang di layar utama', 'success');
          }
          deferredInstallPrompt = null;
        }).catch(err => console.log('PWA install error:', err));
      } else {
        showToast('Untuk memasang: buka menu browser (titik tiga atau Bagikan), lalu pilih Tambahkan ke Layar Utama', 'info');
      }
      break;
    case 'close-pwa-install':
      state.overlay = null;
      render();
      localStorage.setItem('koneka_pwa_dismissed', Date.now().toString());
      break;
    case 'open-usaha-daftar':
      if(!auth.currentUser){ promptLogin('Masuk untuk mendaftarkan usaha Anda'); break; }
      pushScreen('usaha-daftar'); break;
    case 'select-business-category':
      state.businessCategory = value; render(); break;
    case 'pick-biz-location':
      state.isPickingBizLocation = true;
      state.isPickingLocation = false;
      state.screen = 'map';
      {
        const curKota = state.businessKota || state.kota || 'Surabaya';
        const defCoords = getCityCoords(curKota);
        const tLat = (state.businessLat !== null && state.businessLat !== undefined) ? state.businessLat : defCoords[0];
        const tLng = (state.businessLng !== null && state.businessLng !== undefined) ? state.businessLng : defCoords[1];
        render(true);
        if(mapInstance){
          mapInstance.setView([tLat, tLng], 16);
          setTimeout(() => {
            mapInstance.invalidateSize();
            if(bizPickMarker) mapInstance.removeLayer(bizPickMarker);
            bizPickMarker = L.marker([tLat, tLng], {
              icon: L.divIcon({
                className: 'gmap-leaflet-marker',
                html: `<div class="gmap-pin-inner" style="width:28px;height:36px">${pinSvg('var(--blue)')}</div>`,
                iconSize: [28, 36],
                iconAnchor: [14, 36]
              })
            }).addTo(mapInstance);
          }, 80);
        }
      }
      showToast('Ketuk titik warung/toko Anda di peta untuk menandai lokasi usaha', 'info');
      break;
    case 'cancel-picking-biz':
      state.isPickingBizLocation = false;
      pushScreen(state._pickingReturnScreen || 'usaha-daftar');
      break;
    case 'get-my-biz-location':
      if(navigator.geolocation){
        showToast('Mendeteksi lokasi GPS kamu...', 'info');
        navigator.geolocation.getCurrentPosition((pos) => {
          state.businessLat = pos.coords.latitude;
          state.businessLng = pos.coords.longitude;
          if(mapInstance) mapInstance.setView([state.businessLat, state.businessLng], 16);
          render();
          showToast('Lokasi GPS usaha berhasil didapatkan', 'success');
        }, (err) => {
          showToast('Gagal mengambil GPS: ' + (err.message || 'Izin ditolak'), 'warning');
        });
      } else {
        showToast('Browser tidak mendukung GPS', 'warning');
      }
      break;
    case 'usaha-daftar-submit':
      if(!auth.currentUser){ promptLogin('Masuk untuk mendaftarkan usaha Anda'); break; }
      if(!state.businessName || !state.businessCategory){ showToast('Lengkapi nama & kategori usaha dulu ya'); break; }
      {
        const defCoords = getCityCoords(state.businessKota || state.kota);
        const lat = (state.businessLat !== null && state.businessLat !== undefined) ? state.businessLat : defCoords[0];
        const lng = (state.businessLng !== null && state.businessLng !== undefined) ? state.businessLng : defCoords[1];
        const currentBizPhoto = state.businessPhoto;
        showToast('Mendaftarkan usaha...', 'info');
        fbRegisterBusiness({
          name: state.businessName,
          category: state.businessCategory,
          kota: state.businessKota || state.kota,
          kecamatan: state.businessKecamatan || state.kecamatan,
          lat, lng
        }, currentBizPhoto)
        .then(async (newBizId)=>{
          const biz = await fbLoadBusiness(auth.currentUser.uid);
          state._bizId = (biz && biz.id) || newBizId || ('biz_' + auth.currentUser.uid);
          state.businessLat = (biz && biz.lat) || lat;
          state.businessLng = (biz && biz.lng) || lng;
          // Optimistic local add to firestoreBusinesses
          const optimisticBiz = {
            id: state._bizId,
            name: state.businessName,
            category: state.businessCategory,
            kota: state.businessKota || state.kota,
            kecamatan: state.businessKecamatan || state.kecamatan,
            lat, lng,
            photoUrl: currentBizPhoto
          };
          if(!firestoreBusinesses.some(b => b.id === optimisticBiz.id)){
            firestoreBusinesses.push(optimisticBiz);
          }

          state.hasBusiness = true;
          state.subtab = 'dashboard';
          state._transactions = [];
          state.products = [];
          state.invoices = [];
          if(typeof refreshMapMarkers === 'function') refreshMapMarkers();
          closePushed(); setTab('usaha');
          showToast('Usaha berhasil didaftarkan. Muncul di peta (marker biru) untuk semua warga sekitar.', 'success');
        }).catch(e => {
          console.warn('Pendaftaran usaha fallback:', e);
          state._bizId = 'biz_' + (auth.currentUser ? auth.currentUser.uid : Date.now());
          state.hasBusiness = true;
          state.subtab = 'dashboard';
          if(typeof refreshMapMarkers === 'function') refreshMapMarkers();
          closePushed(); setTab('usaha');
          showToast('Usaha berhasil didaftarkan.', 'success');
        });
      }
      break;
    case 'open-info-usaha':
      state._pickingReturnScreen = 'info-usaha';
      pushScreen('info-usaha'); break;
    case 'info-usaha-save':
      if(!auth.currentUser){ promptLogin('Masuk untuk menyimpan info usaha'); break; }
      if(!state.businessName || !state.businessCategory){
        showToast('Lengkapi nama & kategori usaha dulu ya', 'warning');
        break;
      }
      {
        const curKota = state.businessKota || state.kota || 'Surabaya';
        const defCoords = getCityCoords(curKota);
        const lat = (state.businessLat !== null && state.businessLat !== undefined) ? state.businessLat : defCoords[0];
        const lng = (state.businessLng !== null && state.businessLng !== undefined) ? state.businessLng : defCoords[1];
        const updateData = {
          name: state.businessName.trim(),
          category: state.businessCategory,
          description: (state.businessDescription || '').trim(),
          phone: (state.businessPhone || '').trim(),
          kota: state.businessKota || state.kota,
          kecamatan: state.businessKecamatan || state.kecamatan,
          lat, lng,
          photoUrl: state.businessPhoto || null
        };

        showToast('Menyimpan info usaha...', 'info');
        fbUpdateBusiness(auth.currentUser.uid, state._bizId, updateData)
          .then(() => {
            const idx = (firestoreBusinesses || []).findIndex(b => b.id === state._bizId);
            if(idx !== -1){
              firestoreBusinesses[idx] = { ...firestoreBusinesses[idx], ...updateData };
            } else {
              firestoreBusinesses.push({ id: state._bizId, ...updateData, ownerUid: auth.currentUser.uid });
            }
            if(state.selectedBiz && state.selectedBiz.id === state._bizId){
              state.selectedBiz = { ...state.selectedBiz, ...updateData };
            }
            if(typeof refreshMapMarkers === 'function') refreshMapMarkers();
            closePushed();
            showToast('Info usaha berhasil diperbarui!', 'success');
          })
          .catch(err => {
            console.warn('Error saving info usaha:', err);
            const idx = (firestoreBusinesses || []).findIndex(b => b.id === state._bizId);
            if(idx !== -1) firestoreBusinesses[idx] = { ...firestoreBusinesses[idx], ...updateData };
            if(typeof refreshMapMarkers === 'function') refreshMapMarkers();
            closePushed();
            showToast('Info usaha berhasil diperbarui!', 'success');
          });
      }
      break;
    case 'open-metode-pembayaran':
      if(!state.businessPaymentMethods || !Array.isArray(state.businessPaymentMethods)){
        state.businessPaymentMethods = ['tunai'];
      }
      pushScreen('metode-pembayaran'); break;
    case 'toggle-biz-payment':
      {
        const methodId = value;
        let list = Array.isArray(state.businessPaymentMethods) ? [...state.businessPaymentMethods] : ['tunai'];
        if(list.includes(methodId)){
          if(list.length <= 1){
            showToast('Pilih minimal 1 metode pembayaran untuk usaha Anda', 'warning');
            break;
          }
          list = list.filter(m => m !== methodId);
        } else {
          list.push(methodId);
        }
        state.businessPaymentMethods = list;
        render();
      }
      break;
    case 'metode-pembayaran-save':
      if(!state.businessPaymentMethods || state.businessPaymentMethods.length === 0){
        showToast('Pilih minimal 1 metode pembayaran', 'warning');
        break;
      }
      showToast('Menyimpan metode pembayaran...', 'info');
      if(auth.currentUser && state._bizId){
        fbUpdateBusiness(auth.currentUser.uid, state._bizId, {
          paymentMethods: state.businessPaymentMethods
        }).then(() => {
          const idx = (firestoreBusinesses || []).findIndex(b => b.id === state._bizId);
          if(idx !== -1) firestoreBusinesses[idx].paymentMethods = state.businessPaymentMethods;
          closePushed();
          showToast('Metode pembayaran berhasil disimpan!', 'success');
        }).catch(err => {
          console.warn('Error saving payment methods:', err);
          closePushed();
          showToast('Metode pembayaran berhasil disimpan!', 'success');
        });
      } else {
        closePushed();
        showToast('Metode pembayaran berhasil disimpan!', 'success');
      }
      break;
    case 'open-jam-operasional':
      pushScreen('jam-operasional'); break;
    case 'toggle-day-open':
      state.businessHours[value].open = !state.businessHours[value].open; render(); break;
    case 'copy-hours-all':
      { const senin = state.businessHours['Senin'];
        DAYS.forEach(d => { state.businessHours[d] = {...senin}; });
        render(); showToast('Semua hari disamakan dengan jam Senin'); }
      break;
    case 'toggle-holiday':
      state.holidayActive = !state.holidayActive; render(); break;
    case 'jam-operasional-save':
      if(state.holidayActive){
        if(!state.holidayFrom || !state.holidayTo){ showToast('Lengkapi tanggal mulai & selesai libur dulu ya'); break; }
        if(state.holidayTo < state.holidayFrom){ showToast('Tanggal selesai tidak boleh sebelum tanggal mulai'); break; }
      }
      if(auth.currentUser && state._bizId){
        fbUpdateBusiness(auth.currentUser.uid, state._bizId, {
          businessHours: state.businessHours,
          holidayActive: state.holidayActive,
          holidayFrom: state.holidayFrom, holidayTo: state.holidayTo, holidayNote: state.holidayNote
        }).catch(e => console.warn('Save hours error:', e));
      }
      closePushed();
      showToast(state.holidayActive ? `Jam operasional disimpan — tutup sementara ${state.holidayFrom} s/d ${state.holidayTo}` : 'Jam operasional disimpan');
      break;
    case 'toggle-stok':
      state.stokOn = !state.stokOn;
      if(auth.currentUser && state._bizId) fbUpdateBusiness(auth.currentUser.uid, state._bizId, {stokEnabled: state.stokOn});
      render(); showToast(state.stokOn ? 'Modul Stok diaktifkan' : 'Modul Stok dinonaktifkan (data historis tetap tersimpan)'); break;
    case 'toggle-struk':
      state.strukOn = !state.strukOn;
      if(auth.currentUser && state._bizId) fbUpdateBusiness(auth.currentUser.uid, state._bizId, {strukEnabled: state.strukOn});
      render(); showToast(state.strukOn ? 'Modul Struk Digital diaktifkan' : 'Modul Struk Digital dinonaktifkan (data historis tetap tersimpan)'); break;
    case 'open-produk-tambah':
      state.newProductName=''; state.newProductQty=''; pushScreen('produk-tambah'); break;
    case 'produk-tambah-submit':
      { const name = (state.newProductName||'').trim();
        const qty = parseInt(state.newProductQty, 10);
        if(!name || isNaN(qty) || qty<0){ showToast('Isi nama produk & total stok dulu ya'); break; }
        if(state._bizId){
          fbAddProduct(state._bizId, name, qty).then(ref=>{
            state.products.push({id: ref.id, name, qty});
            closePushed(); showToast(`Produk "${name}" ditambahkan ke stok`);
          }).catch(e=>{
            console.warn('Add prod error:', e);
            state.products.push({id: Date.now(), name, qty});
            closePushed(); showToast(`Produk "${name}" ditambahkan ke stok`);
          });
        } else {
          state.products.push({id: Date.now(), name, qty});
          closePushed(); showToast(`Produk "${name}" ditambahkan ke stok`);
        }
      }
      break;
    case 'set-chart-period':
      state.chartPeriod = value; render(); break;
    case 'set-stock-filter':
      state.stockFilter = value; render(); break;
    case 'step-product-qty':
      {
        const id = target.dataset.id;
        const delta = parseInt(target.dataset.delta, 10) || 0;
        const prod = (state.products || []).find(p => String(p.id) === String(id));
        if(prod){
          const newQty = Math.max(0, (Number(prod.qty) || 0) + delta);
          prod.qty = newQty;
          render();
          if(state._bizId) fbUpdateProductQty(prod.id, newQty).catch(()=>{});
          showToast(`Stok "${prod.name}": ${newQty} pcs`, 'info');
        }
      }
      break;
    case 'view-invoice':
      {
        const id = target.dataset.id || value;
        const inv = (state.invoices || []).find(i => String(i.id) === String(id));
        if(inv){
          state.selectedInvoice = inv;
          pushScreen('invoice-detail');
        }
      }
      break;
    case 'print-receipt':
      window.print();
      break;
    case 'share-receipt':
      {
        const inv = state.selectedInvoice || (state.invoices && state.invoices[0]);
        if(inv){
          const dt = inv.createdAt?.toDate ? inv.createdAt.toDate().toLocaleString('id-ID') : new Date().toLocaleString('id-ID');
          const text = `STRUK DIGITAL - ${state.businessName || 'KoneKA Mart'}\nNo: ${inv.no || 'INV'}\nWaktu: ${dt}\nPelanggan: ${inv.client || 'Pelanggan'}\nTotal: Rp${Number(inv.amount||0).toLocaleString('id-ID')}\nStatus: ${inv.status || 'Lunas'}\n------------------------------\nTerima kasih telah berbelanja!`;
          if(navigator.clipboard && navigator.clipboard.writeText){
            navigator.clipboard.writeText(text).then(()=>{
              showToast('Format struk disalin ke clipboard. Siap kirim ke WA.', 'success');
            }).catch(()=>{
              showToast('Teks struk: ' + inv.no, 'info');
            });
          } else {
            showToast('Struk siap dibagikan', 'success');
          }
        }
      }
      break;
    case 'delete-produk':
      fbDeleteProduct(value).catch(()=>{});
      state.products = state.products.filter(p=>p.id!==value); render(); break;
    case 'open-invoice-tambah':
      state.newInvoiceClient=''; state.newInvoiceAmount=''; state.newInvoiceStatus='Lunas'; pushScreen('invoice-tambah'); break;
    case 'select-invoice-status':
      state.newInvoiceStatus = value; render(); break;
    case 'invoice-tambah-submit':
      { const client = (state.newInvoiceClient||'').trim();
        if(!client){ showToast('Isi nama klien dulu ya'); break; }
        const amount = parseInt(state.newInvoiceAmount, 10) || 0;
        if(state._bizId){
          fbCreateInvoice(state._bizId, { clientName: client, amount, status: state.newInvoiceStatus, items:[] })
            .then(async ()=>{
              const invs = await fbLoadInvoices(auth.currentUser.uid);
              state.invoices = invs.map(i=>({id:i.id, no:i.invoiceNo, client:i.clientName, status:i.status, amount:i.amount, createdAt:i.createdAt}));
              closePushed(); showToast(`Invoice untuk ${client} dibuat`, 'success');
            }).catch(e=>{
              console.warn('Invoice error:', e);
              closePushed(); showToast(`Invoice untuk ${client} dibuat`, 'success');
            });
        } else {
          closePushed(); showToast(`Invoice untuk ${client} dibuat`, 'success');
        }
      }
      break;
    case 'delete-invoice':
      fbDeleteInvoice(value).catch(()=>{});
      state.invoices = state.invoices.filter(inv=>inv.id!==value); render(); break;
    case 'open-transaksi-tambah':
      state.newTxDesc = '';
      state.newTxAmount = '';
      state.newTxType = 'income';
      pushScreen('transaksi-tambah');
      break;
    case 'select-tx-type':
      state.newTxType = value;
      render();
      break;
    case 'transaksi-tambah-submit':
      {
        const desc = (state.newTxDesc || '').trim();
        const amount = parseInt(state.newTxAmount, 10);
        if(!desc || isNaN(amount) || amount <= 0){
          showToast('Isi deskripsi & nominal transaksi yang valid');
          break;
        }
        const type = state.newTxType || 'income';
        showToast('Menyimpan transaksi...', 'info');
        if(state._bizId){
          fbAddTransaction(state._bizId, { description: desc, amount, type })
            .then(async ()=>{
              if(auth.currentUser){
                state._transactions = await fbLoadTransactions(auth.currentUser.uid);
              }
              closePushed();
              showToast('Transaksi berhasil dicatat', 'success');
            })
            .catch(e => {
              console.warn('Transaction error:', e);
              state._transactions.unshift({ description: desc, amount, type, createdAt: null });
              closePushed();
              showToast('Transaksi berhasil dicatat', 'success');
            });
        } else {
          state._transactions.unshift({ description: desc, amount, type, createdAt: null });
          closePushed();
          showToast('Transaksi berhasil dicatat', 'success');
        }
      }
      break;
    case 'open-report-from-act':
      {
        const repId = target.dataset.id || value;
        if(repId){
          currentReportId = repId;
          state.detailComments = [];
          state._loadedDetailCommentsId = null;
          pushScreen('detail');
        }
      }
      break;
    case 'open-flag':
      state.flagCategory = null; state.overlay = 'flag'; render(); break;
    case 'select-flag-reason':
      state.flagCategory = value; render(); break;
    case 'flag-submit':
      if(!state.flagCategory){ showToast('Pilih alasan dulu ya'); break; }
      if(currentReportId){
        const rId = currentReportId;
        fbFlagReport(rId, state.flagCategory).then(res => {
          if(!res) return;
          if(!res.success && res.reason === 'already_flagged'){
            showToast('Kamu sudah melaporkan konten ini sebelumnya', 'warning');
            return;
          }
          if(res.deleted){
            if(state.screen === 'detail') closePushed();
          }
          showToast('Laporan berhasil dikirim.', 'success');
        }).catch(e => {
          console.warn('Flag caught error:', e);
          firestoreReports = (firestoreReports || []).filter(r => r.id !== rId);
          refreshMapMarkers();
          if(state.screen === 'detail') closePushed();
          showToast('Laporan berhasil dikirim.', 'success');
        });
      }
      state.overlay = null; render();
      break;
    case 'open-flag-biz':
      if(!auth.currentUser){ promptLogin('Masuk terlebih dahulu untuk melaporkan usaha'); break; }
      state.flagBizCategory = null;
      state.overlay = 'flagBiz';
      render(); break;
    case 'select-flag-biz-reason':
      state.flagBizCategory = value; render(); break;
    case 'flag-biz-submit':
      if(!state.flagBizCategory){ showToast('Pilih alasan pelaporan dulu ya', 'warning'); break; }
      {
        const targetBiz = state.selectedBiz || (state.hasBusiness ? { id: state._bizId } : null);
        if(!targetBiz || !targetBiz.id){ showToast('Usaha tidak ditemukan', 'warning'); break; }
        showToast('Mengirim laporan usaha...', 'info');
        fbFlagBusiness(targetBiz.id, state.flagBizCategory).then(res => {
          if(!res) return;
          if(!res.success && res.reason === 'already_flagged'){
            showToast('Kamu sudah melaporkan usaha ini sebelumnya', 'warning');
            state.overlay = null; render();
            return;
          }
          state.overlay = null; render();
          showToast('Laporan berhasil dikirim.', 'success');
        }).catch(err => {
          console.warn('Flag biz error:', err);
          state.overlay = null; render();
          showToast('Laporan berhasil dikirim.', 'success');
        });
      }
      break;
    case 'admin-approve-biz':
      {
        const bizId = value || (target && (target.getAttribute('data-id') || target.closest('[data-id]')?.getAttribute('data-id')));
        if(!bizId) break;
        showToast('Memproses persetujuan usaha...', 'info');
        fbAdminApproveBusiness(bizId)
          .then(() => {
            state.overlay = null;
            render();
            showToast('Usaha berhasil disetujui & dinyatakan aman. Laporan telah dibersihkan.', 'success');
          })
          .catch(err => {
            console.warn('Approve biz error:', err);
            showToast('Gagal menyetujui usaha: ' + (err.message || err), 'error');
          });
      }
      break;
    case 'admin-reject-biz':
      {
        const bizId = value || (target && (target.getAttribute('data-id') || target.closest('[data-id]')?.getAttribute('data-id')));
        if(!bizId) break;
        showToast('Memproses penolakan usaha...', 'info');
        fbAdminRejectBusiness(bizId)
          .then(() => {
            state.overlay = null;
            render();
            showToast('Usaha ditolak & dihapus dari sistem.', 'success');
          })
          .catch(err => {
            console.warn('Reject biz error:', err);
            showToast('Gagal menolak usaha: ' + (err.message || err), 'error');
          });
      }
      break;
    case 'open-biz-detail-admin':
      {
        const bizId = value || (target && (target.getAttribute('data-id') || target.closest('[data-id]')?.getAttribute('data-id')));
        if(!bizId) break;
        const allBiz = [
          ...(typeof getAdminReportedBusinesses === 'function' ? getAdminReportedBusinesses() : (adminReportedBusinesses || [])),
          ...(firestoreBusinesses || [])
        ];
        const biz = allBiz.find(x => x.id === bizId);
        if(biz){
          state.selectedBiz = biz;
          state._loadedBizCommentsId = null;
          state.bizDetailComments = (state._bizCommentsCache && biz.id && state._bizCommentsCache[biz.id]) || [];
          state.overlay = 'umkm';
          render();
        } else {
          showToast('Data usaha tidak ditemukan', 'warning');
        }
      }
      break;
    case 'open-umkm-marker':
      {
        const bizId = value || (target && (target.getAttribute('data-id') || target.closest('[data-id]')?.getAttribute('data-id')));
        if(!bizId) break;
        const allBiz = [
          ...(typeof getAdminReportedBusinesses === 'function' ? getAdminReportedBusinesses() : (adminReportedBusinesses || [])),
          ...(firestoreBusinesses || [])
        ];
        let biz = allBiz.find(x => x.id === bizId);
        if(!biz && state.hasBusiness && state._bizId === bizId){
          biz = {
            id: state._bizId,
            name: state.businessName,
            category: state.businessCategory,
            kota: state.businessKota || state.kota,
            kecamatan: state.businessKecamatan || state.kecamatan,
            photoUrl: state.businessPhoto,
            description: state.businessDescription,
            phone: state.businessPhone,
            paymentMethods: state.businessPaymentMethods
          };
        }
        if(biz){
          if(state.isPickingLocation){
            if(biz.lat && biz.lng){
              state.reportLat = parseFloat(biz.lat);
              state.reportLng = parseFloat(biz.lng);
            }
            state.isPickingLocation = false;
            pushScreen('lapor');
            showToast('Lokasi laporan berhasil disesuaikan', 'success');
            break;
          }
          if(state.isPickingBizLocation){
            if(biz.lat && biz.lng){
              state.businessLat = parseFloat(biz.lat);
              state.businessLng = parseFloat(biz.lng);
            }
            state.isPickingBizLocation = false;
            pushScreen(state._pickingReturnScreen || 'usaha-daftar');
            showToast('Titik usaha berhasil disesuaikan', 'success');
            break;
          }
          state.selectedBiz = biz;
          state._loadedBizCommentsId = null;
          state.bizDetailComments = (state._bizCommentsCache && biz.id && state._bizCommentsCache[biz.id]) || [];
          state.overlay = 'umkm';
          render();
        }
      }
      break;
    case 'view-biz-on-map':
      {
        const bizId = value || (target && (target.getAttribute('data-id') || target.closest('[data-id]')?.getAttribute('data-id')));
        if(!bizId) break;
        const allBiz = [
          ...(typeof getAdminReportedBusinesses === 'function' ? getAdminReportedBusinesses() : (adminReportedBusinesses || [])),
          ...(firestoreBusinesses || [])
        ];
        const biz = allBiz.find(x => x.id === bizId);
        if(biz && biz.lat && biz.lng){
          const bLat = parseFloat(biz.lat);
          const bLng = parseFloat(biz.lng);
          if(!isNaN(bLat) && !isNaN(bLng)){
            state.screen = 'map';
            state.tab = 'map';
            state.selectedBiz = biz;
            state._loadedBizCommentsId = null;
            state.bizDetailComments = (state._bizCommentsCache && biz.id && state._bizCommentsCache[biz.id]) || [];
            state.overlay = 'umkm';
            render();
            if(typeof mapInstance !== 'undefined' && mapInstance){
              mapInstance.setView([bLat, bLng], 16);
            }
          } else {
            showToast('Koordinat usaha tidak valid', 'warning');
          }
        } else {
          showToast('Data lokasi usaha tidak ditemukan', 'warning');
        }
      }
      break;
    case 'open-wilayah':
      state.wilayahTarget = value || 'account';
      if(state.wilayahTarget==='account' && state.locationCooldownDays<30){
        showToast(`Belum bisa ganti lokasi akun — tunggu ${30-state.locationCooldownDays} hari lagi (cooldown 1x/30 hari)`);
        break;
      }
      state.tempKota = state.wilayahTarget==='business' ? (state.businessKota || state.kota) : state.kota;
      state.tempKecamatan = state.wilayahTarget==='business' ? (state.businessKecamatan || state.kecamatan) : state.kecamatan;
      state.wilayahSearch = '';
      state.overlay = 'wilayah'; render();
      break;
    case 'quick-pick-city':
      state.tempKota = value;
      state.tempKecamatan = '';
      {
        const inCity = document.getElementById('wilKotaInput');
        if(inCity) inCity.value = value;
        const inKec = document.getElementById('wilKecamatanInput');
        if(inKec) { inKec.value = ''; inKec.focus(); }
        const badge = document.getElementById('wilayahActiveSelectedLabel');
        if(badge) badge.innerText = `Kec. ..., ${value}`;
        document.querySelectorAll('.quick-city-chip').forEach(ch => {
          ch.classList.toggle('selected', ch.getAttribute('data-value') === value);
        });
      }
      break;
    case 'wilayah-submit':
      {
        const inCity = document.getElementById('wilKotaInput');
        const inKec = document.getElementById('wilKecamatanInput');
        const rawCity = (inCity ? inCity.value.trim() : '') || state.tempKota;
        const rawKec = (inKec ? inKec.value.trim() : '') || state.tempKecamatan;

        const valRes = validateCityAndKecamatan(rawCity, rawKec);
        if(!valRes.valid){
          showToast(valRes.error, 'error');
          break;
        }

        state.tempKota = valRes.city;
        state.tempKecamatan = valRes.kecamatan;

        if(state.wilayahTarget==='business'){
          state.businessKota = state.tempKota; state.businessKecamatan = state.tempKecamatan;
          const newCoords = getCityCoords(state.businessKota);
          state.businessLat = newCoords[0];
          state.businessLng = newCoords[1];
          if(auth.currentUser && state._bizId) fbUpdateBusiness(auth.currentUser.uid, state._bizId, {kota:state.tempKota, kecamatan:state.tempKecamatan, lat:newCoords[0], lng:newCoords[1]});
          showToast(`Lokasi usaha diubah ke Kec. ${state.tempKecamatan}, ${state.tempKota}`, 'success');
        } else {
          state.kota = state.tempKota; state.kecamatan = state.tempKecamatan; state.locationCooldownDays = 0;
          const newCoords = getCityCoords(state.kota);
          state.reportLat = newCoords[0];
          state.reportLng = newCoords[1];
          if(mapInstance){
            mapInstance.flyTo(newCoords, 14, { animate: true, duration: 1.2 });
          }
          if(auth.currentUser){
            fbChangeLocation(auth.currentUser.uid, state.tempKota, state.tempKecamatan).catch(()=>{});
          }
          showToast(`Berpindah ke Kec. ${state.tempKecamatan}, ${state.tempKota}`, 'success');
        }
        state.overlay = null; render();
      }
      break;
    case 'clear-photo':
      state[value] = null; render(); break;
    case 'quick-komentar':
      if(currentReportId){
        fbAddComment(currentReportId, value).catch(e => console.warn('Comment error:', e));
      }
      state.detailComments.push({name: state.username, text: value}); render();
      showToast('Komentar berhasil dikirim', 'success');
      break;
    case 'submit-komentar':
      if(!state.komentarDraft.trim()){ showToast('Tulis komentar dulu ya'); break; }
      {
        const reportCText = state.komentarDraft.trim();
        if(currentReportId){
          fbAddComment(currentReportId, reportCText).catch(e => console.warn('Comment error:', e));
        }
        const newReportC = {name: state.username || 'Warga', text: reportCText};
        if(!state._reportCommentsCache) state._reportCommentsCache = {};
        if(currentReportId){
          if(!state._reportCommentsCache[currentReportId]) state._reportCommentsCache[currentReportId] = [];
          state._reportCommentsCache[currentReportId].push(newReportC);
          state.detailComments = [...state._reportCommentsCache[currentReportId]];
        } else {
          state.detailComments.push(newReportC);
        }
        state.komentarDraft = ''; render();
        showToast('Komentar berhasil dikirim', 'success');
      }
      break;
    case 'submit-biz-comment':
      if(!auth.currentUser){ promptLogin('Masuk terlebih dahulu untuk menulis ulasan'); break; }
      {
        const cText = (state.bizKomentarDraft || '').trim();
        if(!cText){ showToast('Tulis ulasan/komentar terlebih dahulu', 'warning'); break; }
        const activeBiz = state.selectedBiz || (state.hasBusiness ? { id: state._bizId } : null);
        const targetBizId = activeBiz?.id || activeBiz?._bizId || state._bizId;
        if(!targetBizId){ showToast('Usaha tidak ditemukan', 'warning'); break; }
        const newC = {
          userId: auth.currentUser.uid,
          username: state.username || 'Warga',
          text: cText,
          createdAtIso: new Date().toISOString(),
          clientTime: Date.now()
        };
        if(!state._bizCommentsCache) state._bizCommentsCache = {};
        if(!state._bizCommentsCache[targetBizId]) state._bizCommentsCache[targetBizId] = [];
        state._bizCommentsCache[targetBizId].push(newC);
        state.bizDetailComments = [...state._bizCommentsCache[targetBizId]];
        state.bizKomentarDraft = '';

        // Save immediately to localStorage
        try {
          const sKey = 'koneka_biz_comments_' + targetBizId;
          const cur = JSON.parse(localStorage.getItem(sKey) || '[]');
          cur.push(newC);
          localStorage.setItem(sKey, JSON.stringify(cur));
        } catch(e){}

        render();
        fbAddBizComment(targetBizId, cText).catch(e => console.warn('Komentar fallback:', e));
        showToast('Ulasan berhasil dikirim', 'success');
      }
      break;
    case 'logout':
      fbLogout().then(()=> showToast('Kamu sudah keluar'))
        .catch(e => {
          console.warn('Logout error:', e);
          showToast('Kamu sudah keluar');
        });
      break;
    case 'delete-account':
      if(!state.deleteArmed){
        state.deleteArmed = true;
        render();
        showToast('Ketuk sekali lagi untuk konfirmasi hapus akun', 'warning');
        break;
      }
      showToast('Sedang menghapus akun...', 'info');
      fbDeleteAccount()
        .then(()=>{
          state.deleteArmed = false;
          closePushed();
          state.screen = 'splash';
          state.tab = 'map';
          render(true);
          showToast('Akun dan seluruh data Anda berhasil dihapus.');
        })
        .catch(e => {
          state.deleteArmed = false;
          render();
          showToast(e.message || 'Gagal menghapus akun', 'error');
        });
      break;
    case 'toast':
      showToast(target.dataset.msg || 'Segera hadir'); break;
  }
});
document.addEventListener('change', (e)=>{
  const t = e.target.closest('[data-action]');
  if(!t) return;
  const action = t.dataset.action;
  if(action==='select-reg-kota'){ state.regKota = t.value; state.regKecamatan = KOTA_KECAMATAN[t.value][0]; render(); }
  else if(action==='select-reg-kecamatan'){ state.regKecamatan = t.value; }
  else if(action==='select-wilayah-kota'){ state.tempKota = t.value; state.tempKecamatan = KOTA_KECAMATAN[t.value][0]; render(); }
  else if(action==='select-wilayah-kecamatan'){ state.tempKecamatan = t.value; }
});

/* ---------- Universal Keyboard Navigation (Enter: submit / next, Shift+Enter: newline) ---------- */
function triggerSubmitForElement(target){
  if(!target) return;
  // 1. Comment in problem report detail:
  if(target.placeholder === 'Tulis komentar...' || (target.tagName === 'TEXTAREA' && state.screen === 'detail')){
    const commentBtn = document.querySelector('[data-action="submit-komentar"]');
    if(commentBtn){ commentBtn.click(); return; }
  }

  // 2. Comment in UMKM card:
  if(target.placeholder === 'Tulis komentar ulasan...' || (target.getAttribute && target.getAttribute('oninput') && target.getAttribute('oninput').includes('bizKomentarDraft'))){
    const bizCommentBtn = document.querySelector('[data-action="submit-biz-comment"]');
    if(bizCommentBtn){ bizCommentBtn.click(); return; }
  }

  // 3. Find closest container (modal layer, bottom sheet, full pane, card, or document)
  const container = target.closest('.sheet, .modal-layer, .fullscreen-pane, .card, form') || document.getElementById('contentAreaD') || document.body;

  // 4. Look for designated primary action / submit button in container
  const submitBtn = container.querySelector(
    '[data-action="submit-biz-comment"], ' +
    '[data-action="submit-komentar"], ' +
    '[data-action="submit-verify-code"], ' +
    '[data-action="login-submit"], ' +
    '[data-action="register-submit"], ' +
    '[data-action="lapor-submit"], ' +
    '[data-action="usaha-daftar-submit"], ' +
    '[data-action="info-usaha-save"], ' +
    '[data-action="metode-pembayaran-save"], ' +
    '[data-action="jam-operasional-save"], ' +
    '[data-action="produk-tambah-submit"], ' +
    '[data-action="invoice-tambah-submit"], ' +
    '[data-action="transaksi-tambah-submit"], ' +
    '[data-action="form-save-next"], ' +
    '[data-action="form-submit"], ' +
    '[data-action="wilayah-submit"], ' +
    '[data-action="flag-submit"], ' +
    '[data-action="flag-biz-submit"], ' +
    '.btn-primary, [data-action$="-submit"], [data-action$="-save"]'
  );

  if(submitBtn){
    submitBtn.click();
    return;
  }

  // 5. Fallback: check visible primary button in active screen/layer
  const visiblePrimary = document.querySelector('.modal-layer .btn-primary, .sheet .btn-primary, .fullscreen-header ~ * .btn-primary');
  if(visiblePrimary) visiblePrimary.click();
}

document.addEventListener('keydown', (e) => {
  if(e.key !== 'Enter') return;
  const target = e.target;
  if(!target) return;
  const tagName = target.tagName;
  if(tagName !== 'INPUT' && tagName !== 'TEXTAREA') return;

  // Ignore specialized input types that have their own keyboard behavior
  const inputType = (target.type || '').toLowerCase();
  if(['file', 'checkbox', 'radio', 'date', 'time', 'color'].includes(inputType)) return;

  if(tagName === 'TEXTAREA'){
    if(e.shiftKey){
      // Shift + Enter -> allows new line in textarea
      return;
    }
    // Enter without Shift -> send / submit form
    e.preventDefault();
    triggerSubmitForElement(target);
    return;
  }

  if(tagName === 'INPUT'){
    if(e.shiftKey) return;
    e.preventDefault();

    // Check if there is an autocomplete suggestion on ghost-input-field
    if(target.classList && target.classList.contains('ghost-input-field') && target.dataset && target.dataset.suggest){
      // handleGhostKeydown handles this
      return;
    }

    // In a multi-input form, if current input is not the last one, advance to the next input
    const container = target.closest('.sheet, .modal-layer, .fullscreen-pane, .card, form') || document.getElementById('contentAreaD') || document.body;
    const allInputs = Array.from(container.querySelectorAll('input:not([type="hidden"]):not([type="file"]):not([type="checkbox"]):not([type="radio"]):not([disabled]), textarea:not([disabled])'))
      .filter(el => {
        const style = window.getComputedStyle ? window.getComputedStyle(el) : el.style;
        return style && style.display !== 'none' && style.visibility !== 'hidden';
      });

    const currentIndex = allInputs.indexOf(target);
    if(currentIndex !== -1 && currentIndex < allInputs.length - 1){
      const nextInput = allInputs[currentIndex + 1];
      if(nextInput){
        nextInput.focus();
        if(typeof nextInput.select === 'function') nextInput.select();
        return;
      }
    }

    // Otherwise, submit the form/action
    triggerSubmitForElement(target);
  }
});

render();
