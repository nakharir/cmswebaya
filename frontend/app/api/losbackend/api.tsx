export const BASE_API_URL = process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '') : 'http://127.0.0.1:8000';
export const api_url = `${BASE_API_URL}/api`;

export const API_ENDPOINTS = {
  //user
  SIDEBAR: (userId: string) => `${api_url}/user/${userId}/sidebars`,
  REGISTER: `${api_url}/register`,
  LOGIN: `${api_url}/login`,
  UPDATE_USER: (id: string) => `${api_url}/updateuserbyid/${id}`,
  VERIFY_USER: `${api_url}/verify-user`,

  //sidebar
  SYNC_SIDEBAR: `${api_url}/sync-user-sidebars`,
  GETSIDEBAR: `${api_url}/getallusersidebar`,
  UPDATE_STATUS_SIDEBAR: `${api_url}/sidebars/update-status`,

  //pemohon
  PEMOHON: `${api_url}/pemohon`,
  GETPEMOHONBYCIF: (cif: string) => `${api_url}/getpemohonbycif/${cif}`,
  UPDATEPEMOHONBYID: (cif: string) => `${api_url}/updatepemohonbyid/${cif}`,
  DELETEPEMOHONBYID: (Cif: string) => `${api_url}/deletepemohonbyid/${Cif}`,
  GETALLPEMOHON: `${api_url}/getallpemohon`,
  GETNASABAH: `${api_url}/getregisternasabah`,
  GETNASABAHID: (value: string) => `${api_url}/pemohon/${value}`,
  //produk/pengajuan
  GETALLPRODUK: `${api_url}/getallproduk`,
  GETPRODUKBYCIF: (cif: string) => `${api_url}/getprodukbycif/${cif}`,
  GETPRODUKBYID: (no_pengajuan: string) => `${api_url}/getprodukbyid/${no_pengajuan}`,
  DELETEPRODUKBYID: (NomorRekening: string) => `${api_url}/deleteprodukbyid/${NomorRekening}`,
  GETLASTPENGAJUAN: `${api_url}/getlastpengajuan`,
  ADDPRODUK: `${api_url}/produk`,
  UPDATEPRODUKBYID: (no_pengajuan: string) => `${api_url}/updatepengajuanbyid/${no_pengajuan}`,
  UPDATESTATUSPENGAJUANBYID: (no_pengajuan: string) => `${api_url}/updatestatuspengajuanbyid/${no_pengajuan}`,


  //jaminan
  ADDJAMINAN: `${api_url}/jaminan`,
  // GETALLJAMINAN: `${api_url}/getalljaminan`,
  // GETJAMINANBYID: (id: string) => `${api_url}/getjaminanbyid/${id}`,
  UPDATEJAMINANBYID: (no_pengajuan: string) => `${api_url}/updatejaminanbyid/${no_pengajuan}`,
  GETJAMINANBYNOPENGAJUAN: (no_pengajuan: string) => `${api_url}/getjaminanbyid/${no_pengajuan}`,
  DELETEJAMINANBYID: (no_pengajuan: string, jenisAgunan: string) => `${api_url}/deletejaminanbyid/${no_pengajuan}/${jenisAgunan}`,
  
  //finansial
  FINANCIAL: `${api_url}/finansial`,
  GETALLFINANCIAL: `${api_url}/getallfinansial`,
  GETFINANCIALBYNOPENGAJUAN: (no_pengajuan: string) => `${api_url}/getfinansialbynopengajuan/${no_pengajuan}`,
  GETFINANCIALBYCIF: (cif: string) => `${api_url}/getfinansialbycif/${cif}`,
  UPDATEFINANCIALBYID: (no_pengajuan: string) => `${api_url}/updatefinansialbyid/${no_pengajuan}`,
  
  //survey
  GETSURVEY: `${api_url}/getSurvey`,
  ADDSURVEY: `${api_url}/addSurvey`,
  GETALLSURVEY: `${api_url}/getallsurvey`,
  GETSURVEYBYNOPENGAJUAN: (no_pengajuan: string) => `${api_url}/getsurveybynopengajuan/${no_pengajuan}`,
  UPDATESURVEYBYID: (no_pengajuan: string) => `${api_url}/updatesurveybyid/${no_pengajuan}`,

  //aspek
  ASPEKFORM: `${api_url}/aspek`,
  GETALLASPEK: `${api_url}/getallaspek`,
  GETASPEKBYNOPENGAJUAN: (no_pengajuan: string) => `${api_url}/getaspekbynopengajuan/${no_pengajuan}`,
  UPDATEASPEKBYID: (no_pengajuan: string) => `${api_url}/updateaspekbyid/${no_pengajuan}`,
  
  //limac
  LIMAC: `${api_url}/limac`,
  GETALLLIMAC: `${api_url}/getalllimac`,
  GETLIMACBYNOPENGAJUAN: (no_pengajuan: string) => `${api_url}/getlimacbynopengajuan/${no_pengajuan}`,
  UPDATELIMACBYID: (no_pengajuan: string) => `${api_url}/updatelimacbyid/${no_pengajuan}`,
  

  //pengajuan kredit
  GETGOLONGANKREDIT: `${api_url}/getgolongankredit`,

  //Master Aspek
  TAMBAHTITLEASPEK: `${api_url}/tambahTitleAspek`,
  GETTITLEASPEK: `${api_url}/gettitleaspek`,
  UPDATETITLEASPEKBYID: (Kode: string) => `${api_url}/updatetitleaspekbyid/${Kode}`,
  DELETETITLEASPEKBYID: (Kode: string) => `${api_url}/deletetitleaspekbyid/${Kode}`,

  //Master Jaminan
  TAMBAHJENISAGUNAN: `${api_url}/tambahjenisagunan`,
  GETJENISAGUNAN: `${api_url}/getjenisagunan`,
  UPDATEJENISAGUNANBYID: (Kode: string) => `${api_url}/updatejenisagunanbyid/${Kode}`,
  DELETEJENISAGUNANBYID: (Kode: string) => `${api_url}/deletejenisagunanbyid/${Kode}`,
  TAMBAHHAKMILIK: `${api_url}/tambahHakMilik`,
  GETHAKMILIK: `${api_url}/getHakMilik`,
  UPDATEHAKMILIKBYID: (Kode: string) => `${api_url}/updateHakMilikbyid/${Kode}`,
  DELETEHAKMILIKBYID: (Kode: string) => `${api_url}/deleteHakMilikbyid/${Kode}`,
  TAMBAHTIPE: `${api_url}/tambahTipe`,
  GETTIPE: `${api_url}/getTipe`,
  UPDATETIPEBYID: (Kode: string) => `${api_url}/updateTipebyid/${Kode}`,
  DELETETIPEBYID: (Kode: string) => `${api_url}/deleteTipebyid/${Kode}`,
  TAMBAHJENISPENGIKATAN: `${api_url}/tambahJenisPengikatan`,
  GETJENISPENGIKATAN: `${api_url}/getJenisPengikatan`,
  UPDATEJENISPENGIKATANBYID: (Kode: string) => `${api_url}/updateJenisPengikatanbyid/${Kode}`,
  DELETEJENISPENGIKATANBYID: (Kode: string) => `${api_url}/deleteJenisPengikatanbyid/${Kode}`,
  TAMBAHHUBUNGANPEMILIK: `${api_url}/tambahHubunganPemilik`,
  GETHUBUNGANPEMILIK: `${api_url}/getHubunganPemilik`,
  UPDATEHUBUNGANPEMILIKBYID: (Kode: string) => `${api_url}/updateHubunganPemilikbyid/${Kode}`,
  DELETEHUBUNGANPEMILIKBYID: (Kode: string) => `${api_url}/deleteHubunganPemilikbyid/${Kode}`,

  //Master Survey
  ADDTITLESURVEY: `${api_url}/addTitleSurvey`,
  UPDATETITLESURVEYBYID: (Kode: string) => `${api_url}/updateTitleSurveybyid/${Kode}`,
  DELETEREFSURVEYBYID: (Kode: string) => `${api_url}/deleteRefSurveybyid/${Kode}`,

  //Master Pengajuan Kredit
  GETBIDANGUSAHA: `${api_url}/getbidangusaha`,
  TAMBAHBIDANGUSAHA: `${api_url}/tambahBidangUsaha`,
  UPDATEBIDANGUSAHA: (Kode: string) => `${api_url}/updatebidangusahabyid/${Kode}`,
  DELETEBIDANGUSAHA: (Kode: string) => `${api_url}/deletebidangusahabyid/${Kode}`,
  GETSIFATKREDIT: `${api_url}/getsifatkredit`,
  TAMBAHSIFATKREDIT: `${api_url}/tambahSifatKredit`,
  UPDATESIFATKREDIT: (Kode: string) => `${api_url}/updateSifatKreditbyid/${Kode}`,
  DELETESIFATKREDIT: (Kode: string) => `${api_url}/deleteSifatKreditbyid/${Kode}`,
  GETJENISANGURAN: `${api_url}/getjenisanguran`,
  TAMBAHJENISANGURAN: `${api_url}/tambahJenisAnguran`,
  UPDATEJENISANGURAN: (Kode: string) => `${api_url}/updateJenisAnguranbyid/${Kode}`,
  DELETEJENISANGURAN: (Kode: string) => `${api_url}/deleteJenisAnguranbyid/${Kode}`,
  GETJENISPERMOHONAN: `${api_url}/getjenispermohonan`,
  TAMBAHJENISPERMOHONAN: `${api_url}/tambahJenisPermohonan`,
  UPDATEJENISPERMOHONAN: (Kode: string) => `${api_url}/updateJenisPermohonanbyid/${Kode}`,
  DELETEJENISPERMOHONAN: (Kode: string) => `${api_url}/deleteJenisPermohonanbyid/${Kode}`,

  //Master Pemohon
  GETSEKTOREKONOMI: `${api_url}/getsektorekonomi`,
  TAMBAHSEKTORPEMOHON: `${api_url}/tambahSektorEkonomi`,
  UPDATESEKTORPERMOHON: (Kode: string) => `${api_url}/updatesektorekonomibyid/${Kode}`,
  DELETESEKTORPERMOHON: (Kode: string) => `${api_url}/deletesektorekonomibyid/${Kode}`,
  GETSTATUSUSAHA: `${api_url}/getstatususaha`,
  TAMBAHSTATUSUSAHA: `${api_url}/tambahStatusUsaha`,
  UPDATESTATUSUSAHA: (Kode: string) => `${api_url}/updatestatususahabyid/${Kode}`,
  DELETESTATUSUSAHA: (Kode: string) => `${api_url}/deletestatususahabyid/${Kode}`,
  GETSTATUSTEMPATTINGGAL: `${api_url}/getstatusTempatTinggal`,
  TAMBAHSTATUSTEMPATTINGGAL: `${api_url}/tambahStatusTempatTinggal`,
  UPDATESTATUSTEMPATTINGGAL: (Kode: string) => `${api_url}/updatestatusTempatTinggalbyid/${Kode}`,
  DELETESTATUSTEMPATTINGGAL: (Kode: string) => `${api_url}/deletestatusTempatTinggalbyid/${Kode}`,
  GETPROFESISAMPAINGAN: `${api_url}/getprofesisampingan`,
  TAMBAHPROFESISAMPAINGAN: `${api_url}/tambahProfesiSampingan`,
  UPDATEPROFESISAMPAINGAN: (Kode: string) => `${api_url}/updateprofesisampinganbyid/${Kode}`,
  DELETEPROFESISAMPAINGAN: (Kode: string) => `${api_url}/deleteprofesisampinganbyid/${Kode}`,
  CHECKCIF: (cif: string) => `${api_url}/check-cif/${cif}`,

  //sdmangu

   //Navbar
  GETNAVBAR: `${api_url}/getNavbar`,
  TAMBAHNAVBAR: `${api_url}/tambahNavbar`,
  UPDATENAVBAR: (Kode: string) => `${api_url}/updateNavbar/${Kode}`,
  DELETENAVBAR: (Kode: string) => `${api_url}/deleteNavbar/${Kode}`,
  //Landing
  GETSECTIONLanding: `${api_url}/getLanding`,
  TAMBAHSECTIONLanding: `${api_url}/tambahLanding`,
  UPDATESECTIONLanding: (id: string) => `${api_url}/updateLanding/${id}`,
  DELETESECTIONLanding: (id: string) => `${api_url}/deleteLanding/${id}`,
  //Fasilitas
  GETFasilitas: `${api_url}/getFasilitas`,
  TAMBAHFasilitas: `${api_url}/tambahFasilitas`,
  UPDATEFasilitas: (id: string) => `${api_url}/updateFasilitas/${id}`,
  DELETEFasilitas: (id: string) => `${api_url}/deleteFasilitas/${id}`,

  //Ekstrakulikuler
  GETEkskul: `${api_url}/getEkskul`,
  TAMBAHEkskul: `${api_url}/tambahEkskul`,
  UPDATEEkskul: (id: string) => `${api_url}/updateEkskul/${id}`,
  DELETEEkskul: (id: string) => `${api_url}/deleteEkskul/${id}`,

    //Berita
  GETBerita: `${api_url}/getBerita`,  
  TAMBAHBerita: `${api_url}/tambahBerita`,
  UPDATEBerita: (id: string) => `${api_url}/updateBerita/${id}`,
  DELETEBerita: (id: string) => `${api_url}/deleteBerita/${id}`,

  // Guru
GETGuru: `${api_url}/getGuru`,  
TAMBAHGuru: `${api_url}/tambahGuru`,  
UPDATEGuru: (id: string) => `${api_url}/updateGuru/${id}`,  
DELETEGuru: (id: string) => `${api_url}/deleteGuru/${id}`,
GETTotalGuru: `${api_url}/gettotalGuru`,

 // Operator
 GETOperator: `${api_url}/getoperator`,  
 TAMBAHOperator: `${api_url}/tambahoperator`,  
 UPDATEOperator: (id: string) => `${api_url}/updateoperator/${id}`,  
 DELETEOperator: (id: string) => `${api_url}/deleteoperator/${id}`,

// Profile Sekolah
 GETProfileSekolah: `${api_url}/getprofilesekolah`,
  TAMBAHProfileSekolah: `${api_url}/tambahprofilesekolah`,
  UPDATEProfileSekolah: (id: string) => `${api_url}/updateprofilesekolah/${id}`,
  DELETEProfileSekolah: (id: string) => `${api_url}/deleteprofilesekolah/${id}`,

  // Visi Misi
GETVisiMisi: `${api_url}/getvisimisi`,
TAMBAHVisiMisi: `${api_url}/tambahvisimisi`,
UPDATEVisiMisi: (id: string) => `${api_url}/updatevisimisi/${id}`,
DELETEVisiMisi: (id: string) => `${api_url}/deletevisimisi/${id}`,

// Hubungi Kami
GETHubungiKami: `${api_url}/gethubungikami`,
TAMBAHHubungiKami: `${api_url}/tambahhubungikami`,
UPDATEHubungiKami: (id: string) => `${api_url}/updatehubungikami/${id}`,
DELETEHubungiKami: (id: string) => `${api_url}/deletehubungikami/${id}`,

// Visitor
GETVisitor: `${api_url}/getTotalVisitor`,


};