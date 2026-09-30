/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useContext, useEffect, useState } from "react";
import AppMenuitem from "./AppMenuitem";
import { LayoutContext } from "./context/layoutcontext";
import { MenuProvider } from "./context/menucontext";
import { AppMenuItem } from "@/types";

const AppMenu = () => {
  const { layoutConfig } = useContext(LayoutContext);
  const [status, setStatus] = useState<number>(1);

  useEffect(() => {
    try {
      const cookies = document.cookie.split(";");
      const userInfoCookie = cookies.find((cookie) =>
        cookie.trim().startsWith("user-info=")
      );
      if (userInfoCookie) {
        const userInfo = userInfoCookie.split("=")[1];
        const user = JSON.parse(userInfo);
        setStatus(user.status);
      }
    } catch (error) {
      console.error("Error reading user cookie:", error);
    }
  }, []);

  // 🧭 Menu Admin KREZOEMA (status = 1)
  const modelAdmin: AppMenuItem[] = [
    {
      label: "Dashboard",
      items: [
        { label: "Dashboard", icon: "pi pi-fw pi-home", to: "/admin" }
      ],
    },
    {
      label: "Ecommerce",
      icon: "pi pi-shopping-bag",
      items: [
        {
          label: "Produk",
          icon: "pi pi-box",
          to: "/admin/produk",
        },
        {
          label: "Kategori",
          icon: "pi pi-tags",
          to: "/admin/kategori",
        },
        {
          label: "Pesanan",
          icon: "pi pi-shopping-cart",
          to: "/admin/pesanan",
        },
      ],
    },
    {
      label: "Kelola Admin",
      icon: "pi pi-users",
      items: [
        {
          label: "Data Admin",
          icon: "pi pi-user",
          to: "/admin/Data_Operator",
        },
      ],
    },
    {
      label: "Konten Website",
      icon: "pi pi-folder-open",
      items: [
        {
          label: "Beranda",
          icon: "pi pi-globe",
          to: "/operator/CMS_Landing",
        },
        {
          label: "Profil KREZOEMA",
          icon: "pi pi-info-circle",
          to: "/operator/CMS_Profile",
        },
        {
          label: "Berita & Artikel",
          icon: "pi pi-megaphone",
          to: "/operator/CMS_berita",
        },
        {
          label: "Hubungi Kami",
          icon: "pi pi-envelope",
          to: "/operator/CMS_Hubkami",
        },
      ],
    },
  ];

  // 🧭 Menu Operator KREZOEMA (status = 2 / 3)
  const modelOperator: AppMenuItem[] = [
    {
      label: "Dashboard",
      items: [
        { label: "Dashboard", icon: "pi pi-fw pi-home", to: "/operator" }
      ],
    },
    {
      label: "Ecommerce",
      icon: "pi pi-shopping-bag",
      items: [
        {
          label: "Produk",
          icon: "pi pi-box",
          to: "/operator/produk",
        },
        {
          label: "Kategori",
          icon: "pi pi-tags",
          to: "/operator/kategori",
        },
        {
          label: "Pesanan",
          icon: "pi pi-shopping-cart",
          to: "/operator/pesanan",
        },
      ],
    },
    {
      label: "Konten Website",
      icon: "pi pi-folder-open",
      items: [
        {
          label: "Beranda",
          icon: "pi pi-globe",
          to: "/operator/CMS_Landing",
        },
        {
          label: "Profil KREZOEMA",
          icon: "pi pi-info-circle",
          to: "/operator/CMS_Profile",
        },
        {
          label: "Berita & Artikel",
          icon: "pi pi-megaphone",
          to: "/operator/CMS_berita",
        },
        {
          label: "Hubungi Kami",
          icon: "pi pi-envelope",
          to: "/operator/CMS_Hubkami",
        },
      ],
    },
  ];

  const menuModel = status === 1 ? modelAdmin : modelOperator;

  return (
    <MenuProvider>
      <ul className="layout-menu">
        {menuModel.map((item, i) =>
          !item?.seperator ? (
            <AppMenuitem item={item} root={true} index={i} key={item.label} />
          ) : (
            <li className="menu-separator" key={i}></li>
          )
        )}
      </ul>
    </MenuProvider>
  );
};

export default AppMenu;
