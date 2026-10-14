//
import axios from "axios";

// 토큰 재발급 : POST /user/reissue
// 서버가 refreshToken 쿠키를 Redis 에 저장된 값과 대조한 뒤 accessToken(30분)·refreshToken(7일)을 새로 발급하고 UserDto 를 돌려준다.
// refreshToken 이 없거나, 만료됐거나, Redis 값과 다르면 null (서버는 다르면 Redis 토큰을 지워 강제 로그아웃시킨다)

// 재발급할 때마다 refreshToken 이 바뀌므로, 두 요청이 같은 옛 토큰으로 동시에 나가면 두 번째 요청이 Redis 값과 달라 로그아웃된다.
// 그래서 진행 중인 재발급이 있으면 새로 보내지 않고 그 결과를 같이 기다린다.
let pending = null;

// 성공하면 UserDto, 서버가 거절하면 null. 통신 오류는 그대로 throw
export function reissueToken() {
  if (!pending) {
    pending = axios.post("http://localhost:8080/user/reissue", {}, { withCredentials: true })
      .then((res) => res.data || null)
      .finally(() => { pending = null; });
  }
  return pending;
}

// 401(accessToken 만료)을 받은 요청은 재발급 후 한 번만 다시 보낸다. 반환값 : 등록 해제 함수
export function setupReissueInterceptor() {
  const id = axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      const config = error.config;
      if (error.response?.status === 401 && config && !config._retried && !config.url?.includes("/user/reissue")) {
        config._retried = true;
        const user = await reissueToken().catch(() => null);
        if (user) return axios(config);
      }
      return Promise.reject(error);
    }
  );
  return () => axios.interceptors.response.eject(id);
}
