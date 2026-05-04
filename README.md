# articles

KRX FnGuide 컨센서스 데이터를 Supabase에서 조회해 현재가 대비 적정주가 괴리율 랭킹을 보여주는 Vite React 앱입니다.

## 환경변수

Vite 앱은 다음 환경변수를 사용합니다.

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

GitHub Pages 배포 환경에서는 GitHub variables 또는 secrets를 통해 위 값을 제공해야 합니다.

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
