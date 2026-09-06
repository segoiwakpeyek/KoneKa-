/* ---------- State ---------- */
const DAYS = ['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu'];
const state = { screen:'splash', authMode:'masuk', tab:'map', subtab:'dashboard', overlay:null, zoomPhoto:false, zoomPhotoUrl:null, formStep:1, reportPicker:false, newReportCategory:null, mapZoom:1, guest:false, authPromptMsg:null, authEmail:'', authPassword:'',
  username:'', kota:'Surabaya', kecamatan:'Gubeng', regKota:'', regKecamatan:'', regUsername:'',
  theme:'light', hasBusiness:false, businessName:'', businessCategory:null, businessCategoryOther:'', businessKota:null, businessKecamatan:null, businessPhoto:null, selectedBiz:null,
  businessDescription:'', businessPhone:'', businessPaymentMethods:['tunai'], bizKomentarDraft:'', bizDetailComments:[], _loadedBizCommentsId:null, _bizCommentsCache:{}, flagBizCategory:null, _pickingReturnScreen:'usaha-daftar',
  stokOn:false, strukOn:false, flagCategory:null, deleteArmed:false, locationCooldownDays:0,
  tempKota:'', tempKecamatan:'', wilayahTarget:'account',
  formPhoto:null, laporPhoto:null, formRencana:'', formKerjakan:'', laporDesc:'',
  intent:null, timeframe:null,
  komentarDraft:'', detailComments:[], _loadedDetailCommentsId:null, _reportCommentsCache:{},
  businessHours: Object.fromEntries(DAYS.map(d=>[d, {open: d!=='Minggu', from:'08:00', to:'21:00'}])),
  holidayActive:false, holidayFrom:'', holidayTo:'', holidayNote:'',
  profilePhoto:null, contributionCount:0,
  products:[], newProductName:'', newProductQty:'',
  invoices:[], newInvoiceClient:'', newInvoiceAmount:'', newInvoiceStatus:'Lunas', invoiceCounter:1,
  _transactions:[], _bizId:null,
  myReports:[], myHelps:[], leaderboardUsers:[],
  newTxDesc:'', newTxAmount:'', newTxType:'income',
  chartPeriod:'harian', stockFilter:'all', stockSearch:'',
  selectedInvoice:null, reportLat:-7.2575, reportLng:112.7521,
  isPickingLocation:false, isPickingBizLocation:false, businessLat:null, businessLng:null, wilayahSearch:'',
  pendingReg:null, verifyTargetCode:'', verifyCode:'', verifyExpiresAt:0, resendCooldownUntil:0, cameraActive:false, cameraTargetKey:null, cameraFacingMode:'environment', isTester:false, isAdmin:false, adminReportedBusinesses:[],
  isLoadingAktivitas:false, isLoadingComments:false, isLoadingBizComments:false, isLoadingUsaha:false };

const ADMIN_EMAILS = [
  'koqw2wq10xnh9wbalao81alqm@gmail.com'
];

function isUserAdmin(userOrEmail){
  if(state && state.isAdmin) return true;
  let email = '';
  if(typeof userOrEmail === 'string') email = userOrEmail;
  else if(userOrEmail && userOrEmail.email) email = userOrEmail.email;
  else if(typeof auth !== 'undefined' && auth.currentUser && auth.currentUser.email) email = auth.currentUser.email;
  else if(state && state.authEmail) email = state.authEmail;
  return ADMIN_EMAILS.includes((email || '').toLowerCase().trim());
}

