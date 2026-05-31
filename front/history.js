/* ================================================
   상욕순화기 · history_page.js
   history.html 전용 스크립트

   담당 기능
   1. 뒤로가기(홈 버튼) → index.html
   2. 리스트 행 클릭 → editRecord 저장 후 detail.html 이동
   3. segpill 필터링 (전체 / 선비 / 어쩔티비 / 면접 …)
   4. 정렬 토글 (최신순 ↔ 오래된 순)
   5. 휴지통 클릭 → 삭제 모달 표시
   6. 모달 확인 → 더미 삭제 / 실제 API 삭제 분기

   더미 → 실제 API 전환 방법
   - USE_DUMMY = false 로 바꾸면 API.delete() 호출로 자동 전환
   - 실제 목록 로드도 loadFromAPI() 주석 해제로 전환 가능
   ================================================ */

'use strict';

/* ── 더미 데이터 (실험용) ──────────────────────────── */
const DUMMY_RECORDS = [
  {
    id: 1,
    original_text: '아 ㅈㄴ 어이없네 진짜',
    purified_text: '허, 이는 참으로 어처구니없는 일이로다.',
    mode: 'scholar',
    severity_score: 8,
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),   // 30분 전

    /* 해당 부분 API 지침서에 존재하지 않아 확인 필요(화면의 '수정됨' 태그)------------------- */
    updated_at: new Date(Date.now() - 1000 * 60 * 10).toISOString(),   // 10분 전 (수정됨)
    /* 해당 부분 API 지침서에 존재하지 않아 확인 필요(화면의 '수정됨' 태그)------------------- */
  },
  {
    id: 2,
    original_text: '개빡치네 진짜',
    purified_text: '지금 상황이 많이 답답하네요.',
    mode: 'interview',
    severity_score: 7,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 27).toISOString(), // 어제
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 27).toISOString(),
  },
  {
    id: 3,
    original_text: '장난하냐?',
    purified_text: '어쩔ㅋㅋ 지금 농담하는 거?',
    mode: 'trend',
    severity_score: 3,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), // 3일 전
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
  },
  {
    id: 4,
    original_text: '진짜 너무하는 거 아니야?',
    purified_text: '뿌잉~ 너무해뿌잉 흑흑 이건 좀 심한 거 아니에용~?',
    mode: 'cute',
    severity_score: 5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(), // 4일 전
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
  },
];

/* ── 실제 API 전환 플래그 ── */
const USE_DUMMY = false; // false 로 바꾸면 실제 API 호출


/* ── 상태 ──────────────────────────────────────────── */
let allRecords     = [];   // 원본 전체 데이터 (필터/정렬은 이 배열 기준)
let currentMode    = '';   // '' = 전체
let currentSort    = 'newest'; // 'newest' | 'oldest'
let pendingDeleteId = null;


/* ── DOMContentLoaded ──────────────────────────────── */
document.addEventListener('DOMContentLoaded', async () => {

  /* 요소 참조 */
  const backBtn     = document.querySelector('.sok-iconbtn[title="홈"]');
  const filterEl    = document.querySelector('.history-filter');
  const sortBtn     = document.querySelector('.sok-sortbtn');
  const deleteModal = document.getElementById('deleteModal');
  const cancelBtn   = deleteModal?.querySelector('.sok-btn');
  const confirmBtn  = deleteModal?.querySelector('.sok-danger-btn');

  /* ── 1. 뒤로가기 ── */
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      window.location.href = 'index.html';
    });
  }

  /* ── 3. segpill 필터 ── */
  if (filterEl) {
    filterEl.querySelectorAll('.sok-segpill').forEach(pill => {
      pill.addEventListener('click', () => {
        // 활성 스타일 교체
        filterEl.querySelectorAll('.sok-segpill').forEach(p => p.classList.remove('on'));
        pill.classList.add('on');

        // data-mode 없는 "전체" 칩은 '' 처리
        currentMode = pill.dataset.mode ?? '';
        renderList();
      });
    });
  }

  /* ── 4. 정렬 토글 ── */
  if (sortBtn) {
    sortBtn.addEventListener('click', () => {
      if (currentSort === 'newest') {
        currentSort = 'oldest';
        sortBtn.innerHTML = `
          <svg class="ic" viewBox="0 0 24 24">
            <path d="M7 4v16"/><path d="m3 8 4-4 4 4"/>
            <path d="M17 20V4"/><path d="m21 16-4 4-4-4"/>
          </svg>오래된 순`;
      } else {
        currentSort = 'newest';
        sortBtn.innerHTML = `
          <svg class="ic" viewBox="0 0 24 24">
            <path d="M7 4v16"/><path d="m3 8 4-4 4 4"/>
            <path d="M17 20V4"/><path d="m21 16-4 4-4-4"/>
          </svg>최신순`;
      }
      renderList();
    });
  }

  /* ── 5. 삭제 모달 — 취소/스크림 클릭 ── */
  if (cancelBtn) {
    cancelBtn.addEventListener('click', closeDeleteModal);
  }
  if (deleteModal) {
    deleteModal.addEventListener('click', (e) => {
      if (e.target === deleteModal) closeDeleteModal();
    });
  }

  /* ── 5. 삭제 모달 — 확인 버튼 ── */
  if (confirmBtn) {
    confirmBtn.addEventListener('click', async () => {
      if (pendingDeleteId === null) return;
      const id = pendingDeleteId;
      closeDeleteModal();

      if (USE_DUMMY) {
        // 더미: 로컬 배열에서만 제거
        allRecords = allRecords.filter(r => r.id !== id);
        renderList();
        showToast('삭제했어요.', 'ok');
      } else {
        // 실제 API: DELETE /api/records/{id}/
        try {
          await API.delete(id);
          allRecords = allRecords.filter(r => r.id !== id);
          renderList();
          showToast('삭제했어요.', 'ok');
        } catch (err) {
          showToast(err.message || '삭제에 실패했어요.', 'err');
        }
      }
    });
  }

  /* ── 초기 데이터 로드 ── */
  await loadRecords();
});


