import { useState, useEffect } from 'react';
import Header from './Header';
import { Sidebar } from './Sidebar';
import { useIsMobile } from '../../hooks/use-mobile';

export function PageLayout({ children }) {
    const isMobile = useIsMobile();
    const [isCollapsed, setIsCollapsed] = useState(false);

    useEffect(() => {
        const savedState = localStorage.getItem('sidebarState');
        if (savedState) {
            setIsCollapsed(savedState === 'closed');
        } else {
            setIsCollapsed(isMobile);
        }
    }, [isMobile]);

    const toggleSidebar = () => {
        setIsCollapsed(!isCollapsed);
        localStorage.setItem('sidebarState', !isCollapsed ? 'closed' : 'open');
    };

    return (
        <div className="min-h-screen flex flex-col bg-blue-50">
            <Header toggleSidebar={toggleSidebar} />
            <div className="flex flex-1 overflow-hidden">
                <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
                <main className="flex-1 p-4 md:p-6 overflow-y-auto bg-white shadow-inner rounded-tl-lg border-l border-blue-100">
                    {children}
                </main>
            </div>
        </div>
    );
}
