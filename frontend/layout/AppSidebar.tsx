import { useState, useEffect } from 'react';
import { Button } from 'primereact/button';
import AppMenu from './AppMenu';
import { ChevronDown, LogOut, Menu, User } from 'lucide-react';
// import { Button } from 'react-bootstrap';

const AppSidebar = () => {
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        // Get user info from cookie
        const cookies = document.cookie.split(';');
        const userInfoCookie = cookies.find(cookie => cookie.trim().startsWith('user-info='));
        
        if (userInfoCookie) {
            const userInfo = userInfoCookie.split('=')[1];
            const parsedUserInfo = JSON.parse(userInfo);
            setUser({ name: parsedUserInfo.name });
        }
    }, []);

    const handleLogout = () => {
        // Delete user-info cookie on logout
        document.cookie = "user-info=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        window.location.href = '/auth/login';
    };

    return (
        <div className='flex flex-column justify-content-between h-full pb-3'>
            <AppMenu />

            <div className="mt-auto">
                {user && (
                    <div
                        className="flex align-items-center justify-content-between p-2 border-round-lg"
                        style={{ backgroundColor: '#F8E4EB', border: '1px solid #F3CFDB' }}
                    >
                        <div className="flex align-items-center pl-3">
                            <User className="mr-2" size={18} style={{ color: '#B94F76' }} />
                            <span className="font-semibold text-sm" style={{ color: '#272329' }}>{user.name}</span>
                        </div>
                        <div>
                            <Button
                                icon={<LogOut size={16} />}
                                className="p-button-rounded p-button-danger p-button-text"
                                style={{ color: '#B94F76' }}
                                onClick={handleLogout}
                                tooltip="Keluar"
                                tooltipOptions={{ position: 'top' }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AppSidebar;