/* ── 데이터 로드 ────────────────────────────────────── */
async function loadRecords() {
  if (USE_DUMMY) {
    // 더미 데이터 사용
    allRecords = [...DUMMY_RECORDS];
    renderList();
  } else {
    // 실제 API: GET /api/records/
    // 정렬/필터는 클라이언트에서 처리 (또는 파라미터로 서버에 위임 가능)
    renderSkeleton();
    try {
      const data = await API.list({ sort: '-created_at' });
      allRecords = data.results ?? [];
      renderList();
    } catch (err) {
      showToast(err.message || '이력을 불러오지 못했어요.', 'err');
      renderEmpty();
    }
  }
}


/* ── 필터 + 정렬 적용 후 렌더링 ────────────────────── */
function renderList() {
  const listEl = document.querySelector('.history-list');
  if (!listEl) return;

  // 필터: currentMode가 있으면 해당 모드만, 없으면 전체
  let filtered = currentMode
    ? allRecords.filter(r => r.mode === currentMode)
    : [...allRecords];

  // 정렬: 최신순 / 오래된 순
  filtered.sort((a, b) => {
    const diff = new Date(a.created_at) - new Date(b.created_at);
    return currentSort === 'newest' ? -diff : diff;
  });

  if (filtered.length === 0) {
    renderEmpty();
    return;
  }

  listEl.innerHTML = filtered.map(r => {
    const dateStr  = formatDate(r.created_at);
    // updated_at이 있고 created_at과 다를 때만 "수정됨" 표시
    const isEdited = r.updated_at && r.created_at !== r.updated_at;
    const sev      = r.severity_score ?? 0;
    const sevClass = sev <= 3 ? 'low' : sev <= 6 ? 'mid' : '';

    return `
      <div class="sok-hrow" data-id="${r.id}" style="cursor:pointer">
        <div class="meta">
          <span class="date">${dateStr}</span>
          <div class="hrow-actions">
            ${isEdited
              ? '<span class="sok-badge edited history-badge-sm">수정됨</span>'
              : ''}
            <span class="sok-badge sev ${sevClass} history-badge-sm">
              심각도 <span class="n">${sev}</span>
            </span>
            <span class="sok-badge mode alt history-badge-sm">
              ${modeLabel(r.mode)}
            </span>
            <button class="sok-trash" title="삭제" data-delete-id="${r.id}">
              <svg class="ic" viewBox="0 0 24 24">
                <path d="M3 6h18"/>
                <path d="M8 6V4h8v2"/>
                <path d="M6 6l1 14h10l1-14"/>
              </svg>
            </button>
          </div>
        </div>
        <div class="orig">${escHtml(r.original_text)}</div>
        <div class="res">${escHtml(r.purified_text)}</div>
      </div>`;
  }).join('');

  /* ── 2. 행 클릭 → detail.html ── */
  listEl.querySelectorAll('.sok-hrow').forEach(row => {
    row.addEventListener('click', (e) => {
      // 휴지통 버튼 클릭은 제외
      if (e.target.closest('.sok-trash')) return;

      const record = allRecords.find(r => String(r.id) === row.dataset.id);
      if (record) {
        Store.set('editRecord', record);
        window.location.href = 'detail.html';
      }
    });
  });

  /* ── 5. 휴지통 버튼 → 삭제 모달 ── */
  listEl.querySelectorAll('.sok-trash').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation(); // 행 클릭 이벤트 전파 차단
      openDeleteModal(Number(btn.dataset.deleteId));
    });
  });
}


/* ── 빈 상태 ── */
function renderEmpty() {
  const listEl = document.querySelector('.history-list');
  if (!listEl) return;
  listEl.innerHTML = `
    <div class="sok-empty">
      <h3>아직 변환한 문장이 없어요</h3>
      <p>거친 말을 입력하고 순화해 보세요.</p>
    </div>`;
}

/* ── 스켈레톤 (실제 API 로딩 중) ── */
function renderSkeleton() {
  const listEl = document.querySelector('.history-list');
  if (!listEl) return;
  listEl.innerHTML = Array(3).fill(`
    <div class="sok-hrow">
      <div class="sok-skel" style="height:13px;width:100px;margin-bottom:10px"></div>
      <div class="sok-skel" style="height:13px;width:75%;margin-bottom:8px"></div>
      <div class="sok-skel" style="height:17px;width:90%"></div>
    </div>`).join('');
}


/* ── 삭제 모달 열기/닫기 ── */
function openDeleteModal(id) {
  pendingDeleteId = id;
  const modal = document.getElementById('deleteModal');
  if (modal) modal.style.display = 'flex';
}

function closeDeleteModal() {
  pendingDeleteId = null;
  const modal = document.getElementById('deleteModal');
  if (modal) modal.style.display = 'none';
}


/* ── 날짜 포맷 ── */
function formatDate(isoStr) {
  const d      = new Date(isoStr);
  const now    = new Date();
  const diff   = now - d;
  const oneDay = 86400000;
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');

  if (diff < oneDay && d.getDate() === now.getDate()) return `오늘 ${hh}:${mm}`;
  if (diff < oneDay * 2)                              return `어제 ${hh}:${mm}`;

  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${mo}.${dd}`;
}