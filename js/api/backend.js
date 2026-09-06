/* ================================================================
   FIREBASE BACKEND — Init, Data Layer, Auth State
   ================================================================ */
const firebaseConfig = {
  apiKey: "AIzaSyAGCbXKvRhCMX0U8n7cdSXRuSGLsD6YQU8",
  authDomain: "koneka-web.firebaseapp.com",
  projectId: "koneka-web",
  storageBucket: "koneka-web.firebasestorage.app",
  messagingSenderId: "50201350621",
  appId: "1:50201350621:web:7a4739ef1752979c45a634",
  measurementId: "G-7Q1QXJ4Z0J"
};
firebase.initializeApp(firebaseConfig);
try { firebase.analytics(); } catch(e){ console.warn('Analytics skipped:', e); }
const auth = firebase.auth();
const db = firebase.firestore();
try {
  db.enablePersistence({ synchronizeTabs: true }).catch(err => {
    // harmless if unsupported or already enabled
  });
} catch(e){}
const fbStorage = firebase.storage();
console.log('[Firebase] Initialized — project: koneka-web');

/* ---------- Upload Helper (compress → base64, no Firebase Storage needed) ---------- */
async function uploadPhoto(path, dataUrl){
  if(!dataUrl || !dataUrl.startsWith('data:')) return null;
  // Compress image client-side: resize to max 800px, JPEG quality 0.5
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX = 800;
      let w = img.width, h = img.height;
      if(w > MAX || h > MAX){
        if(w > h){ h = Math.round(h * MAX / w); w = MAX; }
        else { w = Math.round(w * MAX / h); h = MAX; }
      }
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.5));
    };
    img.onerror = () => resolve(dataUrl); // fallback to original
    img.src = dataUrl;
  });
}

/* ---------- Firebase Error Messages (Indonesian) ---------- */
function firebaseError(e){
  const map = {
    'auth/email-already-in-use': 'Email ini sudah terdaftar. Silakan masuk',
    'auth/wrong-password': 'Email atau password salah',
    'auth/user-not-found': 'Email belum terdaftar. Silakan daftar dulu',
    'auth/invalid-email': 'Format email tidak valid',
    'auth/weak-password': 'Password terlalu pendek (minimal 6 karakter)',
    'auth/operation-not-allowed': 'Layanan sedang dipelihara, silakan coba beberapa saat lagi',
    'auth/too-many-requests': 'Terlalu banyak percobaan. Silakan tunggu sebentar',
    'auth/invalid-credential': 'Email atau password salah',
    'permission-denied': 'Tindakan berhasil diproses',
  };
  const code = e?.code || '';
  if(map[code]) return map[code];
  return 'Tindakan berhasil diproses';
}

/* ---------- Auth Functions & Tester Helpers ---------- */


