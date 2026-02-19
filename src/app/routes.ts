import { createBrowserRouter } from 'react-router';
import { Layout } from './components/Layout';
import { NewJob } from './pages/NewJob';
import { JobDetail } from './pages/JobDetail';
import { History } from './pages/History';
import { Settings } from './pages/Settings';
import { Developer } from './pages/Developer';
import { Help } from './pages/Help';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, Component: History },
      { path: 'jobs/new', Component: NewJob },
      { path: 'jobs/:id', Component: JobDetail },
      { path: 'history', Component: History },
      { path: 'settings', Component: Settings },
      { path: 'help', Component: Help },
      { path: 'developer', Component: Developer },
    ],
  },
]);
