
"use client";

import React, { useEffect, useState } from "react";
import AppMenuitem from "./AppMenuitem";
import { MenuProvider } from "./context/menucontext";
import { AppMenuItem } from "@/types";

const AppMenu = () => {
  const [role, setRole] = useState<string>("");

  // Membaca role pengguna dari cookie
  useEffect(() => {
    try {
      const cookies = document.cookie.split(";");

      const userInfoCookie = cookies.find((cookie) =>
        cookie.trim().startsWith("user-info=")
      );

      if (userInfoCookie) {
        const userInfo = userInfoCookie
          .trim()
          .substring("user-info=".length);

        const user = JSON.parse(userInfo);

        setRole(typeof user.role === "string" ? user.role : "");
      }
    } catch (error) {
      console.error("Error membaca user cookie:", error);
      setRole("");
    }
  }, []);

  // Menu Admin dan Super Admin
  const modelAdmin: AppMenuItem[] = [
    {
      label: "Dashboard",
      items: [
        {
          label: "Dashboard",
          icon: "pi pi-fw pi-home",
          to: "/admin",
        },
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

  // Menu Operator
  const modelOperator: AppMenuItem[] = [
    {
      label: "Dashboard",
      items: [
        {
          label: "Dashboard",
          icon: "pi pi-fw pi-home",
          to: "/operator",
        },
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

  // Menu Customer
  const modelCustomer: AppMenuItem[] = [
    {
      label: "Katalog",
      icon: "pi pi-shopping-bag",
      items: [
        {
          label: "Produk",
          icon: "pi pi-box",
          to: "/customer/produk",
        },
      ],
    },
  ];

  // Menentukan menu berdasarkan role pengguna
  const menuModel =
    role === "admin" || role === "super_admin"
      ? modelAdmin
      : role === "operator"
      ? modelOperator
      : role === "customer"
      ? modelCustomer
      : [];

  return (
    <MenuProvider>
      <ul className="layout-menu">
        {menuModel.map((item, i) =>
          !item?.seperator ? (
            <AppMenuitem
              item={item}
              root={true}
              index={i}
              key={item.label}
            />
          ) : (
            <li className="menu-separator" key={i}></li>
          )
        )}
      </ul>
    </MenuProvider>
  );
};

export default AppMenu;
