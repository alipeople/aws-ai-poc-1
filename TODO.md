# TODO

## 개인화 변수 추천 → WHO/WHEN 페이지로 이동

- 현재 옵션형 메시지 생성 결과에서 `PersonalizationVars` 컴포넌트 제거됨
- **향후 발송 대상(WHO) / 발송 시간(WHEN)** 설정 페이지를 구현할 때, 해당 페이지에서 개인화 변수 추천 기능을 포함할 것
- 관련 컴포넌트: `fe/src/components/ai-message/option/PersonalizationVars.tsx` (코드 잔존, 재사용 가능)
- Mock API: `api.mockData.getPersonalizationVars()` (유지 중)

## 발송 피로도 경고 → WHO 페이지로 이동

- 현재 옵션형 메시지 생성 결과에서 `FatigueAlert` 컴포넌트 제거됨
- **향후 발송 대상(WHO)** 설정 페이지를 구현할 때, 수신자 피로도 경고 기능을 포함할 것
- 관련 컴포넌트: `fe/src/components/ai-message/option/FatigueAlert.tsx` (코드 잔존, 재사용 가능)
- Mock API: `api.mockData.getFatigueAnalysis()` (유지 중)
