import 'src/global.css';

import axios from 'axios';
import humps from 'humps';
import { useEffect } from 'react';

import { usePathname } from 'src/routes/hooks';

import { ThemeProvider } from 'src/theme/theme-provider';

import { GradeProvider } from './hooks/grade';
import { MemberProvider } from './hooks/member';
import { SonnerToaster } from './components/toaster/toaster';

// ----------------------------------------------------------------------

type AppProps = {
  children: React.ReactNode;
};

export default function App({ children }: AppProps) {
  useScrollToTop();

  axios.defaults.baseURL = import.meta.env.VITE_BACKEND_URL;
  axios.defaults.headers.post['content-type'] = 'application/x-www-form-urlencoded';
  axios.defaults.withCredentials = true;

  axios.interceptors.request.use((req) => {
    req.data = humps.decamelizeKeys(req.data);
    return req;
  });
  axios.interceptors.response.use((res) => {
    if (res.headers['content-type'] === 'application/json') res.data = humps.camelizeKeys(res.data);
    return res;
  });

  return (
    <ThemeProvider>
      <MemberProvider>
        <GradeProvider>
          {children}
        </GradeProvider>
      </MemberProvider>
      <SonnerToaster />
    </ThemeProvider>
  );
}

// ----------------------------------------------------------------------

function useScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
