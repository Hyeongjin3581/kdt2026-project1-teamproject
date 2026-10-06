import axios from "axios";

// 확인된 Controller 경로만 호출합니다. 모든 함수는 axios 응답을 반환합니다.
// null 항목은 팀원 API 병합 후 실제 경로와 응답 형태에 맞춰 연결합니다.
// 화면에서 쓰는 데이터 필드는 CAREGIVER_PORTAL.md에 정리합니다.
const caregiverApi = {
  getProfile: (careworkerNo) => axios.get("/api/careworkers/detail", { params: { careworkerNo }, withCredentials: true }),
  updateProfile: (body) => axios.put("/api/careworkers", body, { withCredentials: true }),
  getAvailability: () => axios.get("/api/caregiver-availability", { withCredentials: true }),
  createAvailability: (body) => axios.post("/api/caregiver-availability", body, { withCredentials: true }),
  updateAvailability: (body) => axios.put("/api/caregiver-availability", body, { withCredentials: true }),
  deleteAvailability: (availabilityNo) => axios.delete("/api/caregiver-availability", { params: { availabilityNo }, withCredentials: true }),
  login: null,
  signup: null,
  getCenters: null,
  getSchedule: null,
  getNotifications: null,
  getRecords: null,
  saveRecord: null,
  getAccount: null,
  updatePhone: null,
  changePassword: null,
  withdraw: null,
};

export default caregiverApi;
