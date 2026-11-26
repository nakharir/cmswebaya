export const BASE_API_URL = process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '') : 'http://127.0.0.1:8000';
export const api_url = `${BASE_API_URL}/api`;

export const API_ENDPOINTS = {
  // Auth & User
  REGISTER: `${api_url}/register`,
  LOGIN: `${api_url}/login`,
  UPDATE_USER: (id: string) => `${api_url}/updateuserbyid/${id}`,

  // Sidebar management
  SYNC_SIDEBAR: `${api_url}/sync-user-sidebars`,
  GETSIDEBAR: `${api_url}/getallusersidebar`,
  UPDATE_STATUS_SIDEBAR: `${api_url}/sidebars/update-status`,

  // Operator management
  GETOperator: `${api_url}/getoperator`,
  TAMBAHOperator: `${api_url}/tambahoperator`,
  UPDATEOperator: (id: string) => `${api_url}/updateoperator/${id}`,
  DELETEOperator: (id: string) => `${api_url}/deleteoperator/${id}`,

  // CMS Landing
  GETSECTIONLanding: `${api_url}/getLanding`,
  TAMBAHSECTIONLanding: `${api_url}/tambahLanding`,
  UPDATESECTIONLanding: (id: string) => `${api_url}/updateLanding/${id}`,
  DELETESECTIONLanding: (id: string) => `${api_url}/deleteLanding/${id}`,

  // CMS Fasilitas
  GETFasilitas: `${api_url}/getFasilitas`,
  TAMBAHFasilitas: `${api_url}/tambahFasilitas`,
  UPDATEFasilitas: (id: string) => `${api_url}/updateFasilitas/${id}`,
  DELETEFasilitas: (id: string) => `${api_url}/deleteFasilitas/${id}`,

  // CMS Ekstrakulikuler
  GETEkskul: `${api_url}/getEkskul`,
  TAMBAHEkskul: `${api_url}/tambahEkskul`,
  UPDATEEkskul: (id: string) => `${api_url}/updateEkskul/${id}`,
  DELETEEkskul: (id: string) => `${api_url}/deleteEkskul/${id}`,

  // CMS Berita
  GETBerita: `${api_url}/getBerita`,
  TAMBAHBerita: `${api_url}/tambahBerita`,
  UPDATEBerita: (id: string) => `${api_url}/updateBerita/${id}`,
  DELETEBerita: (id: string) => `${api_url}/deleteBerita/${id}`,

  // CMS Guru
  GETGuru: `${api_url}/getGuru`,
  TAMBAHGuru: `${api_url}/tambahGuru`,
  UPDATEGuru: (id: string) => `${api_url}/updateGuru/${id}`,
  DELETEGuru: (id: string) => `${api_url}/deleteGuru/${id}`,

  // CMS Profile Sekolah
  GETProfileSekolah: `${api_url}/getprofilesekolah`,
  TAMBAHProfileSekolah: `${api_url}/tambahprofilesekolah`,
  UPDATEProfileSekolah: (id: string) => `${api_url}/updateprofilesekolah/${id}`,
  DELETEProfileSekolah: (id: string) => `${api_url}/deleteprofilesekolah/${id}`,

  // CMS Visi Misi
  GETVisiMisi: `${api_url}/getvisimisi`,
  TAMBAHVisiMisi: `${api_url}/tambahvisimisi`,
  UPDATEVisiMisi: (id: string) => `${api_url}/updatevisimisi/${id}`,
  DELETEVisiMisi: (id: string) => `${api_url}/deletevisimisi/${id}`,

  // CMS Hubungi Kami
  GETHubungiKami: `${api_url}/gethubungikami`,
  TAMBAHHubungiKami: `${api_url}/tambahhubungikami`,
  UPDATEHubungiKami: (id: string) => `${api_url}/updatehubungikami/${id}`,
  DELETEHubungiKami: (id: string) => `${api_url}/deletehubungikami/${id}`,
};