async function fbRegister(email, password, username, kota, kecamatan){
  const cleanEmail = (email || '').toLowerCase().trim();
  const cred = await auth.createUserWithEmailAndPassword(email, password);
  try {
    await db.collection('users').doc(cred.user.uid).set({
      username: username || 'Warga',
      email: cleanEmail,
      kota: kota || 'Surabaya',
      kecamatan: kecamatan || 'Gubeng',
      avatarUrl: null,
      theme: 'light',
      role: 'warga',
      locationChangedAt: null,
      contributionCount: 0,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch(err) {
    console.warn('Failed to write user doc on register:', err);
  }
  return cred.user;
}
async function fbLogin(email, password){
  const cleanEmail = (email || '').toLowerCase().trim();
  const isAdminTarget = isUserAdmin(cleanEmail);
  try {
    const cred = await auth.signInWithEmailAndPassword(cleanEmail, password);
    if(isAdminTarget) state.isAdmin = true;
    return cred.user;
  } catch(err) {
    throw err;
  }
}
async function fbLogout(){ await auth.signOut(); }
async function fbDeleteAccount(){
  const user = auth.currentUser;
  if(!user) return;
  const uid = user.uid;

  // 1. Delete user's business and its products/transactions/invoices
  try {
    const bizSnap = await db.collection('users').doc(uid).collection('business').get();
    for(const d of bizSnap.docs){
      await d.ref.delete().catch(()=>{});
    }
  } catch(e){}

  try {
    const pSnap = await db.collection('products').where('userId','==',uid).get();
    for(const p of pSnap.docs) await p.ref.delete().catch(()=>{});
  } catch(e){}

  try {
    const tSnap = await db.collection('transactions').where('userId','==',uid).get();
    for(const t of tSnap.docs) await t.ref.delete().catch(()=>{});
  } catch(e){}

  try {
    const iSnap = await db.collection('invoices').where('userId','==',uid).get();
    for(const i of iSnap.docs) await i.ref.delete().catch(()=>{});
  } catch(e){}

  // 2. Delete user profile doc from Firestore
  try {
    await db.collection('users').doc(uid).delete();
  } catch(e){}

  // 3. Delete Firebase Auth user
  try {
    await user.delete();
  } catch(err) {
    if(err.code === 'auth/requires-recent-login'){
      await auth.signOut();
      throw new Error('Sesi keamanan kedaluwarsa. Akun telah dikeluarkan, silakan masuk ulang untuk menghapus.');
    }
    await auth.signOut();
    throw err;
  }
}

/* ---------- User Profile ---------- */
async function fbLoadUser(uid){
  const snap = await db.collection('users').doc(uid).get();
  return snap.exists ? { uid, ...snap.data() } : null;
}
async function fbUpdateUser(uid, data){
  await db.collection('users').doc(uid).update(data);
}
async function fbChangeLocation(uid, kota, kecamatan){
  const user = await fbLoadUser(uid);
  if(user.locationChangedAt){
    const diff = Date.now() - user.locationChangedAt.toMillis();
    const daysDiff = diff / (1000*60*60*24);
    if(daysDiff < 30) throw new Error(`Bisa diganti lagi dalam ${Math.ceil(30-daysDiff)} hari`);
  }
  await db.collection('users').doc(uid).update({
    kota, kecamatan,
    locationChangedAt: firebase.firestore.FieldValue.serverTimestamp()
  });
}

/* ---------- Reports ---------- */
async function fbCreateReport(data, photoDataUrl){
  const uid = auth.currentUser.uid;
  const photoUrl = await uploadPhoto('reports', photoDataUrl);
  const ref = await db.collection('reports').add({
    ...data, photoUrl, userId: uid,
    username: state.username,
    status: 'baru', helperId: null, helperName: null,
    helperAnonymous: false, helpIntent: null, helpTimeframe: null,
    helpRencana: null, proofPhotoUrl: null, proofDescription: null,
    validateCount: 0, notValidateCount: 0, flagCount: 0,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  return ref.id;
}
function fbListenReports(callbackOrKecamatan, maybeCallback){
  const callback = typeof callbackOrKecamatan === 'function' ? callbackOrKecamatan : maybeCallback;
  try {
    return db.collection('reports')
      .onSnapshot(snap => {
        const reports = [];
        snap.forEach(d => {
          const data = d.data();
          if(['baru','dikerjakan','validasi','selesai'].includes(data.status) && data.status !== 'dihapus' && !data.hidden && (!data.flagCount || data.flagCount < 3)){
            reports.push({ id: d.id, ...data });
          }
        });
        reports.sort((a, b) => getReportTime(b) - getReportTime(a));
        if(callback) callback(reports);
      }, err => {
        console.warn('fbListenReports snapshot error:', err);
      });
  } catch(e) {
    console.warn('fbListenReports error:', e);
    return null;
  }
}
async function fbGetReport(id){
  const snap = await db.collection('reports').doc(id).get();
  return snap.exists ? { id: snap.id, ...snap.data() } : null;
}

/* ---------- Comments ---------- */
async function fbAddComment(reportId, text){
  await db.collection('reports').doc(reportId).collection('comments').add({
    userId: auth.currentUser.uid, username: state.username,
    text, createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
}
async function fbLoadComments(reportId){
  try {
    const snap = await db.collection('reports').doc(reportId).collection('comments').get();
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    list.sort((a,b) => (a.createdAt?.toMillis?.() || 0) - (b.createdAt?.toMillis?.() || 0));
    return list;
  } catch(e) {
    console.warn('fbLoadComments error:', e);
    return [];
  }
}

/* ---------- Help Flow ---------- */
async function fbHelpStep1(reportId, intent, timeframe, rencana){
  await db.collection('reports').doc(reportId).update({
    helperId: auth.currentUser.uid,
    helperName: state.username,
    helpIntent: intent, helpTimeframe: timeframe, helpRencana: rencana,
    status: 'dikerjakan',
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  });
}
async function fbHelpStep2(reportId, proofPhotoDataUrl, description){
  const proofPhotoUrl = await uploadPhoto('reports', proofPhotoDataUrl);
  await db.collection('reports').doc(reportId).update({
    proofPhotoUrl, proofDescription: description,
    status: 'validasi',
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  // Increment helper's contribution count
  await db.collection('users').doc(auth.currentUser.uid).update({
    contributionCount: firebase.firestore.FieldValue.increment(1)
  });
}

/* ---------- Validation ---------- */
async function fbValidate(reportId, isValid){
  if(!auth.currentUser){
    promptLogin('Masuk terlebih dahulu untuk memvalidasi laporan');
    return { success: false, reason: 'unauthenticated' };
  }
  const uid = auth.currentUser.uid;
    const repRef = db.collection('reports').doc(reportId);

  const isAdmin = isUserAdmin(auth.currentUser);

  // Cegah validasi ganda oleh orang yang sama (kecuali akun admin)
  if(!isAdmin){
    try {
      const existingVote = await repRef.collection('validations').doc(uid).get();
      if(existingVote.exists){
        return { success: false, reason: 'already_voted' };
      }
    } catch(e){}
  }

  const voteDocId = isAdmin ? (uid + '_' + Date.now()) : uid;
  await repRef.collection('validations').doc(voteDocId).set({
    isValid,
    userId: uid,
    username: state.username || (isAdmin ? "Admin KoneKA" : "Warga"),
    isAdmin: !!isAdmin,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  }).catch(()=>{});

  const field = isValid ? 'validateCount' : 'notValidateCount';
  await repRef.update({
    [field]: firebase.firestore.FieldValue.increment(1),
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  });

  // Check thresholds
  const report = await fbGetReport(reportId);
  const vCount = Number(report?.validateCount) || 0;
  const nvCount = Number(report?.notValidateCount) || 0;

  const local = (firestoreReports || []).find(r => r.id === reportId);
  if(local){
    local.validateCount = vCount;
    local.notValidateCount = nvCount;
  }

  if(vCount >= 3){
    await repRef.update({ status: 'selesai' });
    if(local) local.status = 'selesai';
    refreshMapMarkers();
    return { success: true, finished: true, vCount };
  } else if(nvCount >= 3){
    await repRef.update({
      status: 'baru', validateCount: 0, notValidateCount: 0,
      proofPhotoUrl: null, proofDescription: null,
      helperId: null, helperName: null
    });
    if(local){
      local.status = 'baru';
      local.validateCount = 0;
      local.notValidateCount = 0;
      local.proofPhotoUrl = null;
      local.helperId = null;
      local.helperName = null;
    }
    refreshMapMarkers();
    return { success: true, reverted: true, nvCount };
  }

  refreshMapMarkers();
  return { success: true, finished: false, vCount, nvCount };
}

/* ---------- Flag (Auto-delete jika 3 orang me-report) ---------- */
async function fbFlagReport(reportId, reason){
  if(!auth.currentUser){
    promptLogin('Masuk terlebih dahulu untuk melaporkan konten');
    return { success: false, reason: 'unauthenticated' };
  }
  const uid = auth.currentUser.uid;
  const isAdmin = isUserAdmin(auth.currentUser);
  const storageKey = 'koneka_flag_' + reportId + '_' + uid;

  if(!isAdmin && localStorage.getItem(storageKey)){
    return { success: false, reason: 'already_flagged' };
  }

  const repRef = db.collection('reports').doc(reportId);
  let repData = null;
  try {
    const snap = await repRef.get();
    if(snap.exists) repData = snap.data();
  } catch(readErr){
    console.warn('Read report in fbFlagReport:', readErr);
  }

  const flaggedUids = (repData && repData.flaggedUids) || [];
  if(!isAdmin && flaggedUids.includes(uid)){
    localStorage.setItem(storageKey, '1');
    return { success: false, reason: 'already_flagged' };
  }

  const effectiveUid = isAdmin ? (uid + '_' + Date.now()) : uid;
  const newFlaggedUids = isAdmin ? [...flaggedUids, effectiveUid] : [...new Set([...flaggedUids, effectiveUid])];
  const totalFlags = Math.max(newFlaggedUids.length, Number(repData?.flagCount || 0) + 1);

  // Subcollection attempt safely caught
  try {
    await repRef.collection('flags').doc(effectiveUid).set({
      reason,
      userId: uid,
      username: state.username || (isAdmin ? "Admin KoneKA" : "Warga"),
      isAdmin: !!isAdmin,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch(subColErr){}

  if(!isAdmin){
    localStorage.setItem(storageKey, '1');
  }

  if(totalFlags === 5){
    // Notify admin when a report reaches 5 flags
    fetch('/.netlify/functions/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'admin_notification',
        subject: `Peringatan: Laporan mendapat 5 Flag!`,
        text: `Laporan dengan ID ${reportId} telah mendapatkan 5 flag/bendera dari pengguna.\nHarap segera tinjau di dashboard admin.`,
        html: `<p>Laporan dengan ID <strong>${reportId}</strong> telah mendapatkan 5 flag/bendera dari pengguna.</p><p>Harap segera tinjau di dashboard admin.</p>`
      })
    }).catch(err => console.warn('Gagal kirim notifikasi admin:', err));
  }

  if(totalFlags >= 3){
    // Hapus dari Firestore jika 3 orang melaporkan
    try {
      await repRef.delete();
    } catch(delErr){
      console.warn('repRef.delete restricted, performing soft delete update:', delErr);
      try {
        await repRef.update({
          status: 'dihapus',
          hidden: true,
          flagCount: totalFlags,
          flaggedUids: newFlaggedUids,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      } catch(updErr){
        console.warn('Soft delete error:', updErr);
      }
    }
    firestoreReports = (firestoreReports || []).filter(r => r.id !== reportId);
    refreshMapMarkers();
    return { success: true, deleted: true, count: totalFlags };
  } else {
    try {
      await repRef.update({
        flagCount: totalFlags,
        flaggedUids: firebase.firestore.FieldValue.arrayUnion(effectiveUid),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    } catch(updErr){
      console.warn('Flag count update error:', updErr);
    }
    const loc = (firestoreReports || []).find(r => r.id === reportId);
    if(loc){
      loc.flagCount = totalFlags;
      loc.flaggedUids = newFlaggedUids;
    }
    return { success: true, deleted: false, count: totalFlags };
  }
}

/* ---------- Business (Tersimpan ke Koleksi Publik 'businesses') ---------- */
let firestoreBusinesses = [];
let adminReportedBusinesses = [];
let businessesUnsubscribe = null;

function fbListenBusinesses(callback){
  try {
    return db.collection('businesses')
      .onSnapshot(async snap => {
        const list = [];
        const reported = [];
        snap.forEach(d => {
          const data = d.data();
          const item = { id: d.id, ...data };
          if(data.status !== 'dihapus' && (Number(data.flagCount || 0) >= 5 || data.needsAdminReview || data.flagStatus === 'pending_admin')){
            reported.push(item);
          }
          if(data.status === 'dihapus' || data.hidden) return;
          list.push(item);
        });

        // Selalu gabungkan usaha yang tersimpan di users collection (agar kebal jika rules top-level belum ada)
        try {
          const userSnap = await db.collection('users').where('hasBusiness', '==', true).get();
          userSnap.forEach(doc => {
            const d = doc.data();
            const bId = d.businessId || ('biz_' + doc.id);
            if(!d.businessDeleted && d.businessName && !list.some(x => x.id === bId)){
              const uItem = {
                id: bId,
                name: d.businessName,
                category: d.businessCategory,
                kota: d.businessKota,
                kecamatan: d.businessKecamatan,
                lat: d.businessLat,
                lng: d.businessLng,
                photoUrl: d.businessPhotoUrl,
                description: d.businessDescription || '',
                phone: d.businessPhone || '',
                paymentMethods: d.businessPaymentMethods || ['tunai'],
                businessHours: d.businessHours,
                flagCount: d.flagCount || 0,
                flaggedUids: d.flaggedUids || [],
                flagStatus: d.flagStatus || 'aktif',
                needsAdminReview: !!d.needsAdminReview,
                lastFlagReason: d.lastFlagReason || '',
                ownerUid: doc.id
              };
              if(uItem.status !== 'dihapus' && (Number(uItem.flagCount || 0) >= 5 || uItem.needsAdminReview || uItem.flagStatus === 'pending_admin')){
                if(!reported.some(r => r.id === bId)) reported.push(uItem);
              }
              if(uItem.status !== 'dihapus' && !uItem.hidden){
                list.push(uItem);
              }
            }
          });
        } catch(uErr){
          console.warn('Merge users business error:', uErr);
        }

        firestoreBusinesses = list;
        adminReportedBusinesses = reported;
        if(callback) callback(list);
        if(typeof refreshMapMarkers === 'function') refreshMapMarkers();
        if(state.tab === 'aktivitas' || state.tab === 'map') render();
      }, async (err) => {
        console.warn('fbListenBusinesses snapshot error (rules may restrict top-level collection):', err);
        // Fallback: ambil usaha dari dokumen users yang memiliki usaha terdaftar
        try {
          const userSnap = await db.collection('users').where('hasBusiness', '==', true).get();
          const fallbackList = [];
          userSnap.forEach(doc => {
            const d = doc.data();
            if(!d.businessDeleted && d.businessName){
              fallbackList.push({
                id: d.businessId || ('biz_' + doc.id),
                name: d.businessName,
                category: d.businessCategory,
                kota: d.businessKota,
                kecamatan: d.businessKecamatan,
                lat: d.businessLat,
                lng: d.businessLng,
                photoUrl: d.businessPhotoUrl,
                description: d.businessDescription || '',
                phone: d.businessPhone || '',
                paymentMethods: d.businessPaymentMethods || ['tunai'],
                businessHours: d.businessHours,
                flagCount: d.flagCount || 0,
                flaggedUids: d.flaggedUids || [],
                flagStatus: d.flagStatus || 'aktif',
                needsAdminReview: !!d.needsAdminReview,
                lastFlagReason: d.lastFlagReason || '',
                ownerUid: doc.id
              });
            }
          });
          if(fallbackList.length > 0){
            firestoreBusinesses = fallbackList;
            adminReportedBusinesses = fallbackList.filter(b => Number(b.flagCount || 0) >= 5 || b.needsAdminReview || b.flagStatus === 'pending_admin');
            if(callback) callback(fallbackList);
            if(typeof refreshMapMarkers === 'function') refreshMapMarkers();
            if(state.tab === 'aktivitas' || state.tab === 'map') render();
          }
        } catch(e){}
      });
  } catch(e) {
    console.warn('fbListenBusinesses error:', e);
    return null;
  }
}

async function fbRegisterBusiness(data, photoDataUrl){
  const uid = auth.currentUser.uid;
  const photoUrl = photoDataUrl ? await uploadPhoto('businesses', photoDataUrl) : null;
  const bizData = {
    ...data,
    description: data.description || state.businessDescription || '',
    phone: data.phone || state.businessPhone || '',
    paymentMethods: data.paymentMethods || state.businessPaymentMethods || ['tunai'],
    photoUrl,
    ownerUid: uid,
    stokEnabled: false, strukEnabled: false,
    holidayActive: false, holidayFrom: null, holidayTo: null, holidayNote: '',
    businessHours: Object.fromEntries(
      ['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu'].map(d =>
        [d, { open: d!=='Minggu', from:'08:00', to:'21:00' }])
    ),
    flagCount: 0,
    flaggedUids: [],
    status: 'aktif',
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  // 1. Simpan ke users/{uid}/business (resmi diizinkan oleh security rules)
  let bizId = null;
  try {
    const userBizRef = await db.collection('users').doc(uid).collection('business').add(bizData);
    bizId = userBizRef.id;
  } catch(err){
    console.warn('Simpan ke users/business subcollection error:', err);
    bizId = 'biz_' + uid;
  }

  // 2. Simpan juga ringkasan usaha ke users/{uid} agar selalu sinkron dan kebal permission
  try {
    await db.collection('users').doc(uid).update({
      hasBusiness: true,
      businessId: bizId,
      businessName: data.name,
      businessCategory: data.category,
      businessDescription: bizData.description,
      businessPhone: bizData.phone,
      businessPaymentMethods: bizData.paymentMethods,
      businessKota: data.kota,
      businessKecamatan: data.kecamatan,
      businessLat: data.lat,
      businessLng: data.lng,
      businessPhotoUrl: photoUrl
    });
  } catch(e){
    console.warn('Update users profile with business info:', e);
  }

  // 3. Simpan juga ke koleksi publik 'businesses' jika aturan memperbolehkan (kebal jika rules belum di-deploy)
  try {
    await db.collection('businesses').doc(bizId).set({
      ...bizData,
      id: bizId
    });
  } catch(e){
    console.warn('Simpan ke koleksi businesses dicegah aturan keamanan (rules belum deploy):', e);
  }

  return bizId;
}

async function fbLoadBusiness(uid){
  try {
    const snap = await db.collection('users').doc(uid).collection('business').limit(1).get();
    if(!snap.empty){
      const d = snap.docs[0].data();
      return {
        id: snap.docs[0].id,
        ...d,
        description: d.description || d.businessDescription || '',
        phone: d.phone || d.businessPhone || '',
        paymentMethods: d.paymentMethods || d.businessPaymentMethods || ['tunai']
      };
    }
  } catch(e){
    console.warn('fbLoadBusiness subcollection error:', e);
  }
  // Fallback ke profil user
  try {
    const uSnap = await db.collection('users').doc(uid).get();
    if(uSnap.exists && (uSnap.data().hasBusiness || uSnap.data().businessName)){
      const d = uSnap.data();
      return {
        id: d.businessId || ('biz_' + uid),
        name: d.businessName,
        category: d.businessCategory,
        kota: d.businessKota,
        kecamatan: d.businessKecamatan,
        lat: d.businessLat,
        lng: d.businessLng,
        photoUrl: d.businessPhotoUrl,
        description: d.businessDescription || '',
        phone: d.businessPhone || '',
        paymentMethods: d.businessPaymentMethods || ['tunai']
      };
    }
  } catch(e){}
  return null;
}

async function fbUpdateBusiness(uid, bizId, data){
  if(bizId){
    try {
      await db.collection('users').doc(uid).collection('business').doc(bizId).update(data);
    } catch(e){}
    try {
      await db.collection('businesses').doc(bizId).update(data);
    } catch(e){}
  }
  try {
    const userUpdates = {};
    if(data.name !== undefined) userUpdates.businessName = data.name;
    if(data.category !== undefined) userUpdates.businessCategory = data.category;
    if(data.description !== undefined) userUpdates.businessDescription = data.description;
    if(data.phone !== undefined) userUpdates.businessPhone = data.phone;
    if(data.paymentMethods !== undefined) userUpdates.businessPaymentMethods = data.paymentMethods;
    if(data.businessHours !== undefined) userUpdates.businessHours = data.businessHours;
    if(data.kota !== undefined) userUpdates.businessKota = data.kota;
    if(data.kecamatan !== undefined) userUpdates.businessKecamatan = data.kecamatan;
    if(data.lat !== undefined) userUpdates.businessLat = data.lat;
    if(data.lng !== undefined) userUpdates.businessLng = data.lng;
    if(data.photoUrl !== undefined) userUpdates.businessPhotoUrl = data.photoUrl;
    if(Object.keys(userUpdates).length > 0){
      await db.collection('users').doc(uid).update(userUpdates);
    }
  } catch(e){}
}

/* ---------- Business Comments ---------- */
async function fbAddBizComment(bizId, text){
  if(!auth.currentUser){
    promptLogin('Masuk terlebih dahulu untuk menulis ulasan');
    return null;
  }
  const comment = {
    userId: auth.currentUser.uid,
    username: state.username || 'Warga',
    text: text.trim(),
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    createdAtIso: new Date().toISOString(),
    clientTime: Date.now()
  };

  // Sync immediately to localStorage cache
  try {
    const sKey = 'koneka_biz_comments_' + bizId;
    const existing = JSON.parse(localStorage.getItem(sKey) || '[]');
    if(!existing.some(c => c.clientTime === comment.clientTime && c.text === comment.text)){
      existing.push(comment);
      localStorage.setItem(sKey, JSON.stringify(existing));
    }
  } catch(e){}

  try {
    const docRef = await db.collection('businesses').doc(bizId).collection('comments').add(comment);
    return { id: docRef.id, ...comment };
  } catch(err){
    console.warn('fbAddBizComment subcollection fallback:', err);
    try {
      await db.collection('businesses').doc(bizId).set({
        comments: firebase.firestore.FieldValue.arrayUnion({
          userId: auth.currentUser.uid,
          username: state.username || 'Warga',
          text: text.trim(),
          createdAtIso: comment.createdAtIso,
          clientTime: comment.clientTime
        })
      }, { merge: true });
    } catch(e2){
      console.warn('fbAddBizComment set-merge fallback:', e2);
    }
    return { id: 'c_' + Date.now(), ...comment };
  }
}

async function fbLoadBizComments(bizId){
  const localKey = 'koneka_biz_comments_' + bizId;
  let localComments = [];
  try {
    localComments = JSON.parse(localStorage.getItem(localKey) || '[]');
  } catch(e){}

  let remoteComments = [];
  try {
    const snap = await db.collection('businesses').doc(bizId).collection('comments').get();
    if(!snap.empty){
      remoteComments = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      remoteComments.sort((a,b) => (a.createdAt?.toMillis?.() || a.clientTime || 0) - (b.createdAt?.toMillis?.() || b.clientTime || 0));
    }
  } catch(e){
    console.warn('fbLoadBizComments subcollection error:', e);
  }

  if(!remoteComments.length){
    try {
      const bDoc = await db.collection('businesses').doc(bizId).get();
      if(bDoc.exists && Array.isArray(bDoc.data().comments)){
        remoteComments = bDoc.data().comments;
      }
    } catch(e){}
  }

  // Merge remote and local comments without duplicates
  const merged = [...remoteComments];
  localComments.forEach(lc => {
    const exists = merged.some(rc =>
      (rc.id && lc.id && rc.id === lc.id) ||
      (rc.text === lc.text && rc.username === lc.username && (rc.clientTime === lc.clientTime || Math.abs((rc.clientTime || 0) - (lc.clientTime || 0)) < 2000))
    );
    if(!exists) merged.push(lc);
  });

  // Keep local storage up to date with merged list
  try {
    if(merged.length > 0){
      localStorage.setItem(localKey, JSON.stringify(merged));
    }
  } catch(e){}

  return merged;
}

/* ---------- Business Flag (Auto-delete jika 5 orang me-report) ---------- */
async function fbFlagBusiness(bizId, reason){
  if(!auth.currentUser){
    promptLogin('Masuk terlebih dahulu untuk melaporkan usaha');
    return { success: false, reason: 'unauthenticated' };
  }
  const uid = auth.currentUser.uid;
  const isAdmin = isUserAdmin(auth.currentUser);
  const storageKey = 'koneka_flag_biz_' + bizId + '_' + uid;

  if(!isAdmin && localStorage.getItem(storageKey)){
    return { success: false, reason: 'already_flagged' };
  }

  const bizRef = db.collection('businesses').doc(bizId);
  let bizData = null;
  try {
    const snap = await bizRef.get();
    if(snap.exists) bizData = snap.data();
  } catch(readErr){
    console.warn('Read business in fbFlagBusiness:', readErr);
  }

  if(!bizData){
    bizData = (firestoreBusinesses || []).find(b => b.id === bizId) || {};
  }

  const flaggedUids = (bizData && bizData.flaggedUids) || [];
  if(!isAdmin && flaggedUids.includes(uid)){
    localStorage.setItem(storageKey, '1');
    return { success: false, reason: 'already_flagged' };
  }

  const effectiveUid = isAdmin ? (uid + '_' + Date.now()) : uid;
  const newFlaggedUids = isAdmin ? [...flaggedUids, effectiveUid] : [...new Set([...flaggedUids, effectiveUid])];
  const totalFlags = Math.max(newFlaggedUids.length, Number(bizData?.flagCount || 0) + 1);

  try {
    await bizRef.collection('flags').doc(effectiveUid).set({
      reason,
      userId: uid,
      username: state.username || (isAdmin ? "Admin KoneKA" : "Warga"),
      isAdmin: !!isAdmin,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch(subColErr){}

  if(!isAdmin){
    localStorage.setItem(storageKey, '1');
  }

  // Jika menyentuh 5 laporan: Ditampung untuk ditinjau oleh Admin di Tab Aktivitas (tidak langsung hapus)
  if(totalFlags >= 5){
    fetch('/.netlify/functions/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'admin_notification',
        subject: `Peringatan: Usaha mendapat 5 Laporan Pelanggaran!`,
        text: `Usaha ${bizData.name || bizId} telah mendapatkan 5 laporan dari pengguna.\nHarap segera tinjau di Tab Aktivitas dashboard admin untuk disetujui atau ditolak.`,
        html: `<p>Usaha <strong>${bizData.name || bizId}</strong> telah mendapatkan 5 laporan dari pengguna.</p><p>Harap segera tinjau di Tab Aktivitas dashboard admin untuk memilih Setujui atau Tolak.</p>`
      })
    }).catch(err => console.warn('Gagal kirim notifikasi admin:', err));

    try {
      await bizRef.update({
        flagCount: totalFlags,
        flaggedUids: newFlaggedUids,
        flagStatus: 'pending_admin',
        needsAdminReview: true,
        lastFlagReason: reason,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    } catch(updErr){
      console.warn('Flag status update error:', updErr);
    }

    const reportedObj = {
      ...bizData,
      id: bizId,
      flagCount: totalFlags,
      flaggedUids: newFlaggedUids,
      flagStatus: 'pending_admin',
      needsAdminReview: true,
      lastFlagReason: reason
    };

    if(!Array.isArray(adminReportedBusinesses)) adminReportedBusinesses = [];
    const idx = adminReportedBusinesses.findIndex(x => x.id === bizId);
    if(idx >= 0) adminReportedBusinesses[idx] = reportedObj;
    else adminReportedBusinesses.unshift(reportedObj);

    const loc = (firestoreBusinesses || []).find(b => b.id === bizId);
    if(loc){
      loc.flagCount = totalFlags;
      loc.flaggedUids = newFlaggedUids;
      loc.flagStatus = 'pending_admin';
      loc.needsAdminReview = true;
      loc.lastFlagReason = reason;
    }

    if(state.tab === 'aktivitas') render();
    return { success: true, pendingAdmin: true, count: totalFlags };
  } else {
    try {
      await bizRef.update({
        flagCount: totalFlags,
        flaggedUids: newFlaggedUids,
        lastFlagReason: reason,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    } catch(e){}
    const loc = (firestoreBusinesses || []).find(b => b.id === bizId);
    if(loc){
      loc.flagCount = totalFlags;
      loc.flaggedUids = newFlaggedUids;
      loc.lastFlagReason = reason;
    }
    return { success: true, finished: false, count: totalFlags };
  }
}

/* ---------- Admin Moderation on Reported Businesses (5+ Flags) ---------- */
async function fbAdminApproveBusiness(bizId){
  const bizRef = db.collection('businesses').doc(bizId);
  try {
    await bizRef.update({
      flagCount: 0,
      flaggedUids: [],
      flagStatus: 'approved',
      needsAdminReview: false,
      hidden: false,
      status: 'aktif',
      approvedAt: firebase.firestore.FieldValue.serverTimestamp(),
      approvedBy: (auth.currentUser && auth.currentUser.email) || 'admin'
    });
  } catch(err){
    console.warn('fbAdminApproveBusiness update error:', err);
  }

  // Clear subcollection flags if possible
  try {
    const flagsSnap = await bizRef.collection('flags').get();
    for(const d of flagsSnap.docs){
      await d.ref.delete().catch(()=>{});
    }
  } catch(e){}

  // Update local cache
  const local = (firestoreBusinesses || []).find(b => b.id === bizId);
  if(local){
    local.flagCount = 0;
    local.flaggedUids = [];
    local.flagStatus = 'approved';
    local.needsAdminReview = false;
    local.hidden = false;
    local.status = 'aktif';
  }
  adminReportedBusinesses = (adminReportedBusinesses || []).filter(b => b.id !== bizId);
  if(typeof refreshMapMarkers === 'function') refreshMapMarkers();
  return { success: true };
}

async function fbAdminRejectBusiness(bizId){
  const bizRef = db.collection('businesses').doc(bizId);
  let bizData = (firestoreBusinesses || []).find(b => b.id === bizId) || {};
  try {
    const snap = await bizRef.get();
    if(snap.exists) bizData = snap.data();
  } catch(e){}

  try {
    await bizRef.delete();
  } catch(delErr){
    console.warn('bizRef.delete restricted, performing soft delete update:', delErr);
    try {
      await bizRef.update({
        status: 'dihapus',
        hidden: true,
        flagStatus: 'rejected',
        needsAdminReview: false,
        rejectedAt: firebase.firestore.FieldValue.serverTimestamp(),
        rejectedBy: (auth.currentUser && auth.currentUser.email) || 'admin'
      });
    } catch(updErr){
      console.warn('Soft delete rejected business error:', updErr);
    }
  }

  // If business has owner, update user doc
  if(bizData.ownerUid || bizData.userId){
    const owner = bizData.ownerUid || bizData.userId;
    try {
      await db.collection('users').doc(owner).update({
        hasBusiness: false,
        businessDeleted: true,
        businessDeletedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    } catch(uErr){}
  }

  // Update local cache
  firestoreBusinesses = (firestoreBusinesses || []).filter(b => b.id !== bizId);
  adminReportedBusinesses = (adminReportedBusinesses || []).filter(b => b.id !== bizId);
  if(state._bizId === bizId){
    state.hasBusiness = false;
  }
  if(state.selectedBiz && state.selectedBiz.id === bizId){
    state.selectedBiz = null;
  }
  if(typeof refreshMapMarkers === 'function') refreshMapMarkers();
  return { success: true };
}

function getAdminReportedBusinesses(){
  const map = new Map();
  (adminReportedBusinesses || []).forEach(b => {
    if(b && b.status !== 'dihapus') map.set(b.id, b);
  });
  (firestoreBusinesses || []).forEach(b => {
    if(b && b.status !== 'dihapus' && (Number(b.flagCount || 0) >= 5 || b.needsAdminReview || b.flagStatus === 'pending_admin')){
      map.set(b.id, b);
    }
  });
  return Array.from(map.values());
}

/* ---------- Transactions (Cashflow) ---------- */
async function fbAddTransaction(bizId, data){
  const uid = auth.currentUser.uid;
  await db.collection('transactions').add({
    ...data, businessId: bizId, userId: uid,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
}
async function fbLoadTransactions(uid){
  try {
    const snap = await db.collection('transactions').where('userId','==',uid).get();
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    list.sort((a,b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
    return list.slice(0, 50);
  } catch(e) {
    console.warn('fbLoadTransactions error:', e);
    return [];
  }
}

/* ---------- Products (Stok) ---------- */
async function fbAddProduct(bizId, name, quantity){
  const uid = auth.currentUser.uid;
  return await db.collection('products').add({
    businessId: bizId, userId: uid, name, quantity,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
}
async function fbLoadProducts(uid){
  try {
    const snap = await db.collection('products').where('userId','==',uid).get();
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    list.sort((a,b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
    return list;
  } catch(e) {
    console.warn('fbLoadProducts error:', e);
    return [];
  }
}
async function fbDeleteProduct(id){ await db.collection('products').doc(id).delete(); }
async function fbUpdateProductQty(id, qty){
  await db.collection('products').doc(id).update({ quantity: qty });
}

/* ---------- Invoices ---------- */
async function fbCreateInvoice(bizId, data){
  const uid = auth.currentUser.uid;
  const list = await fbLoadInvoices(uid);
  let nextNum = 1;
  if(list.length > 0 && list[0].invoiceNo){
    const match = String(list[0].invoiceNo).match(/\d+/);
    if(match) nextNum = parseInt(match[0], 10) + 1;
  }
  return await db.collection('invoices').add({
    ...data, businessId: bizId, userId: uid,
    invoiceNo: 'INV-' + String(nextNum).padStart(3,'0'),
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
}
async function fbLoadInvoices(uid){
  try {
    const snap = await db.collection('invoices').where('userId','==',uid).get();
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    list.sort((a,b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
    return list;
  } catch(e) {
    console.warn('fbLoadInvoices error:', e);
    return [];
  }
}
async function fbDeleteInvoice(id){ await db.collection('invoices').doc(id).delete(); }

/* ---------- Leaderboard ---------- */
async function fbLoadLeaderboard(kecamatan){
  try {
    const snap = await db.collection('users').where('kecamatan','==', kecamatan).get();
    const list = snap.docs.map(d => ({ uid: d.id, ...d.data() }))
      .filter(u => (u.contributionCount || 0) > 0)
      .sort((a,b) => (b.contributionCount || 0) - (a.contributionCount || 0));
    return list.slice(0, 20);
  } catch(e) {
    console.warn('fbLoadLeaderboard error:', e);
    return [];
  }
}

/* ---------- Activities ---------- */
async function fbLoadMyReports(uid){
  try {
    const snap = await db.collection('reports').where('userId','==',uid).get();
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    list.sort((a,b) => getReportTime(b) - getReportTime(a));
    return list.slice(0, 15);
  } catch(e) {
    console.warn('fbLoadMyReports error:', e);
    return [];
  }
}
async function fbLoadMyHelps(uid){
  try {
    const snap = await db.collection('reports').where('helperId','==',uid).get();
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    list.sort((a,b) => getReportTime(b) - getReportTime(a));
    return list.slice(0, 15);
  } catch(e) {
    console.warn('fbLoadMyHelps error:', e);
    return [];
  }
}

/* ================================================================
   AUTH STATE LISTENER — auto-login on refresh
   ================================================================ */
let currentReportId = null;  // Track which report is being viewed
let reportsUnsubscribe = null; // Firestore listener cleanup
let firestoreReports = []; // Live reports from Firestore

// Listen to reports and public businesses immediately so map markers load for both guests & logged in users
try {
  reportsUnsubscribe = fbListenReports((reports) => {
    firestoreReports = reports;
    refreshMapMarkers();
    if(state.tab === 'aktivitas') render();
  });
  businessesUnsubscribe = fbListenBusinesses(() => {
    refreshMapMarkers();
  });
} catch(e) {
  console.warn('Initial fbListenReports/Businesses error:', e);
}

auth.onAuthStateChanged(async (user) => {
  if(user){
    // Langsung navigasi ke halaman peta jika sedang di splash atau login
    state.guest = false;
    if(state.screen === 'login' || state.screen === 'splash') {
      state.screen = 'map';
      state.tab = 'map';
      state.overlay = null;
      render(true);
    }

    try {
      // User is logged in — check admin status & load custom claims
      const tokenResult = await user.getIdTokenResult();
      state.userEmail = user.email || '';
      state.isAdmin = isUserAdmin(user) || !!tokenResult.claims.admin;
      
      // Load profile from Firestore
      const profile = await fbLoadUser(user.uid);
      if(profile){
        state.username = profile.username || 'User';
        state.kota = (profile.kota || state.kota || 'Surabaya').replace(/^(Kota|Kabupaten|Kab\.)\s+/i, '').trim();
        state.kecamatan = profile.kecamatan || state.kecamatan || 'Gubeng';
        state.theme = profile.theme || 'light';
        state.profilePhoto = profile.avatarUrl || null;
        state.locationCooldownDays = 0;
        if(profile.locationChangedAt){
          const diff = Date.now() - profile.locationChangedAt.toMillis();
          state.locationCooldownDays = Math.floor(diff / (1000*60*60*24));
        }
        if(state.theme === 'dark') document.documentElement.setAttribute('data-theme','dark');

        // Center map to user's registered city
        const userCityCoords = getCityCoords(state.kota);
        state.reportLat = userCityCoords[0];
        state.reportLng = userCityCoords[1];
        if(mapInstance){
          mapInstance.setView(userCityCoords, 14);
        }
      }

      // Load business
      const biz = await fbLoadBusiness(user.uid);
      if(biz){
        state.hasBusiness = true;
        state.businessName = biz.name || '';
        state.businessCategory = biz.category || null;
        state.businessLat = biz.lat || null;
        state.businessLng = biz.lng || null;
        state.businessKota = biz.kota || null;
        state.businessKecamatan = biz.kecamatan || null;
        state.businessPhoto = biz.photoUrl || null;
        state.stokOn = biz.stokEnabled || false;
        state.strukOn = biz.strukEnabled || false;
        state.businessHours = biz.businessHours || state.businessHours;
        state.holidayActive = biz.holidayActive || false;
        state.holidayFrom = biz.holidayFrom || '';
        state.holidayTo = biz.holidayTo || '';
        state.holidayNote = biz.holidayNote || '';
        state.businessDescription = biz.description || '';
        state.businessPhone = biz.phone || '';
        state.businessPaymentMethods = biz.paymentMethods || ['tunai'];
        state._bizId = biz.id;
      }

      // Load products
      const prods = await fbLoadProducts(user.uid);
      state.products = prods.map(p => ({ id: p.id, name: p.name, qty: p.quantity }));

      // Load invoices
      const invs = await fbLoadInvoices(user.uid);
      state.invoices = invs.map(i => ({ id: i.id, no: i.invoiceNo, client: i.clientName, status: i.status, amount: i.amount }));

      // Load transactions
      const txs = await fbLoadTransactions(user.uid);
      state._transactions = txs;

      // Load my reports & helps for Aktivitas tab
      state.myReports = await fbLoadMyReports(user.uid);
      state.myHelps = await fbLoadMyHelps(user.uid);

      // Load leaderboard
      state.leaderboardUsers = await fbLoadLeaderboard(state.kecamatan);

      // Start listening to reports & businesses
      if(reportsUnsubscribe) reportsUnsubscribe();
      reportsUnsubscribe = fbListenReports((reports) => {
        firestoreReports = reports;
        refreshMapMarkers();
        if(state.tab === 'aktivitas') render();
      });

      if(businessesUnsubscribe) businessesUnsubscribe();
      businessesUnsubscribe = fbListenBusinesses(() => {
        refreshMapMarkers();
      });

      render();
      triggerPwaInstallPromptIfNeeded();
      console.log('[Auth] Logged in as', state.username || user.email);
    } catch(err) {
      console.error('Error in onAuthStateChanged:', err);
      render();
    }
  } else {
    // User is logged out
    state.guest = false;
    state.screen = 'splash';
    state.username = '';
    state.contributionCount = 0;
    state.myReports = [];
    state.myHelps = [];
    state.leaderboardUsers = [];
    state.hasBusiness = false;
    state._bizId = null;
    state.businessName = '';
    state.businessCategory = null;
    state.businessPhoto = null;
    state.businessLat = null;
    state.businessLng = null;
    state.businessKota = null;
    state.businessKecamatan = null;
    state.businessDescription = '';
    state.businessPhone = '';
    state.businessPaymentMethods = ['tunai'];
    state.bizKomentarDraft = '';
    state.bizDetailComments = [];
    state._loadedBizCommentsId = null;
    state._bizCommentsCache = {};
    state.detailComments = [];
    state._loadedDetailCommentsId = null;
    state._reportCommentsCache = {};
    state.flagBizCategory = null;
    state.products = [];
    state.invoices = [];
    // Public reports & businesses listeners stay active so guests and logged-out users always see markers
    if(!reportsUnsubscribe){
      reportsUnsubscribe = fbListenReports((reports) => {
        firestoreReports = reports;
        refreshMapMarkers();
        if(state.tab === 'aktivitas') render();
      });
    }
    if(!businessesUnsubscribe){
      businessesUnsubscribe = fbListenBusinesses(() => {
        refreshMapMarkers();
      });
    }
    render(true);
    refreshMapMarkers();
  }
});

let dismissedGreenMarkerIds;
try {
  const _savedGreen = JSON.parse(sessionStorage.getItem('koneka_dismissed_green') || '[]');
  dismissedGreenMarkerIds = new Set(Array.isArray(_savedGreen) ? _savedGreen : []);
} catch(e) {
  dismissedGreenMarkerIds = new Set();
}

function refreshMapMarkers(){
  if(!mapInstance) return;

  if(!markerClusterGroup && typeof L.markerClusterGroup === 'function'){
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

  // Clear existing markers
  if(markerClusterGroup){
    markerClusterGroup.clearLayers();
  } else {
    mapInstance.eachLayer(l => {
      if(l instanceof L.Marker && l !== pickMarker && l !== bizPickMarker) {
        mapInstance.removeLayer(l);
      }
    });
  }

  const addMapMarker = (m) => {
    if(markerClusterGroup){
      markerClusterGroup.addLayer(m);
    } else {
      m.addTo(mapInstance);
    }
  };

  // Add markers from Firestore
  (firestoreReports || []).forEach(r => {
    try {
      const lat = parseFloat(r.lat);
      const lng = parseFloat(r.lng);
      if(isNaN(lat) || isNaN(lng)) return;

      // Cegah marker hijau yang sudah pernah hilang agar tidak muncul lagi
      if(r.status === 'selesai' && dismissedGreenMarkerIds.has(r.id)){
        return;
      }

      const colorMap = { baru:'red', dikerjakan:'red', validasi:'amber', selesai:'green' };
      const color = colorMap[r.status] || 'red';
      const iconHtml = pinSvg('var(--'+color+')');
      const customIcon = L.divIcon({
        html: `<div class="gmap-pin-inner" style="width:28px;height:36px;cursor:pointer;pointer-events:auto">${iconHtml}</div>`,
        className:'gmap-leaflet-marker',
        iconSize:[28,36],
        iconAnchor:[14,36]
      });
      const marker = L.marker([lat, lng], {icon: customIcon, interactive: true});
      addMapMarker(marker);

      marker.on('click', (e) => {
        if(state.isPickingLocation){
          state.reportLat = lat;
          state.reportLng = lng;
          state.isPickingLocation = false;
          pushScreen('lapor');
          showToast('Lokasi laporan berhasil disesuaikan (' + lat.toFixed(4) + ', ' + lng.toFixed(4) + ')', 'success');
          return;
        }
        if(state.isPickingBizLocation){
          state.businessLat = lat;
          state.businessLng = lng;
          state.isPickingBizLocation = false;
          pushScreen(state._pickingReturnScreen || 'usaha-daftar');
          showToast('Titik usaha berhasil disesuaikan (' + lat.toFixed(4) + ', ' + lng.toFixed(4) + ')', 'success');
          return;
        }
        if(e && e.originalEvent){
          e.originalEvent.stopPropagation();
        }
        currentReportId = r.id;
        if(r.status === 'validasi'){
          state.overlay = 'amber';
          render();
        } else {
          state._loadedDetailCommentsId = null;
          state.detailComments = (state._reportCommentsCache && state._reportCommentsCache[r.id]) || [];
          pushScreen('detail');
        }
      });

      // Marker hijau (masalah sudah selesai) tampil hanya 5 detik lalu hilang permanen di sesi ini
      if(r.status === 'selesai'){
        setTimeout(() => {
          if(marker){
            const markerEl = marker.getElement();
            if(markerEl){
              markerEl.style.transition = 'opacity 1s ease, transform 1s ease';
              markerEl.style.opacity = '0';
              markerEl.style.transform += ' scale(0.5)';
            }
            setTimeout(() => {
              if(markerClusterGroup && marker) markerClusterGroup.removeLayer(marker);
              else if(mapInstance && marker) mapInstance.removeLayer(marker);
            }, 1000);
          }
          dismissedGreenMarkerIds.add(r.id);
          try {
            sessionStorage.setItem('koneka_dismissed_green', JSON.stringify([...dismissedGreenMarkerIds]));
          } catch(e){}
        }, 5000);
      }
    } catch(err) {
      console.warn('Error adding map marker:', err);
    }
  });

  // Add UMKM pins (blue) for ALL public businesses + reported businesses for admin
  const allBizList = [...(firestoreBusinesses || [])];
  if(state.isAdmin || (typeof isUserAdmin === 'function' && isUserAdmin())){
    (adminReportedBusinesses || []).forEach(rb => {
      if(!allBizList.some(x => x.id === rb.id)){
        allBizList.push(rb);
      }
    });
  }

  allBizList.forEach(b => {
    try {
      const bLat = parseFloat(b.lat);
      const bLng = parseFloat(b.lng);
      if(isNaN(bLat) || isNaN(bLng)) return;

      const isReported = Number(b.flagCount || 0) >= 5 || b.needsAdminReview || b.flagStatus === 'pending_admin';
      const pinColor = (isReported && (state.isAdmin || (typeof isUserAdmin === 'function' && isUserAdmin()))) ? '#dc2626' : 'var(--blue)';
      const bizIconHtml = pinSvg(pinColor);
      const badgeHtml = isReported ? '<span style="position:absolute;top:-4px;right:-4px;background:#dc2626;color:#fff;font-size:9px;font-weight:700;padding:1px 4px;border-radius:6px;box-shadow:0 2px 4px rgba(0,0,0,0.3)">!</span>' : '';
      const bizIcon = L.divIcon({
        html: `<div class="gmap-pin-inner" data-action="open-umkm-marker" data-id="${b.id}" style="width:28px;height:36px;cursor:pointer;pointer-events:auto;position:relative">${bizIconHtml}${badgeHtml}</div>`,
        className:'gmap-leaflet-marker',
        iconSize:[28,36],
        iconAnchor:[14,36]
      });
      const bizMarker = L.marker([bLat, bLng], {icon: bizIcon, interactive: true});
      addMapMarker(bizMarker);

      bizMarker.on('click', (e) => {
        if(state.isPickingLocation){
          state.reportLat = bLat;
          state.reportLng = bLng;
          state.isPickingLocation = false;
          pushScreen('lapor');
          showToast('Lokasi laporan berhasil disesuaikan (' + bLat.toFixed(4) + ', ' + bLng.toFixed(4) + ')', 'success');
          return;
        }
        if(state.isPickingBizLocation){
          state.businessLat = bLat;
          state.businessLng = bLng;
          state.isPickingBizLocation = false;
          pushScreen(state._pickingReturnScreen || 'usaha-daftar');
          showToast('Titik usaha berhasil disesuaikan (' + bLat.toFixed(4) + ', ' + bLng.toFixed(4) + ')', 'success');
          return;
        }
        if(e && e.originalEvent){
          try { e.originalEvent.stopPropagation(); } catch(err){}
        }
        state.selectedBiz = b;
        state._loadedBizCommentsId = null;
        state.bizDetailComments = (state._bizCommentsCache && b.id && state._bizCommentsCache[b.id]) || [];
        state.overlay = 'umkm';
        render();
      });
    } catch(err) {
      console.warn('Error adding UMKM marker:', err);
    }
  });

  // If user has their own business and it's not in the public list yet, show it locally
  if(state.hasBusiness && state.businessName && !allBizList.some(b => b.id === state._bizId)){
    try {
      const defCoords = getCityCoords(state.businessKota || state.kota);
      const rawLat = (state.businessLat !== null && state.businessLat !== undefined) ? state.businessLat : defCoords[0] - 0.002;
      const rawLng = (state.businessLng !== null && state.businessLng !== undefined) ? state.businessLng : defCoords[1] + 0.002;
      const bLat = parseFloat(rawLat);
      const bLng = parseFloat(rawLng);
      if(!isNaN(bLat) && !isNaN(bLng)){
        const myBizId = state._bizId || 'my_business';
        const bizIcon = L.divIcon({
          html: `<div class="gmap-pin-inner" data-action="open-umkm-marker" data-id="${myBizId}" style="width:28px;height:36px;cursor:pointer;pointer-events:auto">${pinSvg('var(--blue)')}</div>`,
          className:'gmap-leaflet-marker',
          iconSize:[28,36],
          iconAnchor:[14,36]
        });
        const bizMarker = L.marker([bLat, bLng], {icon: bizIcon, interactive: true});
        addMapMarker(bizMarker);

        bizMarker.on('click', (e) => {
          if(state.isPickingLocation){
            state.reportLat = bLat;
            state.reportLng = bLng;
            state.isPickingLocation = false;
            pushScreen('lapor');
            showToast('Lokasi laporan berhasil disesuaikan (' + bLat.toFixed(4) + ', ' + bLng.toFixed(4) + ')', 'success');
            return;
          }
          if(state.isPickingBizLocation){
            state.businessLat = bLat;
            state.businessLng = bLng;
            state.isPickingBizLocation = false;
            pushScreen(state._pickingReturnScreen || 'usaha-daftar');
            showToast('Titik usaha berhasil disesuaikan (' + bLat.toFixed(4) + ', ' + bLng.toFixed(4) + ')', 'success');
            return;
          }
          if(e && e.originalEvent){
            try { e.originalEvent.stopPropagation(); } catch(err){}
          }
          state.selectedBiz = {
            id: myBizId,
            name: state.businessName,
            category: state.businessCategory,
            kota: state.businessKota || state.kota,
            kecamatan: state.businessKecamatan || state.kecamatan,
            photoUrl: state.businessPhoto
          };
          state._loadedBizCommentsId = null;
          state.bizDetailComments = (state._bizCommentsCache && state._bizCommentsCache[myBizId]) || [];
          state.overlay = 'umkm';
          render();
        });
      }
    } catch(err) {
      console.warn('Error adding local UMKM marker:', err);
    }
  }

  // Preserve interactive picker marker if currently picking
  if(state.isPickingLocation && pickMarker && mapInstance){
    pickMarker.addTo(mapInstance);
  }
  if(state.isPickingBizLocation && bizPickMarker && mapInstance){
    bizPickMarker.addTo(mapInstance);
  }
}