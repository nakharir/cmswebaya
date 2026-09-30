"use client"
import React, { useState, useEffect, useRef } from 'react';
import { TabView, TabPanel } from 'primereact/tabview';
import { Toast } from 'primereact/toast';
import TambahNavbar from './Hubkami/page';


const TambahanAnalisaKredit = () => {
    const toast = useRef<Toast>(null);

    return (
        <div className="card">
            <h2 className='text-2xl font-bold mb-4'>CMS Hubungi Kami</h2>
            <TabView activeIndex={1}>
                <Toast ref={toast} />
                <TabPanel header="Hubungi kami ">
                    <TambahNavbar/>
                </TabPanel>
   
               
                {/* <TabPanel header="Tambah Navbar">
                    <TambahData />
                </TabPanel> */}
                {/* <TabPanel header="Tambah Judul">
                    <TambahTitle />
                </TabPanel>
                <TabPanel header="Tambah Deskripsi">
                    <TambahDeskripsi />
                </TabPanel> */}
            </TabView>
        </div>
    );
};

export default TambahanAnalisaKredit;