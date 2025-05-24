import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { PageLayout } from './components/layout/PageLayout';

const App = () => {
    const location = useLocation();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [location]);

    return (
        <PageLayout>
            <Outlet />
        </PageLayout>
    );
};

export default App;
