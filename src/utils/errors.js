// 에러 → 화면 문구 (7.1, 9.6). 500·502·네트워크 오류는 고정 문구로 바꾼다.
export const MESSAGES = {
  SERVER: '일시적인 오류가 발생했습니다',
  AI_UNAVAILABLE: '일시적으로 답변할 수 없습니다',
  FORBIDDEN: '권한이 없습니다',
  NOT_FOUND: '문서를 찾을 수 없습니다',
  RATE_LIMIT: '요청이 너무 많습니다.',
  FILE_TOO_LARGE: '파일은 20MB 이하만 올릴 수 있습니다',
};

export class ApiError extends Error {
  constructor({ status = 0, code = '', message = '', traceId = '' } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.traceId = traceId;
  }
}

/** 서버 오류 본문 { success:false, error:{ code, message, traceId } } 을 ApiError 로 */
export function toApiError(status, body) {
  const err = body && typeof body === 'object' ? body.error || body : {};
  return new ApiError({
    status,
    code: err.code || '',
    message: typeof err.message === 'string' ? err.message : '',
    traceId: err.traceId || '',
  });
}

/**
 * 사용자에게 보여 줄 문구.
 * @param {unknown} error
 * @param {{ chat?: boolean }} [opts]
 */
export function getErrorMessage(error, opts = {}) {
  if (!(error instanceof ApiError)) return MESSAGES.SERVER; // 네트워크·알 수 없는 오류
  const { status, message, code } = error;
  if (status === 0) return MESSAGES.SERVER; // 네트워크 오류
  if (status === 502) return MESSAGES.AI_UNAVAILABLE;
  if (status >= 500) return MESSAGES.SERVER;
  if (status === 403) return MESSAGES.FORBIDDEN;
  if (status === 404 && code === 'DOCUMENT_NOT_FOUND') return MESSAGES.NOT_FOUND;
  if (status === 413) return MESSAGES.FILE_TOO_LARGE;
  if (status === 429 && opts.chat) return MESSAGES.RATE_LIMIT;
  return message || MESSAGES.SERVER;
}

export const isNotFound = (e) => e instanceof ApiError && e.status === 404;
