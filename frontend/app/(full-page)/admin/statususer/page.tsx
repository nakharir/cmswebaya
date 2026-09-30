"use client";
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { InputSwitch } from "primereact/inputswitch";
import { API_ENDPOINTS } from "@/app/api/losbackend/api";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";

interface Sidebar {
  sidebar_id: number;
  label: string;
  to_path: string;
  status: number;
  children?: Sidebar[];
}

interface User {
  id: number;
  name: string;
  email: string;
  status: number;
  sidebars: Sidebar[];
}

const Statuspage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedRow, setSelectedRow] = useState<User | null>(null);
  const [visibleEdit, setVisibleEdit] = useState(false);

  const toast = useRef<Toast>(null);

  const handleSync = async () => {
    try {
      const response = await axios.put(API_ENDPOINTS.SYNC_SIDEBAR);
      alert(response.data.message);
    } catch (error) {
      console.error("Error syncing sidebars:", error);
      alert("Failed to sync sidebars.");
    }
  };

  // ✅ Ambil semua user beserta sidebars
  useEffect(() => {
    const allUserSidebar = async () => {
      try {
        const response = await axios.get(API_ENDPOINTS.GETSIDEBAR);
        const fetchedUsers = Array.isArray(response.data) ? response.data : [];
        setUsers(fetchedUsers);
      } catch (error) {
        console.error("Error fetching sidebars:", error);
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "Failed to fetch user data",
        });
      }
    };
    allUserSidebar();
  }, []);

  const handleToggleStatus = async (userId: number, sidebar: Sidebar) => {
    try {
      const response = await axios.post(API_ENDPOINTS.UPDATE_STATUS_SIDEBAR, {
        user_id: userId,
        sidebar_id: sidebar.sidebar_id,
      });

      const { new_status } = response.data;

      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId
            ? {
                ...user,
                sidebars: user.sidebars.map((s) =>
                  s.sidebar_id === sidebar.sidebar_id
                    ? { ...s, status: new_status }
                    : s
                ),
              }
            : user
        )
      );

      toast.current?.show({
        severity: "success",
        summary: "Status Updated",
        detail: "Sidebar status updated successfully",
      });
    } catch (error) {
      console.error("Error updating sidebar status:", error);
      toast.current?.show({
        severity: "error",
        summary: "Update Failed",
        detail: "Failed to update sidebar status",
      });
    }
  };

  const SidebarItem = ({
    sidebar,
    userId,
    isChild,
  }: {
    sidebar: Sidebar;
    userId: number;
    isChild?: boolean;
  }) => {
    return (
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "start",
            justifyContent: "space-between",
          }}
        >
          <span className={`py-2 ${isChild ? "ml-4" : ""}`}>{sidebar.label}</span>
          {!isChild && (
            <InputSwitch
              checked={sidebar.status === 2}
              onChange={() => handleToggleStatus(userId, sidebar)}
              className="ml-2"
            />
          )}
        </div>
        {Array.isArray(sidebar.children) && sidebar.children.length > 0 && (
          <div className="ml-4">
            {sidebar.children.map((child, index) => (
              <SidebarItem
                key={index}
                sidebar={child}
                userId={userId}
                isChild={true}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  // ✅ Aman dari error `.map is not a function`
  const SidebarList = ({
    sidebars,
    userId,
  }: {
    sidebars?: Sidebar[];
    userId: number;
  }) => {
    if (!Array.isArray(sidebars) || sidebars.length === 0) {
      return <p className="text-gray-500 italic">Tidak ada sidebar</p>;
    }

    return (
      <div>
        {sidebars.map((sidebar, index) => (
          <SidebarItem key={index} sidebar={sidebar} userId={userId} />
        ))}
      </div>
    );
  };

  const sidebarTemplate = (rowData: User) => (
    <SidebarList sidebars={rowData.sidebars} userId={rowData.id} />
  );

  const statusOptions = [
    { label: "Visitor", value: 3 },
    { label: "Admin", value: 2 },
    { label: "SuperAdmin", value: 1 },
  ];

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRow) return;

    try {
      setVisibleEdit(false);

      toast.current?.show({
        severity: "success",
        summary: "Update Success",
        detail: "User updated successfully",
      });

      const updatedSidebars = (selectedRow.sidebars || []).map((sidebar) => {
        if (selectedRow.status === 3) {
          // Visitor
          if (
            !["Status User", "Debitur", "CMS Data Master", "List Pengajuan"].includes(
              sidebar.label
            )
          ) {
            return { ...sidebar, status: 2 };
          }
          return { ...sidebar, status: 1 };
        } else if (selectedRow.status === 2) {
          // Admin
          if (["List Pengajuan", "CMS Data Berita"].includes(sidebar.label)) {
            return { ...sidebar, status: 2 };
          }
          return { ...sidebar, status: 1 };
        } else if (selectedRow.status === 1) {
          // SuperAdmin
          return { ...sidebar, status: 2 };
        }
        return sidebar;
      });

     const userUpdateResponse = await axios.put(
  API_ENDPOINTS.UPDATE_USER(String(selectedRow.id)),
  {
    ...selectedRow,
    sidebars: JSON.stringify(updatedSidebars),
  }
);


      if (userUpdateResponse.data) {
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.id === userUpdateResponse.data.id
              ? userUpdateResponse.data
              : user
          )
        );

        setSelectedRow(userUpdateResponse.data);
      } else {
        throw new Error("Failed to update user");
      }
    } catch (error) {
      console.error("Error updating user:", error);
      toast.current?.show({
        severity: "error",
        summary: "Update Failed",
        detail: "Failed to update the user and sidebars",
      });
    }
  };

  return (
    <div className="card">
      <h2 className="text-2xl font-bold mb-4">Status User</h2>
      <div className="flex align-items-center justify-content-end ">
        <label>Refresh</label>
        <Button
          icon="pi pi-refresh"
          rounded
          text
          aria-label="Filter"
          onClick={handleSync}
        />
      </div>
      <Toast ref={toast} />
      <DataTable value={users} tableStyle={{ minWidth: "50rem" }}>
        <Column field="id" header="User ID" />
        <Column field="name" header="User Name" />
        <Column field="email" header="Email" style={{ width: "20%" }} />
        <Column
          field="status"
          header="Status"
          body={(rowData) => (
            <div>
              {rowData.status === 1
                ? "SuperAdmin"
                : rowData.status === 2
                ? "Operator"
                : "Marketing"}
            </div>
          )}
        />
        <Column
          style={{ width: "5%" }}
          header="Edit"
          body={(rowData) => (
            <Button
              icon="pi pi-pencil"
              style={{ border: "1", color: "#333" }}
              className="bg-blue-200"
              onClick={() => {
                setSelectedRow(rowData);
                setVisibleEdit(true);
              }}
            />
          )}
        />
        <Column header="Sidebars" body={sidebarTemplate} />
      </DataTable>

      <Dialog
        header="Edit User"
        visible={visibleEdit}
        className="flex flex-column"
        style={{ width: "50vw" }}
        onHide={() => setVisibleEdit(false)}
      >
        {selectedRow && (
          <form onSubmit={handleUpdateUser}>
            <div className="mb-3">
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Nama
              </label>
              <InputText
                id="name"
                value={selectedRow.name}
                onChange={(e) =>
                  setSelectedRow({ ...selectedRow, name: e.target.value })
                }
                required
              />
            </div>
            <div className="mb-3">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email
              </label>
              <InputText
                id="email"
                value={selectedRow.email}
                onChange={(e) =>
                  setSelectedRow({ ...selectedRow, email: e.target.value })
                }
                required
              />
            </div>
            <div className="mb-3">
              <label
                htmlFor="status"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Status
              </label>
              <Dropdown
                value={selectedRow.status}
                options={statusOptions}
                onChange={(e) =>
                  setSelectedRow({ ...selectedRow, status: e.value })
                }
              />
            </div>
            <div className="flex justify-content-end mt-3">
              <Button
                label="Cancel"
                icon="pi pi-times"
                onClick={() => setVisibleEdit(false)}
                className="p-button-text"
              />
              <Button label="Save" icon="pi pi-check" autoFocus type="submit" />
            </div>
          </form>
        )}
      </Dialog>
    </div>
  );
};

export default Statuspage;
