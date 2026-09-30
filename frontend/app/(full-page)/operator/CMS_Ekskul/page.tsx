"use client";

import React, { useRef } from "react";
import { TabView, TabPanel } from "primereact/tabview";
import { Toast } from "primereact/toast";
import TambahEkskul from "./Ekskul/page"; // pastikan path ini benar

const CMSEkskul = () => {
  const toast = useRef<Toast>(null);
  const [activeIndex, setActiveIndex] = React.useState(0);

  return (
    <div className="card">
      <h2 className="text-2xl font-bold mb-4">CMS Halaman Ekstrakulikuler</h2>

      <Toast ref={toast} />

      <TabView activeIndex={activeIndex} onTabChange={(e) => setActiveIndex(e.index)}>
        <TabPanel header="Tambah Ekskul">
          <TambahEkskul />
        </TabPanel>

        {/* 
        Jika nanti mau ditambah tab lain tinggal aktifkan contoh di bawah:
        <TabPanel header="Tambah Navbar">
          <TambahData />
        </TabPanel>
        */}
      </TabView>
    </div>
  );
};

export default CMSEkskul;