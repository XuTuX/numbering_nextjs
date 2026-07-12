# NUMBERING

숫자와 수식을 활용한 웹 퍼즐 게임 모음입니다.

## 실행

```bash
npm install
npm run dev
```

개발 서버는 [http://localhost:3001](http://localhost:3001)에서 실행됩니다.

## 게임 모드

- **수식 공방**: 주어진 숫자 순서를 유지하며 연산자와 괄호를 배치해 등식을 완성합니다.
- **수열 탐정**: 피보나치 방식으로 이어지는 수열의 마지막 값에서 첫 두 수를 추리합니다.
- **숫자 금고**: 숫자 순서를 자유롭게 바꾸고 연산자를 배치해 목표 값을 만듭니다.

세 게임 모두 `혼자 하기`와 `함께 하기`를 지원합니다. 솔로 게임은 선택 즉시 시작되며 라운드가 올라갈수록 난이도가 자동으로 상승합니다. 멀티플레이는 같은 문제로 3라운드를 진행하며 EASY, NORMAL, HARD 순서로 어려워집니다.

## 프로젝트 구조

```text
src/
├── app/                         # Next.js 라우트와 전역 스타일
├── components/
│   ├── game/                    # 여러 게임이 공유하는 편집 UI
│   └── home/                    # 홈 화면 공용 UI
├── features/
│   ├── formula-workshop/        # 수식 공방
│   ├── multiplayer/             # 멀티플레이와 Socket.IO 클라이언트
│   ├── number-vault/            # 숫자 금고
│   └── sequence-detective/      # 수열 탐정
└── lib/equation/                # 수식 파싱·검증·편집 공용 로직
```

`app`의 페이지는 라우팅만 담당합니다. 게임별 화면과 상태, 문제 생성기는 해당 `features` 폴더 안에 두고, 두 게임 이상에서 사용하는 코드만 `components` 또는 `lib`에 둡니다.

## 검사

```bash
npm run lint
npm run build
```
