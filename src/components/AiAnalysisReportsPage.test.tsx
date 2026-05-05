import { render, screen } from '@testing-library/react';
import { AiAnalysisReportsPage } from './AiAnalysisReportsPage';

describe('AiAnalysisReportsPage', () => {
  it('renders a ready empty state for the new finance route', () => {
    render(<AiAnalysisReportsPage />);

    expect(screen.getByRole('heading', { name: 'AI 분석 리포트' })).toBeInTheDocument();
    expect(screen.getByText('자동 분석 요약')).toBeInTheDocument();
    expect(screen.getByText('표시할 AI 분석 리포트가 없습니다.')).toBeInTheDocument();
    expect(screen.getByText('AI 분석 리포트 데이터 모델과 조회 방식은 별도 구현에서 연결합니다.')).toBeInTheDocument();
  });
});
