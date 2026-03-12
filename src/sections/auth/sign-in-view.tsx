import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { useMember } from 'src/hooks/member';

import Auth from 'src/api/auth';
import Part from 'src/abc/part';
import Grade from 'src/api/grade';
import Member from 'src/api/member';
import { APIError } from 'src/abc/api-error';

// ----------------------------------------------------------------------

export function SignInView() {
  const router = useRouter();

  const [authURL, setAuthURL] = useState<string>();
  const [error, setError] = useState(false);

  // UI切り替え用
  const [showEmailLogin, setShowEmailLogin] = useState(false);

  // メールログイン用のstate
  const [grades, setGrades] = useState<Grade[]>([]);
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null);
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  const [email, setEmail] = useState('');
  const [isEmailLoginLoading, setIsEmailLoginLoading] = useState(false);

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
          setSearchParams(new URLSearchParams());
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
        const m = await Member.getSelf({ includeGroups: true, includeStatusPeriods: true, includeRoles: true });
        setMember(m);
        const savedRedirect = localStorage.getItem('auth_redirect');
        localStorage.removeItem('auth_redirect');
        router.replace(savedRedirect || '/');
        return; // 以降の処理をスキップ
      } catch (_e) {
        /* empty */
      }

      // 学年情報を取得
      try {
        const gradeList = await Grade.get();
        setGrades(gradeList);
      } catch (e) {
        toast.error('学年情報の取得に失敗しました');
      }

      try {
        const { url } = await Auth.getAuthorizationURL();
        setAuthURL(url);
      } catch (e) {
        toast.error(APIError.createToastMessage(e));
        setError(true);
        setAuthURL('');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, searchParams, setMember, setSearchParams]);

  const handleEmailLogin = async () => {
    if (!selectedGrade || !selectedPart || !email) {
      toast.error('すべての項目を入力してください');
      return;
    }

    setIsEmailLoginLoading(true);
    try {
      const m = await Auth.fromEmail(selectedGrade, selectedPart, email);
      setMember(m);

      const savedRedirect = localStorage.getItem('auth_redirect');
      localStorage.removeItem('auth_redirect');
      router.replace(savedRedirect || '/');
    } catch (e) {
      if (e instanceof APIError && e.code.code === 101) {
        toast.error("学年またはパートまたはメールアドレスが間違っています");
        return;
      }

      toast.error(APIError.createToastMessage(e));
    } finally {
      setIsEmailLoginLoading(false);
    }
  };

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
        {!showEmailLogin ? (
          <Typography variant="body2">
            下のボタンを押して、学校アカウントでログインしてください。
          </Typography>
        ) : (
          <Typography variant="body2">
            学年・パート・学校のメールアドレスを入力してログインしてください。
          </Typography>
        )}
      </Box>

      {!showEmailLogin ? (
        <>
          <Button
            fullWidth
            size="large"
            type="submit"
            color="inherit"
            variant="contained"
            startIcon={
              <img src="assets/icons/google_favicon.svg" alt="Google Favicon" width="16px" />
            }
            component={RouterLink}
            href={authURL}
            loading={!authURL && !error}
            disabled={error}
          >
            Googleでログイン
          </Button>

          <Link
            underline="hover"
            variant="body2"
            onClick={() => setShowEmailLogin(true)}
            sx={{ mt: 1, cursor: 'pointer' }}
          >
            権限なしでログインできない場合
          </Link>
        </>
      ) : (
        <Stack spacing={2}>
          <TextField
            select
            fullWidth
            label="学年"
            value={selectedGrade?.name || ''}
            onChange={(e) => {
              const grade = grades.find((g) => g.name === e.target.value);
              setSelectedGrade(grade || null);
            }}
          >
            {grades.map((grade) => (
              <MenuItem key={grade.name} value={grade.name}>
                {grade.displayName}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            fullWidth
            label="パート"
            value={selectedPart?.value || ''}
            onChange={(e) => {
              const part = Part.SELECTS.find((p) => p.value === e.target.value);
              setSelectedPart(part || null);
            }}
          >
            {Part.COMMON.map((part) => (
              <MenuItem key={part.value} value={part.value}>
                {part.enShort}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            fullWidth
            label="学校のメールアドレス"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@example.com"
          />

          <Button
            fullWidth
            size="large"
            variant="contained"
            color="inherit"
            onClick={handleEmailLogin}
            disabled={!selectedGrade || !selectedPart || !email || isEmailLoginLoading}
            loading={isEmailLoginLoading}
          >
            ログイン
          </Button>

          <Button
            fullWidth
            size="large"
            variant="outlined"
            color="inherit"
            onClick={() => setShowEmailLogin(false)}
          >
            戻る
          </Button>
        </Stack>
      )}
    </>
  );
}
