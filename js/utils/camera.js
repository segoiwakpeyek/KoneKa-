/* ---------- Upload foto: kamera langsung atau file/galeri ---------- */
function handlePhotoInput(e, key){
  const file = e.target.files && e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const raw = reader.result;
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const MAX = 640;
        let w = img.width, h = img.height;
        if(w > MAX || h > MAX){
          if(w > h){ h = Math.round(h * MAX / w); w = MAX; }
          else { w = Math.round(w * MAX / h); h = MAX; }
        }
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        const compressed = canvas.toDataURL('image/jpeg', 0.55);
        state[key] = compressed;
        if(key === 'profilePhoto' && typeof auth !== 'undefined' && auth.currentUser){
          db.collection('users').doc(auth.currentUser.uid).update({ avatarUrl: compressed })
            .then(() => showToast('Foto profil berhasil disimpan', 'success'))
            .catch(err => console.error('Save avatar err:', err));
        }
      } catch(err) {
        state[key] = raw;
      }
      render();
    };
    img.onerror = () => {
      state[key] = raw;
      render();
    };
    img.src = raw;
  };
  reader.readAsDataURL(file);
}

/* ---------- Live Camera System (Viewfinder & Snapshot) ---------- */
let _cameraMediaStream = null;

async function startLiveCamera(targetKey, facingMode){
  state.cameraTargetKey = targetKey || 'formPhoto';
  state.cameraFacingMode = facingMode || state.cameraFacingMode || 'environment';
  state.cameraActive = true;

  const camLayer = el('cameraLayerD');
  if(camLayer){
    camLayer.innerHTML = cameraModalHTML();
  }

  try {
    if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){
      throw new Error('WebRTC mediaDevices tidak didukung di peramban ini');
    }
    if(_cameraMediaStream){
      _cameraMediaStream.getTracks().forEach(t => t.stop());
      _cameraMediaStream = null;
    }
    const constraints = {
      video: {
        facingMode: { ideal: state.cameraFacingMode },
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    _cameraMediaStream = stream;
    const video = el('cameraLiveFeed');
    if(video){
      video.srcObject = stream;
      await video.play().catch(e => console.log('Video play error:', e));
    }
  } catch(err){
    console.warn('Camera access failed, falling back to file input:', err);
    stopLiveCamera();
    showToast('Kamera live tidak dapat dibuka langsung. Mengalihkan ke galeri/kamera HP.', 'warning');
    const fileIn = el('fileFallback_' + state.cameraTargetKey);
    if(fileIn) fileIn.click();
  }
}

function stopLiveCamera(){
  if(_cameraMediaStream){
    _cameraMediaStream.getTracks().forEach(t => t.stop());
    _cameraMediaStream = null;
  }
  state.cameraActive = false;
  state.cameraTargetKey = null;
  const camLayer = el('cameraLayerD');
  if(camLayer) camLayer.innerHTML = '';
  render();
}

function snapLiveCamera(){
  const video = el('cameraLiveFeed');
  if(!video || !video.videoWidth){
    showToast('Kamera sedang memuat gambar, silakan tunggu sejenak...', 'warning');
    return;
  }
  const canvas = document.createElement('canvas');
  const maxW = 1000;
  const scale = Math.min(1, maxW / video.videoWidth);
  canvas.width = Math.round(video.videoWidth * scale);
  canvas.height = Math.round(video.videoHeight * scale);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  const dataUrl = canvas.toDataURL('image/jpeg', 0.8);

  const key = state.cameraTargetKey;
  if(key){
    state[key] = dataUrl;
    if(key === 'profilePhoto' && typeof auth !== 'undefined' && auth.currentUser){
      db.collection('users').doc(auth.currentUser.uid).update({ avatarUrl: dataUrl })
        .then(() => showToast('Foto profil berhasil disimpan', 'success'))
        .catch(err => console.error('Save avatar err:', err));
    }
  }
  stopLiveCamera();
  showToast('Foto berhasil diambil', 'success');
}

function flipLiveCamera(){
  const newMode = state.cameraFacingMode === 'environment' ? 'user' : 'environment';
  startLiveCamera(state.cameraTargetKey, newMode);
}

function cameraModalHTML(){
  if(!state.cameraActive) return '';
  return `<div class="camera-modal-backdrop" style="position:fixed;inset:0;background:#000;z-index:9999;display:flex;flex-direction:column;justify-content:space-between;color:#fff">
    <!-- Header Bar -->
    <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;z-index:2;background:linear-gradient(180deg,rgba(0,0,0,0.7) 0%,transparent 100%)">
      <button type="button" class="icon-btn pressable" data-action="close-camera" style="background:rgba(255,255,255,0.18);border:none;color:#fff;width:38px;height:38px;border-radius:50%">
        ${ICONS.close}
      </button>
      <span style="font-size:14px;font-weight:600;letter-spacing:0.3px">Kamera Langsung</span>
      <button type="button" class="icon-btn pressable" data-action="flip-camera" title="Putar Kamera Depan/Belakang" style="background:rgba(255,255,255,0.18);border:none;color:#fff;width:38px;height:38px;border-radius:50%">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px"><path d="M20 10c0-4.4-3.6-8-8-8s-8 3.6-8 8"/><path d="M4 10l4-4M4 10l4 4"/><path d="M4 14c0 4.4 3.6 8 8 8s8-3.6 8-8"/><path d="M20 14l-4 4M20 14l-4-4"/></svg>
      </button>
    </div>

    <!-- Viewfinder Area -->
    <div style="position:relative;flex:1;display:flex;align-items:center;justify-content:center;overflow:hidden;background:#080808">
      <video id="cameraLiveFeed" autoplay playsinline muted style="width:100%;height:100%;object-fit:cover"></video>
      <!-- Viewfinder Guide Frame -->
      <div style="position:absolute;inset:28px;border:1.5px solid rgba(255,255,255,0.22);border-radius:18px;pointer-events:none">
        <div style="position:absolute;top:-2px;left:-2px;width:20px;height:20px;border-top:3.5px solid #fff;border-left:3.5px solid #fff;border-top-left-radius:18px"></div>
        <div style="position:absolute;top:-2px;right:-2px;width:20px;height:20px;border-top:3.5px solid #fff;border-right:3.5px solid #fff;border-top-right-radius:18px"></div>
        <div style="position:absolute;bottom:-2px;left:-2px;width:20px;height:20px;border-bottom:3.5px solid #fff;border-left:3.5px solid #fff;border-bottom-left-radius:18px"></div>
        <div style="position:absolute;bottom:-2px;right:-2px;width:20px;height:20px;border-bottom:3.5px solid #fff;border-right:3.5px solid #fff;border-bottom-right-radius:18px"></div>
      </div>
    </div>

    <!-- Shutter Controls Bar -->
    <div style="display:flex;align-items:center;justify-content:space-around;padding:22px 20px calc(22px + env(safe-area-inset-bottom, 0px));background:linear-gradient(0deg,rgba(0,0,0,0.85) 0%,transparent 100%);z-index:2">
      <div style="width:48px;height:48px"></div>
      <!-- Shutter Button -->
      <button type="button" class="pressable" data-action="snap-camera" title="Jepret Foto" style="width:72px;height:72px;border-radius:50%;border:4px solid #fff;background:transparent;padding:4px;cursor:pointer;outline:none;box-shadow:0 0 20px rgba(0,0,0,0.6)">
        <span style="display:block;width:100%;height:100%;border-radius:50%;background:#fff"></span>
      </button>
      <div style="width:48px;height:48px;display:flex;align-items:center;justify-content:center">
        <button type="button" class="pressable" data-action="close-camera" style="background:none;border:none;color:rgba(255,255,255,0.85);font-size:13px;font-weight:600;cursor:pointer">Batal</button>
      </div>
    </div>
  </div>`;
}

function photoUploadBox(key, heightPx){
  heightPx = heightPx || 120;
  const val = state[key];
  if(val){
    return `<div class="photo-preview-wrap">
      <img src="${val}" style="height:${heightPx}px;width:100%;object-fit:cover;border-radius:12px;cursor:pointer" data-action="zoom-photo" data-photo="${val}"/>
      <span class="icon-btn pressable" style="position:absolute;top:6px;right:6px;background:rgba(0,0,0,.5);border-color:transparent;color:#fff" data-action="clear-photo" data-value="${key}">${ICONS.close}</span>
    </div>`;
  }
  return `<div style="display:flex;gap:8px;margin-bottom:14px">
    <button type="button" class="btn btn-ghost pressable upload-label" style="flex:1" data-action="open-camera" data-target="${key}">
      <span style="width:14px;height:14px;display:inline-flex">${ICONS.camera}</span> Kamera
    </button>
    <label class="btn btn-ghost pressable upload-label" style="flex:1">
      <span style="width:14px;height:14px;display:inline-flex">${ICONS.image}</span> Galeri/File
      <input type="file" id="fileFallback_${key}" accept="image/*" style="display:none" onchange="handlePhotoInput(event,'${key}')">
    </label>
  </div>`;
}

function showToast(msg, type = 'auto'){
  const t = el('toastD');
  if(!t || !msg) return;
  if(typeof msg === 'string'){
    msg = msg.replace(/[\u{1F300}-\u{1FAD6}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}]/gu, '').trim();
  }
  let semantic = type;
  if(semantic === 'auto'){
    const lower = (msg||'').toLowerCase();
    if(lower.includes('berhasil') || lower.includes('sukses') || lower.includes('selamat') || lower.includes('terkirim') || lower.includes('lunas') || lower.includes('tersimpan')){
      semantic = 'success';
    } else if(lower.includes('gagal') || lower.includes('salah') || lower.includes('error') || lower.includes('minimal') || lower.includes('wajib') || lower.includes('habis') || lower.includes('dulu ya')){
      semantic = 'error';
    } else if(lower.includes('cooldown') || lower.includes('tunggu') || lower.includes('30 hari') || lower.includes('menipis') || lower.includes('perhatian')){
      semantic = 'warning';
    } else {
      semantic = 'info';
    }
  }
  t.className = 'toast toast-' + semantic;
  let dotColor = 'var(--blue)';
  if(semantic === 'success') dotColor = 'var(--green)';
  else if(semantic === 'error') dotColor = 'var(--red)';
  else if(semantic === 'warning') dotColor = 'var(--amber)';

  const dot = `<span style="width:8px;height:8px;border-radius:50%;background:${dotColor};display:inline-block;flex-shrink:0"></span>`;
  t.innerHTML = `<span style="display:inline-flex;align-items:center;gap:8px">${dot}<span>${msg}</span></span>`;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(()=> {
    t.classList.remove('show');
  }, 2400);
}
function showPushNotification(title, body){
  showToast(`${title}: ${body}`);
}

function overlayInner(){
  if(state.overlay==='amber') return amberSheetInner();
  if(state.overlay==='umkm') return umkmCardInner();
  if(state.overlay==='authRequired') return authRequiredInner();
  if(state.overlay==='flag') return flagSheetInner();
  if(state.overlay==='flagBiz') return flagBizSheetInner();
  return '';
}
function promptLogin(msg){
  state.overlay = 'authRequired';
  state.authPromptMsg = msg || null;
  render();
}
function setTab(tab){
  state.isPickingLocation = false;
  state.isPickingBizLocation = false;
  state.screen = tab; state.tab = tab; state.overlay = null;
  render();
}
function pushScreen(name, opts={}){
  Object.assign(state, opts);
  state.screen = name;
  render(true);
}
function closePushed(){
  state.isPickingLocation = false;
  state.isPickingBizLocation = false;
  state.screen = state.tab;
  render();
}