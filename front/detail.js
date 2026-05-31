/* ================================================
   상욕순화기 · detail_page.js
   detail.html 전용 스크립트

   담당 기능
   1. Store에서 editRecord 읽어 화면 렌더링
   2. 모드 칩 클릭 → 레이블 즉시 업데이트
   3. 재순화 버튼
      - 원문만 변경  → PUT  /api/records/{id}/
      - 모드만 변경  → PATCH /api/records/{id}/
      - 둘 다 변경   → PUT  /api/records/{id}/
      - 변경 없음    → 토스트 안내
   4. 뒤로 버튼 → history.html

   더미 → 실제 API 전환 방법
   - USE_DUMMY = false 로 변경
   ================================================ */

'use strict';

/* ── 실제 API 전환 플래그 ── */
const USE_DUMMY = false; // false 로 바꾸면 실제 API 호출


document.addEventListener('DOMContentLoaded', () => {

  /* ── editRecord 로드 ── */
  const record = Store.get('editRecord');

  // 데이터 없이 직접 접근한 경우 → 이력으로 복귀
  if (!record) {
    window.location.href = 'history.html';
    return;
  }

  /* ── 요소 참조 ── */
  const sevBadge    = document.getElementById('sevBadge');
  const editedBadge = document.getElementById('editedBadge');
  const textarea    = document.getElementById('inputText');
  const resultEl    = document.getElementById('resultBox');
  const chipsEl     = document.querySelector('.sok-chips');
  const retryBtn    = document.getElementById('btnRetry');
  const backBtn     = document.getElementById('btnBack');

  const RETRY_DEFAULT_HTML = `
    <svg class="ic" viewBox="0 0 24 24">
      <path d="M21 12a9 9 0 1 1-3-6.7"/>
      <path d="M21 3v5h-5"/>
    </svg>재순화`;

  /* ── 초기 렌더링 ── */
  renderDetail(record);

  /* ── 모드 칩 초기화 및 변경 이벤트 ── */
  // data-mode 속성으로 현재 모드 칩 활성화
  setActiveChip('.sok-chips', record.mode);

  initChips('.sok-chips', (mode) => {
    // 칩 클릭 시 결과 레이블만 즉시 업데이트 (재순화 전 미리보기)
    updateResultLabel(mode);
  });

  /* ── 재순화 버튼 ── */
  if (retryBtn) {
    retryBtn.addEventListener('click', async () => {
      const newText = textarea?.value.trim();
      const newMode = getActiveMode('.sok-chips');

      if (!newText) {
        showToast('원문을 입력해 주세요.', 'err');
        return;
      }

      const textChanged = newText !== record.original_text;
      const modeChanged = newMode !== record.mode;

      // 변경 없음
      if (!textChanged && !modeChanged) {
        showToast('변경된 내용이 없어요.', 'err');
        return;
      }

      setCtaLoading(retryBtn, true, RETRY_DEFAULT_HTML);

      if (USE_DUMMY) {
        // 더미: 실제 API 없이 Store 값만 업데이트 후 이동
        setTimeout(() => {
          const fakeResult = {
            ...record,
            original_text: newText,
            mode: newMode,
            purified_text: `[더미] ${newText} → ${modeLabel(newMode)} 버전`,
            updated_at: new Date().toISOString(),
          };
          Store.set('editRecord', fakeResult);
          Store.remove('editRecord');
          showToast('재순화 완료!', 'ok', 1400);
          setTimeout(() => { window.location.href = 'history.html'; }, 1500);
        }, 800); // 로딩감 연출

      } else {
        // 실제 API
        try {
          let updated;

          if (textChanged) {
            // 원문 변경 (모드 동시 변경 포함) → PUT 전체 교체
            updated = await API.update(record.id, newText, newMode);
          } else {
            // 모드만 변경 → PATCH 부분 수정
            updated = await API.patch(record.id, { original_text: newText, mode: newMode });
          }

          Store.remove('editRecord');
          showToast('재순화 완료!', 'ok', 1400);
          setTimeout(() => { window.location.href = 'history.html'; }, 1500);

        } catch (err) {
          console.error('[detail] update error:', err);
          setCtaLoading(retryBtn, false, RETRY_DEFAULT_HTML);
          showToast(err.message || '재순화에 실패했어요.', 'err');
        }
      }
    });
  }

  /* ── 뒤로 버튼 ── */
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      Store.remove('editRecord');
      window.location.href = 'history.html';
    });
  }


  /* ── 내부 헬퍼 ── */

  /** record 데이터로 화면 전체 렌더링 */
  function renderDetail(rec) {
    // 심각도 배지 — common.js의 applySevClass 공통 함수 사용
    applySevClass(sevBadge, rec.severity_score ?? 0);

    // 수정됨 배지 (updated_at 있을 때만)
    const isEdited = rec.updated_at && rec.created_at !== rec.updated_at;
    if (editedBadge) {
      editedBadge.style.display = isEdited ? '' : 'none';
      if (isEdited) {
        const d  = new Date(rec.updated_at);
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        editedBadge.textContent = `수정됨 · ${hh}:${mm}`;
      }
    }

    // 원문 textarea
    if (textarea) textarea.value = rec.original_text;

    // 순화 결과
    if (resultEl) resultEl.textContent = rec.purified_text;

    // 결과 레이블
    updateResultLabel(rec.mode);
  }

  /** "현재 순화 결과 · {모드}" 레이블 업데이트 */
  function updateResultLabel(mode) {
    const label = document.getElementById('resultLabel');
    if (label) label.textContent = `현재 순화 결과 · ${modeLabel(mode)}`;
  }

});