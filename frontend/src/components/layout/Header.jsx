import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, Menu, Search, X, Settings, LogOut } from 'lucide-react';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  DropdownSection,
} from '@heroui/dropdown';
import { Avatar } from '@heroui/avatar';
import { useAuth } from '../../contexts/AuthContext';

const Header = ({ toggleSidebar }) => {
  const [scrolled, setScrolled] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getUserInitials = () => {
    if (user?.fullName) {
      return user.fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
    }
    return user?.username?.substring(0, 2).toUpperCase() || 'U';
  };

  const getUserName = () => {
    return user?.fullName || user?.username || 'User';
  };

  const getUserRole = () => {
    return user?.role || 'User';
  };

  return (
    <header
      className={`sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-blue-200 transition-shadow duration-200 ${
        scrolled ? 'shadow-md' : ''
      }`}
    >
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-3">
          <Button
            variant="light"
            isIconOnly
            className="md:flex lg:hidden text-blue-700 hover:bg-blue-100"
            onPress={toggleSidebar}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Sidebar</span>
          </Button>
          <h1 className="text-xl font-bold text-blue-700 truncate max-w-[200px] sm:max-w-none">
            {/* Optional Title */}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {/* {searchVisible ? (
            <div className="relative animate-fade-in w-full max-w-[200px] sm:max-w-[300px]">
              <Input
                placeholder="Search..."
                className="pr-8 bg-blue-50 focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <Button
                variant="light"
                isIconOnly
                className="absolute right-0 top-0 text-blue-700 hover:bg-blue-100"
                onPress={() => setSearchVisible(false)}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close search</span>
              </Button>
            </div>
          ) : (
            <Button
              variant="light"
              isIconOnly
              onPress={() => setSearchVisible(true)}
              className="transition-all duration-300 text-blue-700 hover:bg-blue-100"
            >
              <Search className="h-5 w-5" />
              <span className="sr-only">Search</span>
            </Button>
          )}

          <Button
            variant="light"
            isIconOnly
            className="relative transition-all duration-300 text-blue-700 hover:bg-blue-100"
            onPress={() => navigate('/notifications')}
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-blue-600 rounded-full"></span>
            <span className="sr-only">Notifications</span>
          </Button> */}

          {user ? (
            <Dropdown>
              <DropdownTrigger>
                <Avatar
                  name={getUserName()}
                  size="sm"
                  className="ring-2 ring-blue-500 cursor-pointer"
                />
              </DropdownTrigger>
              <DropdownMenu aria-label="User menu" className="w-56">
                <DropdownSection>
                  <DropdownItem
                    key="user-info"
                    isDisabled
                    className="flex flex-col items-start"
                  >
                    <span className="font-medium text-blue-700 block">
                      {getUserName()}
                    </span>
                    <span className="text-xs block text-gray-500 capitalize">
                      {getUserRole()}
                    </span>
                  </DropdownItem>
                </DropdownSection>
                <DropdownSection>
                  <DropdownItem
                    key="settings"
                    startContent={<Settings className="h-4 w-4 text-blue-700" />}
                    onPress={() => navigate('/dashboard/setting')}
                    className="hover:bg-blue-50"
                  >
                    Settings
                  </DropdownItem>
                  <DropdownItem
                    key="logout"
                    startContent={<LogOut className="h-4 w-4 text-blue-700" />}
                    onPress={handleLogout}
                    className="hover:bg-blue-50"
                  >
                    Logout
                  </DropdownItem>
                </DropdownSection>
              </DropdownMenu>
            </Dropdown>
          ) : (
            <Button
              variant="light"
              className="text-blue-700 hover:bg-blue-100"
              onPress={() => navigate('/login')}
            >
              Login
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