const CITY_COORDINATES = {
  // Jawa Timur
  'Surabaya': [-7.2575, 112.7521],
  'Malang': [-7.9666, 112.6326],
  'Kabupaten Malang': [-8.1333, 112.5667],
  'Lamongan': [-7.1199, 112.4158],
  'Gresik': [-7.1566, 112.6555],
  'Jember': [-8.1845, 113.6681],
  'Sidoarjo': [-7.4478, 112.7183],
  'Kediri': [-7.8480, 112.0178],
  'Kabupaten Kediri': [-7.7800, 112.1800],
  'Banyuwangi': [-8.2192, 114.3691],
  'Pasuruan': [-7.6453, 112.9075],
  'Kabupaten Pasuruan': [-7.7000, 112.8000],
  'Mojokerto': [-7.4726, 112.4381],
  'Kabupaten Mojokerto': [-7.5500, 112.5000],
  'Madiun': [-7.6298, 111.5239],
  'Kabupaten Madiun': [-7.6298, 111.5239],
  'Tuban': [-6.8976, 112.0649],
  'Probolinggo': [-7.7543, 113.2159],
  'Kabupaten Probolinggo': [-7.8000, 113.3500],
  'Blitar': [-8.0983, 112.1681],
  'Kabupaten Blitar': [-8.1500, 112.2000],
  'Batu': [-7.8712, 112.5271],
  'Bojonegoro': [-7.1500, 111.8819],
  'Ngawi': [-7.4039, 111.4456],
  'Magetan': [-7.6492, 111.3283],
  'Ponorogo': [-7.8683, 111.4622],
  'Pacitan': [-8.1964, 111.1061],
  'Trenggalek': [-8.0500, 111.7167],
  'Tulungagung': [-8.0667, 111.9000],
  'Nganjuk': [-7.6033, 111.9022],
  'Jombang': [-7.5461, 112.2331],
  'Lumajang': [-8.1333, 113.2167],
  'Bondowoso': [-7.9139, 113.8214],
  'Situbondo': [-7.7061, 114.0044],
  'Bangkalan': [-7.0306, 112.7483],
  'Sampang': [-7.1878, 113.2394],
  'Pamekasan': [-7.1603, 113.4739],
  'Sumenep': [-7.0167, 113.8667],

  // DKI Jakarta
  'Jakarta Selatan': [-6.2615, 106.8106],
  'Jakarta Pusat': [-6.1818, 106.8223],
  'Jakarta Barat': [-6.1683, 106.7589],
  'Jakarta Timur': [-6.2250, 106.9004],
  'Jakarta Utara': [-6.1384, 106.8640],
  'Kepulauan Seribu': [-5.6122, 106.5622],

  // Jawa Barat & Banten
  'Bandung': [-6.9175, 107.6191],
  'Kabupaten Bandung': [-7.0252, 107.5198],
  'Bandung Barat': [-6.8436, 107.4912],
  'Cimahi': [-6.8723, 107.5420],
  'Bekasi': [-6.2383, 106.9756],
  'Kabupaten Bekasi': [-6.2433, 107.1511],
  'Bogor': [-6.5971, 106.8060],
  'Kabupaten Bogor': [-6.4819, 106.8322],
  'Depok': [-6.4025, 106.7942],
  'Tangerang': [-6.1783, 106.6319],
  'Tangerang Selatan': [-6.2889, 106.7179],
  'Kabupaten Tangerang': [-6.2088, 106.4673],
  'Serang': [-6.1104, 106.1640],
  'Kabupaten Serang': [-6.1200, 105.9800],
  'Cilegon': [-6.0172, 106.0538],
  'Pandeglang': [-6.3086, 106.1067],
  'Lebak': [-6.5414, 106.2522],
  'Cirebon': [-6.7320, 108.5523],
  'Kabupaten Cirebon': [-6.7644, 108.4800],
  'Sukabumi': [-6.9277, 106.9300],
  'Kabupaten Sukabumi': [-7.0000, 106.7500],
  'Tasikmalaya': [-7.3274, 108.2207],
  'Kabupaten Tasikmalaya': [-7.4000, 108.1500],
  'Garut': [-7.2167, 107.9000],
  'Kabupaten Garut': [-7.2167, 107.9000],
  'Ciamis': [-7.3256, 108.3533],
  'Pangandaran': [-7.7018, 108.4947],
  'Banjar': [-7.3683, 108.5333],
  'Kuningan': [-6.9764, 108.4839],
  'Majalengka': [-6.8361, 108.2275],
  'Sumedang': [-6.8586, 107.9266],
  'Indramayu': [-6.3264, 108.3200],
  'Subang': [-6.5716, 107.7587],
  'Purwakarta': [-6.5569, 107.4433],
  'Karawang': [-6.3073, 107.2974],
  'Cianjur': [-6.8222, 107.1394],

  // Jawa Tengah & DIY
  'Semarang': [-6.9667, 110.4167],
  'Kabupaten Semarang': [-7.1500, 110.4300],
  'Solo / Surakarta': [-7.5755, 110.8243],
  'Salatiga': [-7.3306, 110.5083],
  'Magelang': [-7.4797, 110.2177],
  'Kabupaten Magelang': [-7.5500, 110.2300],
  'Pekalongan': [-6.8886, 109.6753],
  'Kabupaten Pekalongan': [-7.0300, 109.6300],
  'Tegal': [-6.8694, 109.1402],
  'Kabupaten Tegal': [-7.0000, 109.1300],
  'Banyumas': [-7.4243, 109.2304],
  'Purwokerto': [-7.4243, 109.2304],
  'Cilacap': [-7.7028, 109.0150],
  'Purbalingga': [-7.3886, 109.3639],
  'Banjarnegara': [-7.3986, 109.6975],
  'Kebumen': [-7.6686, 109.6528],
  'Purworejo': [-7.7144, 110.0078],
  'Wonosobo': [-7.3633, 109.9000],
  'Boyolali': [-7.5317, 110.5961],
  'Klaten': [-7.7056, 110.6061],
  'Sukoharjo': [-7.6833, 110.8333],
  'Wonogiri': [-7.8139, 110.9256],
  'Karanganyar': [-7.5964, 110.9511],
  'Sragen': [-7.4264, 111.0219],
  'Grobogan': [-7.0272, 110.9169],
  'Blora': [-6.9697, 111.4194],
  'Rembang': [-6.7106, 111.3414],
  'Pati': [-6.7561, 111.0378],
  'Kudus': [-6.8047, 110.8406],
  'Jepara': [-6.5925, 110.6783],
  'Demak': [-6.8944, 110.6389],
  'Temanggung': [-7.3150, 110.1778],
  'Kendal': [-6.9242, 110.2033],
  'Batang': [-6.9086, 109.7317],
  'Pemalang': [-6.8906, 109.3800],
  'Brebes': [-6.8711, 109.0419],
  'Yogyakarta': [-7.7956, 110.3695],
  'Sleman': [-7.7167, 110.3556],
  'Bantul': [-7.8939, 110.3308],
  'Gunungkidul': [-7.9622, 110.6033],
  'Kulon Progo': [-7.8572, 110.1586],

  // Luar Jawa
  'Medan': [3.5952, 98.6722],
  'Deli Serdang': [3.5167, 98.7167],
  'Binjai': [3.6000, 98.4833],
  'Pematangsiantar': [2.9600, 99.0600],
  'Banda Aceh': [5.5483, 95.3238],
  'Padang': [-0.9471, 100.4172],
  'Bukittinggi': [-0.3056, 100.3692],
  'Pekanbaru': [0.5071, 101.4478],
  'Batam': [1.1301, 104.0529],
  'Tanjungpinang': [0.9167, 104.4500],
  'Jambi': [-1.6099, 103.6072],
  'Palembang': [-2.9761, 104.7754],
  'Bengkulu': [-3.7928, 102.2608],
  'Bandar Lampung': [-5.4292, 105.2611],
  'Pangkalpinang': [-2.1333, 106.1167],
  'Denpasar': [-8.6705, 115.2126],
  'Badung': [-8.5819, 115.1771],
  'Gianyar': [-8.5444, 115.3267],
  'Tabanan': [-8.5411, 115.1250],
  'Buleleng': [-8.1122, 115.0883],
  'Mataram': [-8.5833, 116.1167],
  'Lombok Barat': [-8.6833, 116.1167],
  'Kupang': [-10.1772, 123.6070],
  'Pontianak': [-0.0263, 109.3425],
  'Palangka Raya': [-2.2077, 113.9164],
  'Banjarmasin': [-3.3194, 114.5908],
  'Banjarbaru': [-3.4400, 114.8300],
  'Samarinda': [-0.5016, 117.1537],
  'Balikpapan': [-1.2379, 116.8529],
  'Tarakan': [3.3000, 117.6333],
  'Makassar': [-5.1477, 119.4327],
  'Gowa': [-5.2000, 119.4500],
  'Maros': [-5.0000, 119.5667],
  'Manado': [1.4748, 124.8421],
  'Palu': [-0.9000, 119.8333],
  'Kendari': [-3.9722, 122.5833],
  'Gorontalo': [0.5406, 123.0594],
  'Ambon': [-3.6954, 128.1814],
  'Ternate': [0.7833, 127.3667],
  'Jayapura': [-2.5337, 140.7181],
  'Sorong': [-0.8667, 131.2500],
  'Manokwari': [-0.8615, 134.0620],
  'Merauke': [-8.4992, 140.4011]
};

function normalizeCity(str) {
  if (!str) return '';
  return str.replace(/^(Kota|Kabupaten|Kab\.?|D\.?I\.?)\s+/i, '').trim();
}

