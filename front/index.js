/* ================================================
   상욕순화기 · index.js
   index.html 메인 화면 전용 스크립트

   담당 기능
   1. 글자 수 카운팅 및 300자 입력 제한
   2. 말투 모드 칩 활성화 및 상태 토글
   3. "순화하기" 클릭 시 로딩 화면(loading.html)으로 상태 전송 및 화면 전환
   4. "변환 이력" 아이콘 클릭 시 이력 관리(history.html)로 이동 연동
   ================================================ */

'use strict';

document.addEventListener('DOMContentLoaded', () => {

  /* ── DOM 요소 참조 ── */
  const textarea = document.querySelector('.sok-field');
  const charCounter = document.querySelector('.sok-charcount');
  const ctaBtn = document.querySelector('.sok-cta');
  const historyBtn = document.querySelector('.sok-iconbtn[title="변환 이력"]');

  const MAX_CHARS = 300;

  /* ── 1. 글자 수 제한 및 실시간 카운팅 ── */
  if (textarea && charCounter) {
    textarea.addEventListener('input', () => {
      let val = textarea.value;
      if (val.length > MAX_CHARS) {
        val = val.substring(0, MAX_CHARS);
        textarea.value = val;
      }
      charCounter.textContent = `${val.length} / ${MAX_CHARS}`;
    });
  }

  /* ── 2. 말투 모드 칩스 초기화 ── */
  // 기본 모드는 선비(scholar)로 활성화
  setActiveChip('.sok-chips', 'scholar');
  initChips('.sok-chips', (mode) => {
    console.log(`[index] 말투 선택 변경: ${mode}`);
  });

  /* ── 3. 순화하기 클릭 시 로딩 플로우 연동 ── */
  if (ctaBtn) {
    ctaBtn.addEventListener('click', () => {
      const originalText = textarea?.value.trim();
      const selectedMode = getActiveMode('.sok-chips');

      // 무결성 검증
      if (!originalText) {
        showToast('문장을 입력해 주세요.', 'err');
        return;
      }

      // 로딩 페이지로 보낼 파라미터를 세션 스토리지에 세팅
      Store.set('pendingConvert', {
        text: originalText,
        mode: selectedMode
      });

      // 시안에 맞춰 02 로딩 화면(loading.html)으로 즉시 전환
      window.location.href = 'loading.html';
    });
  }

  /* ── 4. 변환 이력 페이지 바로가기 연동 ── */
  if (historyBtn) {
    historyBtn.addEventListener('click', () => {
      window.location.href = 'history.html';
    });
  }

});
