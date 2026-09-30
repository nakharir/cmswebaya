/* eslint-disable @next/next/no-img-element */
import React from 'react';

const AppFooter = () => {
    return (
        <div className="layout-footer flex flex-column md:flex-row align-items-center justify-content-between p-3 gap-2" style={{ borderTop: '1px solid #F0ECE6', color: '#6b7280', fontSize: '0.85rem' }}>
            <div className="flex align-items-center gap-2">
                <span className="font-bold" style={{ color: '#D96C91' }}>KREZOEMA</span>
                <span className="text-gray-500">— Creative Craft &amp; Handmade Accessories</span>
            </div>
            <div>
                <span>&copy; {new Date().getFullYear()} KREZOEMA. All rights reserved.</span>
            </div>
        </div>
    );
};

export default AppFooter;