function getCityCoords(cityName){
  if(!cityName) return [-7.2575, 112.7521];
  const clean = normalizeCity(cityName);
  if(CITY_COORDINATES[clean]) return CITY_COORDINATES[clean];
  if(CITY_COORDINATES[cityName]) return CITY_COORDINATES[cityName];
  const found = Object.keys(CITY_COORDINATES).find(k => {
    const kClean = normalizeCity(k).toLowerCase();
    const cLower = clean.toLowerCase();
    return kClean === cLower || kClean.includes(cLower) || cLower.includes(kClean);
  });
  if(found) return CITY_COORDINATES[found];
  return [-7.2575, 112.7521];
}

const KOTA_KECAMATAN = {
  // --- JAWA TIMUR ---
  'Surabaya': ['Gubeng','Wonokromo','Tegalsari','Rungkut','Sukolilo','Genteng','Sawahan','Tambaksari','Kenjeran','Wiyung','Mulyorejo','Sukomanunggal','Sambikerep','Benowo','Pakal'],
  'Malang': ['Klojen','Lowokwaru','Blimbing','Sukun','Kedungkandang'],
  'Kabupaten Malang': ['Kepanjen','Singosari','Lawang','Dau','Wagir','Pakis','Tumpang','Pujon','Ngantang','Kasembon','Bululawang','Gondanglegi','Turen','Dampit','Sumbermanjing'],
  'Lamongan': ['Lamongan','Babat','Brondong','Paciran','Sukodadi','Tikung','Karanggeneng','Deket','Pucuk','Mantup','Sekaran','Maduran','Turi','Laren','Solokuro','Kedungpring'],
  'Gresik': ['Gresik','Kebomas','Manyar','Driyorejo','Menganti','Cerme','Bungah','Sidayu','Dukun','Panceng','Benjeng','Wringinanom','Kedamean','Ujungpangkah','Sangkapura'],
  'Sidoarjo': ['Sidoarjo','Waru','Gedangan','Candi','Taman','Krian','Porong','Buduran','Sukodono','Sedati','Tulangan','Tanggulangin','Prambon','Balongbendo','Wonoayu'],
  'Jember': ['Kaliwates','Sumbersari','Patrang','Tanggul','Ambulu','Puger','Balung','Wuluhan','Kencong','Rambipuji','Arjasa','Ajung','Semboro','Gumukmas','Bangsalsari'],
  'Kediri': ['Kota','Mojoroto','Pesantren'],
  'Kabupaten Kediri': ['Pare','Gampengrejo','Ngadiluwih','Kandangan','Gurah','Wates','Kras','Mojo','Semen','Papar','Plemahan','Badas'],
  'Banyuwangi': ['Banyuwangi','Giri','Glagah','Rogojampi','Kalipuro','Genteng','Songgon','Muncar','Kabat','Srono','Cluring','Gambiran','Pesanggaran','Wongsorejo'],
  'Pasuruan': ['Purworejo','Bugul Kidul','Gadingrejo','Panggungrejo'],
  'Kabupaten Pasuruan': ['Pandaan','Gempol','Bangil','Prigen','Purwosari','Sukorejo','Grati','Nguling','Rembang','Kraton','Pohjentrek','Lumbang','Tosari'],
  'Mojokerto': ['Magersari','Prajurit Kulon','Kranggan'],
  'Kabupaten Mojokerto': ['Mojosari','Ngoro','Trowulan','Pacet','Trawas','Puri','Sooko','Bangsal','Dlanggu','Gondang','Jatirejo','Kemlagi','Jetis','Dawarblandong'],
  'Madiun': ['Kartoharjo','Manguharjo','Taman','Jiwan','Balerejo','Mejayan','Caruban','Geger','Dolopo','Dagangan','Wungu','Kebonsari','Pilangkenceng','Saradan','Wonoasri','Sawahan','Kare','Gemarang'],
  'Kabupaten Madiun': ['Jiwan','Balerejo','Mejayan','Caruban','Geger','Dolopo','Dagangan','Wungu','Kebonsari','Pilangkenceng','Saradan','Wonoasri','Sawahan','Kare','Gemarang'],
  'Batu': ['Batu','Bumiaji','Junrejo'],
  'Blitar': ['Kepanjenkidul','Sukorejo','Sananwetan'],
  'Kabupaten Blitar': ['Wlingi','Garum','Kanigoro','Sutojayan','Nglegok','Talun','Srengat','Udanawu','Ponggok','Kademangan','Kesamben'],
  'Probolinggo': ['Kanigaran','Mayangan','Kademangan','Wonoasih','Kedopok'],
  'Kabupaten Probolinggo': ['Kraksaan','Pajarakan','Dringu','Gending','Tongas','Sukapura','Leces','Bait','Besuk','Kotaanyar','Pakuniran'],
  'Tuban': ['Tuban','Semanding','Palang','Jenu','Merakurak','Rengel','Soko','Widang','Plumpang','Kerek','Tambakboyo','Bancar','Singgahan'],
  'Bojonegoro': ['Bojonegoro','Kapas','Dander','Kalitidu','Padangan','Baureno','Sumberejo','Kanor','Malo','Purwosari','Tambakrejo','Ngraho'],
  'Ngawi': ['Ngawi','Paron','Geneng','Pitu','Kedunggalar','Walikukun','Widodaren','Mantingan','Sine','Ngrambe','Jogorogo','Kendal'],
  'Magetan': ['Magetan','Plosoklaten','Kawedanan','Maospati','Bendo','Sukomoro','Panekan','Plaosan','Karangrejo','Barat','Karas'],
  'Ponorogo': ['Ponorogo','Babadan','Siman','Kauman','Sukorejo','Jenangan','Mlarak','Jetis','Sambit','Balong','Pulung','Ngebel'],
  'Pacitan': ['Pacitan','Kebonagung','Arjosari','Tulakan','Ngadirojo','Sudimoro','Pringkuku','Punung','Donorojo','Nawangan','Bandar'],
  'Trenggalek': ['Trenggalek','Pogalan','Durenan','Gandusari','Kampak','Watulimo','Panggul','Munjungan','Dongko','Pule','Karangan','Suruh'],
  'Tulungagung': ['Tulungagung','Kedungwaru','Boyolangu','Kauman','Gondang','Ngunut','Sumbergempol','Rejotangan','Kalidawir','Besuki','Campurdarat'],
  'Nganjuk': ['Nganjuk','Bagor','Sukomoro','Loceret','Berbek','Kertosono','Baron','Tanjunganom','Prambon','Gondang','Rejoso','Lengkong'],
  'Jombang': ['Jombang','Peterongan','Diwek','Ploso','Mojoagung','Sumobito','Kesamben','Tembelang','Perak','Bandarkedungmulyo','Bareng','Wonosalam'],
  'Lumajang': ['Lumajang','Sukodono','Senduro','Pasrujambe','Klakah','Randuagung','Tempeh','Pasirian','Yosowilangun','Kunir','Pronojiwo'],
  'Bondowoso': ['Bondowoso','Tamanan','Prajekan','Wringin','Tapen','Sukosari','Maesan','Grujugan','Tenggarang','Wonoboyo','Klampokan'],
  'Situbondo': ['Situbondo','Panji','Kapongan','Arjasa','Asembagus','Banyuputih','Besuki','Suboh','Mlandingan','Panarukan','Kendit'],
  'Bangkalan': ['Bangkalan','Socah','Burneh','Kamal','Arosbaya','Klampis','Sepulu','Tanjungbumi','Blega','Modung','Kwanyar','Labang'],
  'Sampang': ['Sampang','Torjun','Jrengik','Tambelangan','Banyuates','Robatal','Kedungdung','Ketapang','Sreseh','Camplong','Omben'],
  'Pamekasan': ['Pamekasan','Tlanakan','Pademawu','Galis','Larangan','Pakong','Waru','Batu Marmar','Pasean','Pegantenan','Palengaan'],
  'Sumenep': ['Kota Sumenep','Kalianget','Manding','Batuan','Gapura','Batang Batang','Dungkek','Ambunten','Pasongsongan','Guluk Guluk','Pragaan'],

  // --- JAWA BARAT ---
  'Bandung': ['Sukajadi','Coblong','Cidadap','Sukasari','Andir','Cicendo','Sumur Bandung','Lengkong','Buahbatu','Kiaracondong','Batununggal','Bojongloa Kaler','Regol','Antapani','Arcamanik','Ujungberung','Cibiru','Bandung Wetan'],
  'Kabupaten Bandung': ['Soreang','Banjaran','Baleendah','Dayeuhkolot','Bojongsoang','Katapang','Margahayu','Margaasih','Cileunyi','Rancaekek','Cicalengka','Majalaya','Ciparay','Pangalengan','Ciwidey','Pasirjambu'],
  'Bandung Barat': ['Ngamprah','Padalarang','Batujajar','Lembang','Parongpong','Cisarua','Cikalongwetan','Cililin','Cipatat','Gununghalu'],
  'Cimahi': ['Cimahi Selatan','Cimahi Tengah','Cimahi Utara'],
  'Bekasi': ['Bekasi Timur','Bekasi Barat','Bekasi Selatan','Bekasi Utara','Rawa Lumbu','Pondok Gede','Jatiasih','Medan Satria','Bantar Gebang','Mustika Jaya','Jatisampurna','Pondok Melati'],
  'Kabupaten Bekasi': ['Cikarang Pusat','Cikarang Barat','Cikarang Timur','Cikarang Utara','Cikarang Selatan','Tambun Selatan','Tambun Utara','Cibitung','Setu','Serang Baru','Tarumajaya','Babelan'],
  'Bogor': ['Bogor Tengah','Bogor Selatan','Bogor Timur','Bogor Utara','Bogor Barat','Tanah Sareal'],
  'Kabupaten Bogor': ['Cibinong','Citeureup','Babakan Madang','Sukaraja','Bojonggede','Cileungsi','Gunung Putri','Jonggol','Cisarua','Megamendung','Ciawi','Parung','Kemang','Rumpin'],
  'Depok': ['Pancoran Mas','Sukmajaya','Cimanggis','Beji','Sawangan','Cinere','Limo','Tapos','Bojongsari','Cilodong','Cipayung'],
  'Cirebon': ['Kejaksan','Kesambi','Lemahwungkuk','Harjamukti','Pekalipan'],
  'Kabupaten Cirebon': ['Sumber','Kedawung','Weru','Plumbon','Palimanan','Arjawinangun','Klangenan','Astanajapura','Ciledug','Losari','Lemahabang'],
  'Sukabumi': ['Cikole','Citamiang','Warudoyong','Baros','Lembursitu','Gunungpuyuh','Cibeureum'],
  'Kabupaten Sukabumi': ['Palabuhanratu','Cibadak','Cisaat','Cicurug','Parungkuda','Nagrak','Cikembar','Jampang Kulon','Surade','Sagaranten'],
  'Tasikmalaya': ['Cihideung','Cipedes','Tawang','Indihiang','Kawalu','Mangkubumi','Tamansari','Purbaratu','Bungursari'],
  'Kabupaten Tasikmalaya': ['Singaparna','Mangunreja','Taraju','Ciawi','Rajapolah','Manonjaya','Karangnunggal','Cipatujah'],
  'Ciamis': ['Ciamis','Baregbeg','Kawali','Panjalu','Rancah','Banjarsari','Cikoneng','Sindangkasih'],
  'Pangandaran': ['Pangandaran','Parigi','Cijulang','Cimerak','Kalipucang','Padaherang','Sidamulih'],
  'Banjar': ['Banjar','Purwaharja','Pataruman','Langensari'],
  'Garut': ['Garut Kota','Tarogong Kidul','Tarogong Kaler','Karangpawitan','Wanaraja','Samarang','Cisurupan','Cikajang','Cilawu','Leles','Kadungora','Limbangan','Malangbong','Pameungpeuk'],
  'Kabupaten Garut': ['Garut Kota','Tarogong Kidul','Tarogong Kaler','Karangpawitan','Wanaraja','Samarang','Cisurupan','Cikajang','Cilawu','Leles','Kadungora','Limbangan','Malangbong','Pameungpeuk'],
  'Kuningan': ['Kuningan','Cigugur','Kramatmulya','Jalaksana','Cilimus','Ciawigebang','Luragung','Kadugede','Ciniru'],
  'Majalengka': ['Majalengka','Cigasong','Kadipaten','Jatiwangi','Dawuan','Kertajati','Sumberjaya','Talaga','Cikijing','Bantarujeg'],
  'Sumedang': ['Sumedang Utara','Sumedang Selatan','Jatinangor','Cimanggung','Tanjungsari','Rancakalong','Conggeang','Tomo','Ujungjaya'],
  'Indramayu': ['Indramayu','Sindang','Jatibarang','Haurgeulis','Kandanghaur','Losarang','Juntinyuat','Karangampel','Krangkeng','Anjatan'],
  'Subang': ['Subang','Kalijati','Pabuaran','Purwadadi','Pagaden','Ciasem','Pamanukan','Pusakajaya','Jalan Cagak','Ciater'],
  'Purwakarta': ['Purwakarta','Campaka','Cibatu','Bungursari','Babakancikao','Jatiluhur','Plered','Sukasari','Wanayasa','Darangdan'],
  'Karawang': ['Karawang Barat','Karawang Timur','Telukjambe Timur','Telukjambe Barat','Klari','Rengasdengklok','Cikampek','Kotabaru','Jatisari','Batujaya'],
  'Cianjur': ['Cianjur','Karangtengah','Ciranjang','Cipanas','Pacet','Cugenang','Warungkondang','Cibeber','Sukanagara','Sindangbarang'],

  // --- DKI JAKARTA ---
  'Jakarta Pusat': ['Menteng','Gambir','Tanah Abang','Senen','Kemayoran','Sawah Besar','Cempaka Putih','Johar Baru'],
  'Jakarta Selatan': ['Kebayoran Baru','Cilandak','Setiabudi','Tebet','Pasar Minggu','Mampang Prapatan','Pancoran','Pesanggrahan','Jagakarsa','Kebayoran Lama'],
  'Jakarta Barat': ['Grogol Petamburan','Kebon Jeruk','Kembangan','Palmerah','Cengkareng','Kalideres','Tambora','Taman Sari'],
  'Jakarta Timur': ['Jatinegara','Duren Sawit','Matraman','Kramat Jati','Cakung','Pulo Gadung','Ciracas','Pasar Rebo','Makasar','Cipayung'],
  'Jakarta Utara': ['Kelapa Gading','Tanjung Priok','Pademangan','Penjaringan','Koja','Cilincing'],
  'Kepulauan Seribu': ['Kepulauan Seribu Utara','Kepulauan Seribu Selatan'],

  // --- BANTEN ---
  'Tangerang': ['Tangerang','Cipondoh','Ciledug','Karawaci','Batuceper','Benda','Cibodas','Pinang','Neglasari','Periuk','Jatiuwung','Karang Tengah','Larangan'],
  'Tangerang Selatan': ['Serpong','Serpong Utara','Pondok Aren','Ciputat','Ciputat Timur','Pamulang','Setu'],
  'Kabupaten Tangerang': ['Tigaraksa','Balaraja','Cikupa','Curug','Kelapa Dua','Legok','Pasar Kemis','Sepatan','Teluknaga','Kosambi','Kresek','Kronjo'],
  'Serang': ['Serang','Cipocok Jaya','Curug','Kasemen','Taktakan','Walantaka'],
  'Kabupaten Serang': ['Ciruas','Kragilan','Kramatwatu','Anyar','Cinangka','Baros','Cikande','Kibin','Pontang','Tirtayasa'],
  'Cilegon': ['Cibeber','Cilegon','Citangkil','Ciwandan','Gerogol','Jombang','Pulomerak','Purwakarta'],
  'Pandeglang': ['Pandeglang','Cadasari','Menes','Labuan','Panimbang','Saketi','Munjul','Cibaliung'],
  'Lebak': ['Rangkasbitung','Kalanganyar','Cibadak','Warunggunung','Malingping','Bayah','Cipanas','Muncang'],

  // --- JAWA TENGAH ---
  'Semarang': ['Semarang Tengah','Semarang Barat','Semarang Selatan','Semarang Timur','Semarang Utara','Gajahmungkur','Banyumanik','Tembalang','Candisari','Pedurungan','Ngaliyan','Mijen','Genuk','Tugu','Gunungpati'],
  'Kabupaten Semarang': ['Ungaran Barat','Ungaran Timur','Ambarawa','Bawen','Bandungan','Banyubiru','Tuntang','Beragas','Pringapus'],
  'Solo / Surakarta': ['Banjarsari','Jebres','Laweyan','Pasar Kliwon','Serengan'],
  'Salatiga': ['Sidorejo','Tingkir','Argomulyo','Sidomukti'],
  'Magelang': ['Magelang Selatan','Magelang Tengah','Magelang Utara'],
  'Kabupaten Magelang': ['Mertoyudan','Mungkid','Borobudur','Muntilan','Secang','Salam','Salaman','Tegalrejo','Grabag'],
  'Pekalongan': ['Pekalongan Barat','Pekalongan Timur','Pekalongan Selatan','Pekalongan Utara'],
  'Kabupaten Pekalongan': ['Kajen','Kedungwuni','Wiradesa','Wonopringgo','Doro','Sragi','Bojong','Buaran'],
  'Tegal': ['Tegal Barat','Tegal Timur','Tegal Selatan','Margadana'],
  'Kabupaten Tegal': ['Slawi','Adiwerna','Dukuhturi','Talang','Tarub','Kramat','Suradadi','Warureja','Balapulang','Lebaksiu','Bumijawa'],
  'Banyumas': ['Purwokerto Timur','Purwokerto Barat','Purwokerto Utara','Purwokerto Selatan','Sokaraja','Ajibarang','Wangon','Banyumas','Baturraden','Cilongok','Kembaran','Sumbang'],
  'Purwokerto': ['Purwokerto Timur','Purwokerto Barat','Purwokerto Utara','Purwokerto Selatan','Sokaraja','Baturraden'],
  'Cilacap': ['Cilacap Selatan','Cilacap Tengah','Cilacap Utara','Kesugihan','Kroya','Adipala','Majenang','Sidareja','Jeruklegi','Maos'],
  'Purbalingga': ['Purbalingga','Kalimanah','Bobotsari','Kutasari','Bukateja','Kemangkon','Padamara','Rembang'],
  'Banjarnegara': ['Banjarnegara','Bawang','Madukara','Purwanegara','Klampok','Mandiraja','Wanadadi','Karangkobar','Batur'],
  'Kebumen': ['Kebumen','Gombong','Karanganyar','Kutowinangun','Prembun','Petanahan','Klirong','Ayah','Sruweng'],
  'Purworejo': ['Purworejo','Kutoarjo','Banyuurip','Gebang','Bayur','Loano','Pituruh','Kemiri'],
  'Wonosobo': ['Wonosobo','Garung','Mojotengah','Kertek','Selomerto','Kalikajar','Kepil','Wadaslintang'],
  'Boyolali': ['Boyolali','Mojosongo','Teras','Banyudono','Sawit','Ngemplak','Ampel','Sambi','Simo'],
  'Klaten': ['Klaten Tengah','Klaten Utara','Klaten Selatan','Delanggu','Ceper','Pedan','Trucuk','Jogonalan','Prambanan'],
  'Sukoharjo': ['Sukoharjo','Kartasura','Grogol','Baki','Mojolaban','Polokarto','Tawangsari','Nguter'],
  'Wonogiri': ['Wonogiri','Selogiri','Ngadirojo','Baturetno','Pracimantoro','Purwantoro','Jatisrono','Eromoko'],
  'Karanganyar': ['Karanganyar','Colomadu','Gondangrejo','Jaten','Kebakkramat','Tasikmadu','Matesih','Tawangmangu'],
  'Sragen': ['Sragen','Karangmalang','Sidoharjo','Masaran','Gemolong','Gondang','Sambungmacan','Kalijambe'],
  'Grobogan': ['Purwodadi','Toroh','Geyer','Wirosari','Kradenan','Tawangharjo','Godong','Gubug','Tegowanu'],
  'Blora': ['Blora','Cepu','Jepon','Ngawen','Kunduran','Randublatung','Kedungtuban','Kradenan'],
  'Rembang': ['Rembang','Lasem','Kragan','Sarang','Pancur','Pamotan','Sulang','Sluke'],
  'Pati': ['Pati','Juwana','Tayu','Wedarijaksa','Margorejo','Kayen','Sukolilo','Batangan','Trangkil'],
  'Kudus': ['Kota Kudus','Jati','Bae','Gebog','Kaliwungu','Mejobo','Dawe','Undaan','Jekulo'],
  'Jepara': ['Jepara','Tahunan','Kedung','Pecangaan','Batealit','Kalinyamatan','Bangsri','Keling','Karimunjawa'],
  'Demak': ['Demak','Sayung','Mranggen','Karangawen','Bonang','Wedung','Mijen','Guntur','Karangtengah'],
  'Temanggung': ['Temanggung','Parakan','Ngadirejo','Kandangan','Bulu','Kranggan','Pringsurat','Kaloran'],
  'Kendal': ['Kendal','Kaliwungu','Boja','Weleri','Cepiring','Pegandon','Sukorejo','Gemuh','Patebon'],
  'Batang': ['Batang','Warungasem','Kandeman','Subah','Limpung','Banyuputih','Gringsing','Bandar','Bawang'],
  'Pemalang': ['Pemalang','Taman','Petarukan','Comal','Ulujami','Bantarbolang','Randudongkal','Moga','Belik'],
  'Brebes': ['Brebes','Wanasari','Jatibarang','Larangan','Ketanggungan','Tanjung','Losari','Bulakamba','Bumiayu','Paguyangan'],

  // --- D.I. YOGYAKARTA ---
  'Yogyakarta': ['Danurejan','Gedongtengen','Gondomanan','Kotagede','Mergangsan','Umbulharjo','Wirobrajan','Kraton','Mantrijeron','Pakualaman','Ngampilan','Tegalrejo','Jetis','Gondokusuman'],
  'Sleman': ['Depok','Mlati','Gamping','Ngaglik','Kalasan','Berbah','Prambanan','Tempel','Pakem','Cangkringan','Seyegan','Godean','Minggir'],
  'Bantul': ['Bantul','Sewon','Banguntapan','Kasihan','Piyungan','Pleret','Imogiri','Kretek','Sanden','Pandak','Sedayu'],
  'Gunungkidul': ['Wonosari','Playen','Patuk','Karangmojo','Semanu','Rongkop','Tepus','Panggang','Paliyan','Ngawen'],
  'Kulon Progo': ['Wates','Pengasih','Sentolo','Lendah','Galur','Panjatan','Temon','Temon Kulon','Kokap','Girimulyo','Nanggulan','Kalibawang'],

  // --- SUMATERA ---
  'Medan': ['Medan Baru','Medan Kota','Medan Petisah','Medan Barat','Medan Selayang','Medan Sunggal','Medan Helvetia','Medan Tuntungan','Medan Denai','Medan Amplas','Medan Johor','Medan Marelan','Medan Belawan'],
  'Deli Serdang': ['Lubuk Pakam','Percut Sei Tuan','Sunggal','Deli Tua','Tanjung Morawa','Pancur Batu','Hamparan Perak','Batang Kuis'],
  'Binjai': ['Binjai Kota','Binjai Barat','Binjai Selatan','Binjai Timur','Binjai Utara'],
  'Pematangsiantar': ['Siantar Barat','Siantar Timur','Siantar Selatan','Siantar Utara','Siantar Marihat','Siantar Sitalasari'],
  'Banda Aceh': ['Baiturrahman','Kuta Alam','Syiah Kuala','Meuraxa','Ulee Kareng','Lueng Bata','Banda Raya','Jaya Baru'],
  'Padang': ['Padang Barat','Padang Timur','Padang Utara','Padang Selatan','Koto Tangah','Kuranji','Lubuk Begalung','Pauh','Nanggalo'],
  'Bukittinggi': ['Guguk Panjang','Mandiangin Koto Selayan','Aur Birugo Tigo Baleh'],
  'Pekanbaru': ['Pekanbaru Kota','Sukajadi','Tampan','Marpoyan Damai','Bukit Raya','Rumbai','Senapelan','Lima Puluh','Sail','Payung Sekaki'],
  'Batam': ['Batam Kota','Lubuk Baja','Sekupang','Nongsa','Batu Ampar','Bengkong','Sagulung','Batu Aji','Sei Beduk'],
  'Tanjungpinang': ['Tanjungpinang Kota','Tanjungpinang Barat','Tanjungpinang Timur','Bukit Bestari'],
  'Jambi': ['Telanaipura','Pasar Jambi','Jambi Timur','Jambi Selatan','Kotabaru','Danau Teluk','Pelayangan','Jelutung','Alam Barajo'],
  'Palembang': ['Ilir Barat I','Ilir Barat II','Ilir Timur I','Ilir Timur II','Seberang Ulu I','Seberang Ulu II','Sukarami','Kemuning','Sako','Kalidoni','Alang Alang Lebar'],
  'Bengkulu': ['Gading Cempaka','Ratu Agung','Ratu Samban','Teluk Segara','Muara Bangka Hulu','Selebar','Singaran Pati'],
  'Bandar Lampung': ['Tanjung Karang Pusat','Tanjung Karang Timur','Tanjung Karang Barat','Teluk Betung Selatan','Teluk Betung Utara','Kedaton','Way Halim','Rajabasa','Sukarame','Kemiling'],
  'Pangkalpinang': ['Bukit Intan','Gabek','Gerunggang','Girimaya','Pangkal Balam','Ramin','Taman Sari'],

  // --- BALI & NUSA TENGGARA ---
  'Denpasar': ['Denpasar Selatan','Denpasar Barat','Denpasar Timur','Denpasar Utara'],
  'Badung': ['Kuta','Kuta Selatan','Kuta Utara','Mengwi','Abiansemal','Petang'],
  'Gianyar': ['Gianyar','Ubud','Sukawati','Blahbatuh','Tampaksiring','Tegallalang','Payangan'],
  'Tabanan': ['Tabanan','Kediri','Marga','Kerambitan','Penebel','Baturiti','Selemadeg'],
  'Buleleng': ['Singaraja','Buleleng','Seririt','Sukasada','Banjar','Sawan','Kubutambahan','Tejakula','Gerokgak'],
  'Mataram': ['Mataram','Ampenan','Cakranegara','Sekarbela','Selaparang','Sandubaya'],
  'Lombok Barat': ['Gerung','Kediri','Narmada','Lingsar','Gunungsari','Batu Layar','Lembar','Sekotong'],
  'Kupang': ['Alak','Kelapa Lima','Kota Raja','Kota Lama','Maulafa','Oebobo'],

  // --- KALIMANTAN ---
  'Pontianak': ['Pontianak Kota','Pontianak Selatan','Pontianak Barat','Pontianak Timur','Pontianak Utara','Pontianak Tenggara'],
  'Palangka Raya': ['Pahandut','Jekan Raya','Bukit Batu','Sabangau','Rakumpit'],
  'Banjarmasin': ['Banjarmasin Tengah','Banjarmasin Selatan','Banjarmasin Utara','Banjarmasin Barat','Banjarmasin Timur'],
  'Banjarbaru': ['Banjarbaru Selatan','Banjarbaru Utara','Cempaka','Landasan Ulin','Liang Anggang'],
  'Samarinda': ['Samarinda Kota','Samarinda Ulu','Samarinda Ilir','Samarinda Seberang','Sungai Kunjang','Sambutan','Palaran','Sungai Pinang'],
  'Balikpapan': ['Balikpapan Kota','Balikpapan Selatan','Balikpapan Tengah','Balikpapan Utara','Balikpapan Barat','Balikpapan Timur'],
  'Tarakan': ['Tarakan Barat','Tarakan Tengah','Tarakan Timur','Tarakan Utara'],

  // --- SULAWESI ---
  'Makassar': ['Ujung Pandang','Panakkukang','Rappocini','Tamalate','Mariso','Bontoala','Mamajang','Manggala','Biringkanaya','Tamalanrea','Tallo','Wajo','Ujung Tanah'],
  'Gowa': ['Somba Opu','Bontomarannu','Pallangga','Bajeng','Barombong','Tompobulu','Tinggimoncong'],
  'Maros': ['Turikale','Maros Baru','Mandai','Moncongloe','Bantimurung','Tanralili','Lau'],
  'Manado': ['Wenang','Malalayang','Sario','Tikala','Mapanget','Singkil','Tuminting','Bunaken','Wanea','Paal Dua'],
  'Palu': ['Palu Barat','Palu Timur','Palu Selatan','Palu Utara','Mantikulore','Tatanga','Ulujadi'],
  'Kendari': ['Kadia','Kambu','Baruga','Poasia','Mandonga','Puuwatu','Kendari','Kendari Barat','Wua Wua'],
  'Gorontalo': ['Kota Selatan','Kota Utara','Kota Barat','Kota Timur','Dungingi','Kota Tengah','Sipatana','Hulonthalangi'],

  // --- MALUKU & PAPUA ---
  'Ambon': ['Sirimau','Nusaniwe','Teluk Ambon','Baguala','Leitimur Selatan'],
  'Ternate': ['Ternate Tengah','Ternate Selatan','Ternate Utara','Pulau Ternate'],
  'Jayapura': ['Jayapura Utara','Jayapura Selatan','Abepura','Heram','Muara Tami'],
  'Sorong': ['Sorong','Sorong Barat','Sorong Timur','Sorong Utara','Sorong Kepulauan','Sorong Manoi'],
  'Manokwari': ['Manokwari Barat','Manokwari Timur','Manokwari Selatan','Manokwari Utara'],
  'Merauke': ['Merauke','Naukenjerai','Semangga','Tanah Miring','Kurik','Malind']
};

