# articles

KRX FnGuide 컨센서스 데이터를 Supabase에서 조회해 현재가 대비 적정주가 괴리율 랭킹을 보여주는 Vite React 앱입니다.

## 환경변수

Vite 앱은 다음 환경변수를 사용합니다.

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

로컬에서는 `.env.local`에 Supabase 값을 넣고 Vite 환경변수에 바인딩합니다. `.env.local`은 Git에 커밋하지 않습니다.

```env
SUPABASE_URL=https://example.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx

VITE_SUPABASE_URL=$SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY=$SUPABASE_PUBLISHABLE_KEY
```

GitHub Pages 배포 환경에서는 GitHub secrets 또는 variables를 통해 `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` 값을 제공합니다.

## 개발

```bash
npm install
npm run dev
```

## 테스트

```bash
npm test
```

## 빌드

```bash
npm run build
```

Vite base는 `/articles/`로 설정되어 GitHub Pages의 `/articles/` 경로에서 asset이 정상적으로 로드됩니다.
