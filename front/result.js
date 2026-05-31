/* ================================================
   상욕순화기 · result.js
   result.html 결과 화면 전용 스크립트

   담당 기능
   1. Store에서 convertResult 추출 및 렌더링
   2. 원문 및 순화 결과 텍스트 바인딩
   3. 심각도 배지 및 모드 텍스트 적용
   4. 복사 버튼 기능 연동 (성공 토스트 포함)
   5. 다시 변환 및 뒤로가기 제어
   ================================================ */

'use strict';

document.addEventListener('DOMContentLoaded', () => {

  /* ── 세션에서 변환 결과 로드 ── */
  const result = Store.get('convertResult');

  // 결과 데이터가 없으면 다시 메인으로 튕겨냄 (보안/예외 처리)
  if (!result) {
    window.location.href = 'index.html';
    return;
  }

  /* ── DOM 요소 참조 ── */
  const sevBadge = document.querySelector('.sok-badge.sev');
  const modeBadge = document.querySelector('.sok-badge.mode');
  const origEl = document.querySelector('.sok-orig');
  const resultEl = document.querySelector('.sok-result');

  const backBtn = document.querySelector('.sok-iconbtn[title="뒤로"]');
  const copyBtn = document.getElementById('copyBtn');
  const memeBtn = document.getElementById('memeBtn');
  const retryBtn = document.getElementById('retryBtn');

  /* ── 1. 데이터 동적 렌더링 ── */
  // 심각도 점수 적용 및 색상 맵핑
  if (sevBadge) {
    applySevClass(sevBadge, result.severity_score ?? 1);
  }

  // 모드 배지
  if (modeBadge) {
    modeBadge.textContent = modeLabel(result.mode);
  }

  // 원문 바인딩
  if (origEl) {
    origEl.innerHTML = `<span class="lab">원문</span>${escHtml(result.original_text)}`;
  }

  // 순화 결과 바인딩
  if (resultEl) {
    resultEl.textContent = result.purified_text;
  }

  /* ── 2. 복사 버튼 기능 연동 ── */
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      const success = await copyToClipboard(result.purified_text);
      if (success) {
        showToast('복사했어요', 'ok');
      } else {
        showToast('복사에 실패했습니다.', 'err');
      }
    });
  }

  /* ── 3. 짤 저장 기능 (준비 중 예외 처리) ── */
  if (memeBtn) {
    memeBtn.addEventListener('click', () => {
      showToast('짤 저장 기능은 준비 중이에요!', 'ok');
    });
  }

  /* ── 4. 다시 변환 버튼 ── */
  if (retryBtn) {
    retryBtn.addEventListener('click', () => {
      Store.remove('convertResult');
      window.location.href = 'index.html';
    });
  }

  /* ── 5. 뒤로가기 버튼 ── */
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      Store.remove('convertResult');
      window.location.href = 'index.html';
    });
  }

});