const BUSINESS_CATEGORIES = [
  {id:'kuliner', label:'Kuliner'},
  {id:'fashion', label:'Fashion & Kecantikan'},
  {id:'laundry', label:'Laundry'},
  {id:'service', label:'Jasa & Service'},
  {id:'lainnya', label:'Lainnya'},
];

function validateCityAndKecamatan(cityInput, kecInput){
  if(!cityInput || !cityInput.trim()){
    return { valid: false, error: 'Silakan isi nama kota terlebih dahulu.' };
  }
  const cleanCity = normalizeCity(cityInput.trim()).toLowerCase();
  const allCities = Object.keys(KOTA_KECAMATAN);
  
  // Find match in KOTA_KECAMATAN
  let matchedCity = allCities.find(c => normalizeCity(c).toLowerCase() === cleanCity);
  if(!matchedCity){
    matchedCity = allCities.find(c => {
      const dbNorm = normalizeCity(c).toLowerCase();
      return dbNorm.includes(cleanCity) || cleanCity.includes(dbNorm);
    });
  }
  
  if(!matchedCity){
    return {
      valid: false,
      error: `Kota/Kabupaten "${cityInput.trim()}" tidak dikenali. Masukkan nama kota/kabupaten resmi di Indonesia.`
    };
  }

  const rawKec = (kecInput || '').trim();
  if(!rawKec){
    return { valid: false, error: `Silakan isi nama kecamatan untuk ${matchedCity}.` };
  }

  // Strict check for nonsense / gibberish:
  if(rawKec.length < 3){
    return { valid: false, error: 'Nama kecamatan minimal 3 karakter.' };
  }
  if(/[0-9@#$%^&*()_+=\[\]{}|\\;:"<>?,/]/.test(rawKec)){
    return { valid: false, error: 'Nama kecamatan tidak boleh mengandung angka atau simbol.' };
  }
  if(/([a-zA-Z])\1{3,}/.test(rawKec)){
    return { valid: false, error: 'Nama kecamatan tidak valid (karakter berulang).' };
  }
  if(!/[aeiouyAEIOUY]/.test(rawKec)){
    return { valid: false, error: 'Nama kecamatan tidak valid (bukan kata yang wajar).' };
  }
  const spamWords = ['test','testing','ngawur','asal','asdf','asdfgh','qwerty','blabla','random','xxx','admin','halo','coba','tes'];
  if(spamWords.includes(rawKec.toLowerCase())){
    return { valid: false, error: 'Nama kecamatan tidak boleh diisi teks acak atau coba-coba.' };
  }

  // Check against city's preloaded kecamatan list if available
  const validKecs = KOTA_KECAMATAN[matchedCity] || [];
  const foundKec = validKecs.find(k => k.toLowerCase() === rawKec.toLowerCase());
  if(foundKec){
    return { valid: true, city: matchedCity, kecamatan: foundKec };
  }

  // If not in preloaded list, but passes language validation:
  const formattedKec = rawKec.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  return { valid: true, city: matchedCity, kecamatan: formattedKec };
}

function escapeHtml(str){
  if(!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function getGhostCompletion(typed, list){
  if(!typed || !typed.trim()) return null;
  const clean = typed.trim().toLowerCase();
  const match = (list || []).find(item => item.toLowerCase().startsWith(clean));
  if(match){
    return {
      full: match,
      suffix: match.slice(typed.length)
    };
  }
  return null;
}

function ghostInputHTML(id, kind, placeholder, value, label){
  const val = value || '';
  return `
    <label class="field-label" style="display:flex;justify-content:space-between;align-items:center">
      <span>${label}</span>
      <span id="${id}Hint" class="ghost-enter-hint">↵ Tekan Enter untuk memilih</span>
    </label>
    <div class="ghost-input-container">
      <div id="${id}Ghost" class="ghost-text-overlay"></div>
      <input type="text" id="${id}" class="field-input ghost-input-field" placeholder="${placeholder}" value="${escapeHtml(val)}" autocomplete="off" autocorrect="off" spellcheck="false" oninput="handleGhostInput('${kind}', this, event)" onkeydown="handleGhostKeydown('${kind}', this, event)">
    </div>
  `;
}

function handleGhostInput(kind, inputEl, e){
  const typed = inputEl.value;
  const ghostEl = document.getElementById(inputEl.id + 'Ghost');
  const hintEl = document.getElementById(inputEl.id + 'Hint');
  
  let candidates = [];
  if(kind === 'regKota' || kind === 'wilKota'){
    candidates = Object.keys(KOTA_KECAMATAN);
  } else if(kind === 'regKecamatan'){
    candidates = KOTA_KECAMATAN[state.regKota] || Object.values(KOTA_KECAMATAN).flat();
  } else if(kind === 'wilKecamatan'){
    candidates = KOTA_KECAMATAN[state.tempKota] || Object.values(KOTA_KECAMATAN).flat();
  }

  const completion = getGhostCompletion(typed, candidates);

  if(completion && completion.suffix){
    if(ghostEl){
      ghostEl.innerHTML = `<span class="typed-space">${escapeHtml(typed)}</span><span class="suggest-gray">${escapeHtml(completion.suffix)}</span>`;
    }
    if(hintEl) hintEl.style.display = 'inline-block';
    inputEl.dataset.suggest = completion.full;
  } else {
    if(ghostEl) ghostEl.innerHTML = '';
    if(hintEl) hintEl.style.display = 'none';
    delete inputEl.dataset.suggest;
  }

  // Update underlying state
  if(kind === 'regKota') {
    state.regKota = completion && completion.full.toLowerCase() === typed.toLowerCase().trim() ? completion.full : typed;
  } else if(kind === 'regKecamatan') {
    state.regKecamatan = completion && completion.full.toLowerCase() === typed.toLowerCase().trim() ? completion.full : typed;
  } else if(kind === 'wilKota') {
    state.tempKota = completion && completion.full.toLowerCase() === typed.toLowerCase().trim() ? completion.full : typed;
    const badge = document.getElementById('wilayahActiveSelectedLabel');
    if(badge) badge.innerText = `Kec. ${state.tempKecamatan || '...'}, ${state.tempKota || '...'}`;
  } else if(kind === 'wilKecamatan') {
    state.tempKecamatan = completion && completion.full.toLowerCase() === typed.toLowerCase().trim() ? completion.full : typed;
    const badge = document.getElementById('wilayahActiveSelectedLabel');
    if(badge) badge.innerText = `Kec. ${state.tempKecamatan || '...'}, ${state.tempKota || '...'}`;
  }
}

function handleGhostKeydown(kind, inputEl, e){
  if(e.key === 'Enter' || e.key === 'Tab' || e.key === 'ArrowRight'){
    const suggest = inputEl.dataset.suggest;
    if(suggest){
      e.preventDefault();
      inputEl.value = suggest;
      const ghostEl = document.getElementById(inputEl.id + 'Ghost');
      const hintEl = document.getElementById(inputEl.id + 'Hint');
      if(ghostEl) ghostEl.innerHTML = '';
      if(hintEl) hintEl.style.display = 'none';
      delete inputEl.dataset.suggest;

      if(kind === 'regKota'){
        state.regKota = suggest;
        const next = document.getElementById('regKecamatanInput');
        if(next) { next.focus(); }
      } else if(kind === 'regKecamatan'){
        state.regKecamatan = suggest;
      } else if(kind === 'wilKota'){
        state.tempKota = suggest;
        const next = document.getElementById('wilKecamatanInput');
        if(next) { next.focus(); }
        const badge = document.getElementById('wilayahActiveSelectedLabel');
        if(badge) badge.innerText = `Kec. ${state.tempKecamatan || '...'}, ${state.tempKota}`;
      } else if(kind === 'wilKecamatan'){
        state.tempKecamatan = suggest;
        const badge = document.getElementById('wilayahActiveSelectedLabel');
        if(badge) badge.innerText = `Kec. ${state.tempKecamatan}, ${state.tempKota}`;
      }
    }
  }
}
const FLAG_REASONS = ['Spam','Konten tidak pantas','Palsu / Hoax','Lainnya'];
const BIZ_FLAG_REASONS = [
  'Usaha fiktif / tidak ada di lokasi fisik',
  'Penipuan atau aktivitas mencurigakan',
  'Informasi alamat atau kontak salah',
  'Usaha sudah tutup permanen',
  'Konten atau foto tidak pantas'
];
const PAYMENT_METHODS_LIST = [
  { id: 'tunai', name: 'Bayar di Tempat (Tunai)', desc: 'Pembayaran uang tunai langsung / COD saat barang diterima' },
  { id: 'qris', name: 'QRIS (Scan QR)', desc: 'Scan kode QR standar nasional (BCA, Mandiri, GoPay, OVO, ShopeePay, DANA)' },
  { id: 'transfer', name: 'Transfer Bank', desc: 'Transfer antar rekening bank (BCA, BRI, BNI, Mandiri, BSI, dll)' },
  { id: 'ewallet', name: 'Dompet Digital (E-Wallet)', desc: 'GoPay, OVO, DANA, ShopeePay, LinkAja via nomor telepon' },
  { id: 'kartu', name: 'Kartu Debit / Kredit', desc: 'Pembayaran kartu gesek atau tap melalui mesin EDC toko' }
];
const MAP_ZOOM_MIN=0.6, MAP_ZOOM_MAX=2.4, MAP_ZOOM_STEP=0.25;
const TABS = [
  {id:'map', label:'Peta', icon:ICONS.map},
  {id:'usaha', label:'Usaha', icon:ICONS.bag},
  {id:'aktivitas', label:'Aktivitas', icon:ICONS.list},
  {id:'profil', label:'Profil', icon:ICONS.person},
];
const el = (id) => document.getElementById(id);