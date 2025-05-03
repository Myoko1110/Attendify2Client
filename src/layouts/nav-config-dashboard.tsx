import { SvgColor } from 'src/components/svg-color';

import { Iconify } from '../components/iconify';

// ----------------------------------------------------------------------

const icon = (name: string) => <SvgColor src={`/assets/icons/navbar/${name}.svg`} />;

export type NavItem = {
  title: string;
  path: string;
  icon: React.ReactNode;
  info?: React.ReactNode;
};

export const navData = [
  {
    title: '出欠',
    path: '/',
    icon: <Iconify icon="solar:clipboard-check-bold" />,
  },
  {
    title: '入力',
    path: '/input',
    icon: <Iconify icon="solar:password-minimalistic-input-bold" />,
  },
  {
    title: '部員',
    path: '/member',
    icon: <Iconify icon="solar:user-bold" />,
  },
  {
    title: '予定',
    path: '/schedule',
    icon: <Iconify icon="solar:calendar-bold" />,
  },
  // {
  //   title: '設定',
  //   path: '/settings',
  //   icon: <Iconify icon="solar:settings-bold" />,
  // }
];
