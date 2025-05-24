import React from 'react';

const HasRole = ({ role, children, fallback = null }) => {
    // get current user's role
    // const currentUserRole = useAuth();
    // if (currentUserROle === role) {
    //   return <>{children}</>;
    // }
    return <>{fallback}</>;
};

export default HasRole;
