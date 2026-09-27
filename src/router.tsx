import { createBrowserRouter } from 'react-router-dom';

import { Layout } from '@/components/layout/Layout';
import { RouteError } from '@/components/layout/RouteError';
import { RequirePermission } from '@/features/auth/RequirePermission';
import { About } from '@/pages/About';
import { Advertise } from '@/pages/Advertise';
import { Blog } from '@/pages/Blog';
import { Checkout } from '@/pages/Checkout';
import { Contact } from '@/pages/Contact';
import { Home } from '@/pages/Home';
import { Login, Register } from '@/pages/Login';
import { NotFound } from '@/pages/NotFound';
import { Notifications } from '@/pages/Notifications';
import { PostDetail } from '@/pages/PostDetail';
import { ProjectDetail, Projects } from '@/pages/Projects';
import { Services } from '@/pages/Services';
import { Write } from '@/pages/Write';
import { AdvertsAdmin } from '@/pages/dashboard/AdvertsAdmin';
import { CommentQueue } from '@/pages/dashboard/CommentQueue';
import { DashboardLayout } from '@/pages/dashboard/DashboardLayout';
import { Inbox } from '@/pages/dashboard/Inbox';
import { Overview } from '@/pages/dashboard/Overview';
import { PostEditor } from '@/pages/dashboard/PostEditor';
import { ProjectsAdmin } from '@/pages/dashboard/ProjectsAdmin';
import { ReviewQueue } from '@/pages/dashboard/ReviewQueue';
import { Roles } from '@/pages/dashboard/Roles';
import { Settings } from '@/pages/dashboard/Settings';
import { UsersAdmin } from '@/pages/dashboard/UsersAdmin';

export const router = createBrowserRouter([
  {
    element: <Layout />,
    errorElement: <RouteError />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/about', element: <About /> },
      { path: '/projects', element: <Projects /> },
      { path: '/projects/:slug', element: <ProjectDetail /> },
      { path: '/services', element: <Services /> },
      { path: '/blog', element: <Blog /> },
      { path: '/blog/:slug', element: <PostDetail /> },
      { path: '/contact', element: <Contact /> },
      { path: '/advertise', element: <Advertise /> },
      { path: '/checkout/:reference', element: <Checkout /> },
      { path: '/write', element: <Write /> },
      { path: '/login', element: <Login /> },
      { path: '/register', element: <Register /> },
      {
        path: '/notifications',
        element: (
          <RequirePermission>
            <Notifications />
          </RequirePermission>
        ),
      },
      {
        path: '/dashboard/posts/:slug/edit',
        element: (
          <RequirePermission>
            <PostEditor />
          </RequirePermission>
        ),
      },
      {
        path: '/dashboard',
        element: (
          <RequirePermission
            permissions={[
              'analytics:read',
              'post:create',
              'post:moderate',
              'comment:moderate',
              'inbox:read',
              'settings:manage',
              'role:manage',
              'ad:manage',
              'user:manage',
              'portfolio:manage',
            ]}
          >
            <DashboardLayout />
          </RequirePermission>
        ),
        children: [
          { index: true, element: <Overview /> },
          {
            path: 'review',
            element: (
              <RequirePermission permissions={['post:moderate']}>
                <ReviewQueue />
              </RequirePermission>
            ),
          },
          {
            path: 'comments',
            element: (
              <RequirePermission permissions={['comment:moderate']}>
                <CommentQueue />
              </RequirePermission>
            ),
          },
          {
            path: 'inbox',
            element: (
              <RequirePermission permissions={['inbox:read']}>
                <Inbox />
              </RequirePermission>
            ),
          },
          {
            path: 'settings',
            element: (
              <RequirePermission permissions={['settings:manage']}>
                <Settings />
              </RequirePermission>
            ),
          },
          {
            path: 'roles',
            element: (
              <RequirePermission permissions={['role:manage']}>
                <Roles />
              </RequirePermission>
            ),
          },
          {
            path: 'adverts',
            element: (
              <RequirePermission permissions={['ad:manage']}>
                <AdvertsAdmin />
              </RequirePermission>
            ),
          },
          {
            path: 'projects',
            element: (
              <RequirePermission permissions={['portfolio:manage']}>
                <ProjectsAdmin />
              </RequirePermission>
            ),
          },
          {
            path: 'users',
            element: (
              <RequirePermission permissions={['user:manage']}>
                <UsersAdmin />
              </RequirePermission>
            ),
          },
        ],
      },
      { path: '*', element: <NotFound /> },
    ],
  },
]);
