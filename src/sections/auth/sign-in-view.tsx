import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { useMember } from 'src/hooks/member';

import Auth from 'src/api/auth';
import Member from 'src/api/member';
import { APIError } from 'src/abc/api-error';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function SignInView() {
  const router = useRouter();

  const [authURL, setAuthURL] = useState<string>();
  const [error, setError] = useState(false);

  const { member, setMember } = useMember();

  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    (async () => {
      const state = searchParams.get('state');
      const code = searchParams.get('code');

      // すでにログイン済みなら
      if (member) {
        router.replace('/');
      }

      // 認証コードがあったら
      if (state && code) {
        try {
          const m = await Auth.login(code, state);
          setMember(m);

          router.replace('/');

        } catch (e) {
          toast.error(APIError.createToastMessage(e));
          setSearchParams(new URLSearchParams())
        }
      }

      // cookieに認証情報があったら
      try {
        const m = await Member.getSelf();
        setMember(m);
        router.replace('/');
      } catch (_e) {
        /* empty */
      }

      try {
        const { url } = await Auth.getAuthorizationURL();
        setAuthURL(url);
      } catch (e) {
        toast.error(APIError.createToastMessage(e));
        setError(true);
        setAuthURL("");
      }
    })();
  }, [router, searchParams, setMember, setSearchParams]);

  return (
    <>
      <Box
        sx={{
          gap: 1.5,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          mb: 5,
        }}
      >
        <Typography variant="h5">ログイン</Typography>
      </Box>
      <Button
        fullWidth
        size="large"
        type="submit"
        color="inherit"
        variant="contained"
        startIcon={<Iconify icon="logos:google-icon" />}
        component={RouterLink}
        href={authURL}
        loading={!authURL && !error}
        disabled={error}
      >
        Googleアカウントでログイン
      </Button>
    </>
  );
}
