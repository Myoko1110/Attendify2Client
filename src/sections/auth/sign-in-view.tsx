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
      const redirect = searchParams.get('redirect');

      // リダイレクト先をlocalStorageに保存
      if (redirect && !state && !code) {
        localStorage.setItem('auth_redirect', redirect);
      }

      // 認証コードがあったら（OAuth2からのリダイレクト）
      if (state && code) {
        try {
          const m = await Auth.login(code, state);
          setMember(m);

          // 保存されたリダイレクト先に遷移
          const savedRedirect = localStorage.getItem('auth_redirect');
          localStorage.removeItem('auth_redirect');
          router.replace(savedRedirect || '/');
          return; // 以降の処理をスキップ

        } catch (e) {
          toast.error(APIError.createToastMessage(e));
          setSearchParams(new URLSearchParams())
        }
      }

      // すでにログイン済みなら
      if (member) {
        const savedRedirect = localStorage.getItem('auth_redirect');
        localStorage.removeItem('auth_redirect');
        router.replace(savedRedirect || '/');
        return; // 以降の処理をスキップ
      }

      // cookieに認証情報があったら
      try {
        const m = await Member.getSelf({ includeGroups: true });
        setMember(m);
        const savedRedirect = localStorage.getItem('auth_redirect');
        localStorage.removeItem('auth_redirect');
        router.replace(savedRedirect || '/');
        return; // 以降の処理をスキップ
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, searchParams, setMember, setSearchParams]);

  return (
    <>
      <Box
        sx={{
          gap: 1.5,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'start',
          mb: 5,
        }}
      >
        <Typography variant="h4">ログイン</Typography>
        <Typography variant="body2">下のボタンを押して、学校アカウントでログインしてください。</Typography>
      </Box>
      <Button
        fullWidth
        size="large"
        type="submit"
        color="inherit"
        variant="contained"
        startIcon={<img src="assets/icons/google_favicon.svg" alt="Google Favicon" width="16px" />}
        component={RouterLink}
        href={authURL}
        loading={!authURL && !error}
        disabled={error}
      >
        Googleでログイン
      </Button>
    </>
  );
}
