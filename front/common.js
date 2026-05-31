/* ================================================
   상욕순화기 · common.js
   공통 유틸리티: API 통신 · 토스트 · 모드 칩 · 클립보드
   ================================================
   수정 이력
   - CORS/네트워크 에러 전용 catch 추가 (apiFetch)
   - API.patch() 메서드 추가
   - API.list() 응답의 count 필드 활용 가능하도록 반환 구조 유지
   ================================================ */

'use strict';

/* ── 1. API 기본 설정 ── */
const API_BASE = '/api';

/**
 * 공통 fetch 래퍼
 * - credentials: 'include' → Django 세션 쿠키 자동 포함
 * - CSRF 토큰 자동 삽입 (POST/PUT/PATCH/DELETE)
 * - CORS/네트워크 단절은 fetch 자체가 TypeError로 throw되므로 별도 catch
 */
async function apiFetch(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const headers = { 'Content-Type': 'application/json', ...options.headers };

  // CSRF 토큰 (Django)
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const csrfToken = getCookie('csrftoken');
    if (csrfToken) headers['X-CSRFToken'] = csrfToken;
  }

  // CORS/네트워크 오류: fetch 자체가 TypeError를 throw — res.ok와 별개로 처리 필요
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    method,
    headers,
    credentials: 'include', // 명세서: 쿠키/세션 기반 인증을 위해 필수
  }).catch(err => {
    console.error('[Network/CORS Error]', err);
    throw new Error('네트워크 오류가 발생했어요. 잠시 후 다시 시도해 주세요.');
  });

  // 204 No Content — DELETE 성공 응답, body 없음
  if (res.status === 204) return null;

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const err = new Error(data?.detail || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

/** Django CSRF 쿠키 파싱 */
function getCookie(name) {
  return document.cookie
    .split('; ')
    .find(row => row.startsWith(`${name}=`))
    ?.split('=')[1] ?? null;
}


/* ── 2. API 메서드 모음 ── */
const API = {

  /**
   * POST /api/records/
   * 문장 변환 및 저장
   * @returns {Promise<{id, original_text, purified_text, mode, severity_score, created_at}>}
   */
  convert(originalText, mode) {
    return apiFetch('/records/', {
      method: 'POST',
      body: JSON.stringify({ original_text: originalText, mode }),
    });
  },

  /**
   * GET /api/records/?mode=&sort=
   * 변환 이력 목록 조회
   * @returns {Promise<{count: number, results: Array}>}
   */
  list({ mode = '', sort = '-created_at' } = {}) {
    const params = new URLSearchParams();
    if (mode) params.set('mode', mode);
    if (sort) params.set('sort', sort);
    const qs = params.toString();
    return apiFetch(`/records/${qs ? '?' + qs : ''}`);
    // 반환 구조: { count, results }
    // count: 전체 건수 (빈 상태 판단, "총 N건" 표시에 활용 가능)
    // results: 실제 레코드 배열
  },

  /**
   * PUT /api/records/{id}/
   * 이력 재순화 — original_text·mode 모두 교체
   * @returns {Promise<{id, original_text, purified_text, mode, severity_score, created_at}>}
   */
  update(id, originalText, mode) {
    return apiFetch(`/records/${id}/`, {
      method: 'PUT',
      body: JSON.stringify({ original_text: originalText, mode }),
    });
  },

  /**
   * PATCH /api/records/{id}/
   * 이력 부분 수정 — 변경된 필드만 전송 (모드만 바꾸는 경우 등)
   * @param {Object} fields - 변경할 필드만 담은 객체 예: { mode: 'scholar' }
   * @returns {Promise<{id, original_text, purified_text, mode, severity_score, created_at}>}
   */
  patch(id, fields) {
    return apiFetch(`/records/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(fields),
    });
  },

  /**
   * DELETE /api/records/{id}/
   * 이력 삭제 — 204 No Content 반환 (null 반환)
   */
  delete(id) {
    return apiFetch(`/records/${id}/`, { method: 'DELETE' });
  },
};


/* ── 3. 세션 스토리지 헬퍼 (화면 간 데이터 전달) ── */
const Store = {
  set(key, value) {
    try { sessionStorage.setItem(`sok_${key}`, JSON.stringify(value)); }
    catch (_) {}
  },
  get(key) {
    try { return JSON.parse(sessionStorage.getItem(`sok_${key}`)); }
    catch (_) { return null; }
  },
  remove(key) {
    try { sessionStorage.removeItem(`sok_${key}`); }
    catch (_) {}
  },
};


/* ── 4. 토스트 ── */
/**
 * showToast(message, type, duration)
 * type: 'ok' | 'err'
 */
function showToast(message, type = 'ok', duration = 2200) {
  document.querySelectorAll('.sok-toast-wrapper, .tok-wrap').forEach(el => el.remove());

  const checkIcon = `<svg viewBox="0 0 24 24" width="17" height="17" fill="none"
    stroke="currentColor" stroke-width="2.2"><path d="m20 6-11 11-5-5"/></svg>`;
  const errIcon = `<svg viewBox="0 0 24 24" width="17" height="17" fill="none"
    stroke="currentColor" stroke-width="2.2">
    <circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>`;

  const wrapper = document.createElement('div');
  wrapper.className = 'sok-toast-wrapper';
  wrapper.style.cssText =
    'position:fixed;left:50%;transform:translateX(-50%);bottom:24px;z-index:999;';
  wrapper.innerHTML = `
    <div class="sok-toast ${type}">
      ${type === 'ok' ? checkIcon : errIcon}
      ${message}
    </div>`;

  document.body.appendChild(wrapper);

  setTimeout(() => {
    wrapper.style.transition = 'opacity 0.3s';
    wrapper.style.opacity = '0';
    setTimeout(() => wrapper.remove(), 300);
  }, duration);
}


/* ── 5. 모드 칩 공통 초기화 ── */
/**
 * initChips(containerSelector, onChange)
 * - 클릭 시 .is-active 토글
 * - onChange(selectedMode) 콜백 호출
 */
function initChips(containerSelector, onChange) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  container.querySelectorAll('.sok-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      container.querySelectorAll('.sok-chip').forEach(c => c.classList.remove('is-active'));
      chip.classList.add('is-active');
      if (typeof onChange === 'function') onChange(chip.dataset.mode);
    });
  });
}

/** 특정 모드로 칩 활성화 */
function setActiveChip(containerSelector, mode) {
  const container = document.querySelector(containerSelector);
  if (!container) return;
  container.querySelectorAll('.sok-chip').forEach(chip => {
    chip.classList.toggle('is-active', chip.dataset.mode === mode);
  });
}

/** 현재 활성 칩의 모드값 반환 */
function getActiveMode(containerSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) return 'scholar';
  return container.querySelector('.sok-chip.is-active')?.dataset.mode ?? 'scholar';
}


/* ── 6. 클립보드 복사 ── */
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (_) {
    // 폴백: textarea 방식
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0;';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }
}


/* ── 7. 로딩 상태 CTA 헬퍼 ── */
function setCtaLoading(btn, loading, defaultHTML) {
  if (loading) {
    btn.disabled = true;
    btn.innerHTML = `<span class="sok-spinner"></span> 순화 중…`;
  } else {
    btn.disabled = false;
    btn.innerHTML = defaultHTML;
  }
}


/* ── 8. 모드 표시 이름 매핑 ── */
const MODE_LABELS = {
  scholar:   '선비',
  trend:     '어쩔티비',
  cute:      '뿌잉뿌잉',
  rant:      '주접',
  interview: '면접',
};

function modeLabel(mode) {
  return MODE_LABELS[mode] ?? mode;
}


/* ── 9. HTML 이스케이프 (공통) ── */
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}


/* ── 10. 심각도 배지 색상 클래스 적용 (공통) ── */
function applySevClass(badgeEl, score) {
  if (!badgeEl) return;
  badgeEl.innerHTML = `심각도 <span class="n">${score}</span>/10`;
  badgeEl.classList.remove('mid', 'low');
  if (score <= 3)      badgeEl.classList.add('low');
  else if (score <= 6) badgeEl.classList.add('mid');
}
