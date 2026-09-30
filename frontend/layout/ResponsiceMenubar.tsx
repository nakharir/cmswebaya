// components/ResponsiveMenubar.tsx
import { useState, useEffect } from 'react';
import { useMediaQuery } from 'react-responsive';
import { Menubar } from 'primereact/menubar';

const ResponsiveMenubar = ({ items }:any) => {
    const [isClient, setIsClient] = useState(false);
    const isDesktop = useMediaQuery({ minWidth: 992 });

    useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient) return null;

    return isDesktop ? (
        <Menubar model={items} />
    ) : (
        <div className="topbar-menu-items">
            {items.map((item:any, index:any) => (
                <div key={index} className="topbar-menu-item">
                    {item.items ? (
                        <>
                            <span>{item.label}</span>
                            <div className="topbar-submenu">
                                {item.items.map((subItem:any, subIndex:any) => (
                                    <div key={subIndex}>
                                        {subItem.template && subItem.template()}
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        item.template && item.template()
                    )}
                </div>
            ))}
        </div>
    );
};

export default ResponsiveMenubar;