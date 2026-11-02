// AI 영역에서만 사용하는 오류 안내. 기존 화면의 오류 처리는 유지한다.
export function aiErrorMessage(error, context = "") {
  const code = error.response?.status;
  if (context === "consult" && code === 400) return "질문 내용과 선택한 방문 일정을 확인해주세요. (400)";
  if (context === "handoff" && code === 409) return "이 접수 요청과 서버에 저장된 내용이 다릅니다. 문의 내역을 확인해주세요. 자동으로 다시 접수하지 않습니다. (409)";
  if (context === "handoff" && (code === 502 || !code)) return "문의 전달 결과를 확인하지 못했습니다. 입력 내용을 유지하고 같은 전달 버튼으로 다시 확인해주세요. 중복 방지를 위해 기존 접수 키로 재시도합니다.";
  if (context === "review" && code === 400) return "해당 후기를 분석할 수 없습니다. 후기 내용과 현재 상태를 확인해주세요. (400)";
  if (context === "review" && code === 404) return "요청한 후기를 찾을 수 없습니다. 목록을 새로고침해주세요. (404)";
  if (code === 400) return "입력한 질문·문의 유형·선택한 방문 또는 FAQ 생성 조건을 확인해주세요. (400)";
  if (code === 401) return "로그인 상태를 확인한 뒤 다시 시도해주세요. (401)";
  if (code === 403) return "이 AI 기능을 사용할 권한이 없습니다. (403)";
  if (code === 404) return "요청한 데이터가 없거나 더 이상 승인된 FAQ가 아닙니다. 저장된 답변을 확인할 수 없습니다. (404)";
  if (code === 502) return "AI 서비스 호출에 실패했습니다. 잠시 후 다시 시도해주세요. (502)";
  if (code) return `서버에서 요청을 처리하지 못했습니다. (HTTP ${code})`;
  if (error.response) return "서버 응답 형식이 올바르지 않습니다. 다시 조회해주세요.";
  return "서버와 통신하지 못했습니다. 연결을 확인한 뒤 다시 시도해주세요.";
}

export function invalidAiResponse(response) {
  return { response: { data: response.data } };
}
