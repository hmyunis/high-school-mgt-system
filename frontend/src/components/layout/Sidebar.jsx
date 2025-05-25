import { NavLink } from 'react-router-dom';
import {
  Home,
  Users,
  BookOpen,
  FileText,
  Settings,
  ClipboardList,
  GraduationCap,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '@heroui/button';
import clsx from 'clsx';

const sidebarConfig = {
  ADMIN: [
    { label: 'Dashboard', icon: <Home className="size-5" />, to: '/dashboard/admin' },
    { label: 'User Management', icon: <Users className="size-5" />, to: '/dashboard/users' },
    { label: 'Course Management', icon: <BookOpen className="size-5" />, to: '/dashboard/courses' },
    // { label: 'Assessments', icon: <FileText className="size-5" />, to: '/admin/assessments' },
    { label: 'Manage Profiles', icon: <Settings className="size-5" />, to: '/dashboard/user/profiles' },
    { label: 'My Profile', icon: <GraduationCap className="size-5" />, to: '/dashboard/profile' },
    { label: 'Logout', icon: <LogOut className="size-5" />, to: '/logout' },
  ],
  TEACHER: [
    { label: 'Dashboard', icon: <Home className="size-5" />, to: '/teacher/dashboard' },
    { label: 'My Courses', icon: <BookOpen className="size-5" />, to: '/teacher/courses' },
    { label: 'Assessments', icon: <ClipboardList className="size-5" />, to: '/teacher/assessments' },
    { label: 'Students', icon: <Users className="size-5" />, to: '/teacher/students' },
    { label: 'My Profile', icon: <GraduationCap className="size-5" />, to: '/dashboard/profile' },
    { label: 'Logout', icon: <LogOut className="size-5" />, to: '/logout' },
  ],
  STUDENT: [
    { label: 'Dashboard', icon: <Home className="size-5" />, to: '/student/dashboard' },
    { label: 'My Courses', icon: <BookOpen className="size-5" />, to: '/student/courses' },
    { label: 'My Grades', icon: <FileText className="size-5" />, to: '/student/grades' },
    { label: 'My Attendance', icon: <ClipboardList className="size-5" />, to: '/student/attendance' },
    { label: 'My Profile', icon: <GraduationCap className="size-5" />, to: '/dashboard/profile' },
    { label: 'Logout', icon: <LogOut className="size-5" />, to: '/logout' },
  ],
};

export function Sidebar({ isCollapsed, setIsCollapsed }) {
  const { role, logout } = useAuth();
  const links = sidebarConfig[role] || [];

  return (
    <aside
      className={clsx(
        'transition-all duration-300 bg-white border-r border-blue-400 min-h-screen flex flex-col shadow-sm',
        isCollapsed ? 'w-16' : 'w-60'
      )}
    >
      <div className="flex items-center justify-between p-3 border-b border-blue-400">
        {!isCollapsed && (
          <span className="text-lg font-semibold capitalize truncate">{role} Panel</span>
        )}
        <Button
          variant="ghost"
          size="icon"
          radius="sm"
          onPress={() => setIsCollapsed(!isCollapsed)}
          className="ml-auto p-1"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      <nav className="flex-1 px-1 py-4 space-y-1 overflow-y-auto">
        {links.map(({ label, to, icon }) => {
          if (label === 'Logout') {
            return (
              <div
                key={to}
                onClick={logout}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer',
                  'text-red-700 hover:bg-red-100',
                  isCollapsed && 'justify-center px-2'
                )}
              >
                {icon}
                {!isCollapsed && <span>{label}</span>}
              </div>
            );
          }
          return (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors',
                  isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100',
                  isCollapsed && 'justify-center px-2'
                )
              }
            >
              {icon}
              {!isCollapsed && <span>{label}</span>}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}