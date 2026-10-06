// 개발 서버의 화면 확인용 계정입니다. 실제 계정이나 DB 데이터가 아닙니다.
export function createCaregiverDemo(userId, password) {
  if (!import.meta.env.DEV || userId !== "caregiver_demo" || password !== "oncare1234") {
    throw new Error("더미 아이디와 비밀번호를 확인해주세요.");
  }
  const date = (offset) => {
    const value = new Date();
    value.setDate(value.getDate() + offset);
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
  };
  const careworker = { careworkerNo: 900001, careworkerName: "김온케어 (체험)", careworkerAddress: "화면 확인용 예시 주소", careworkerGender: "여", careworkerAge: 45, hourWage: 13000, careworkerState: "근무 중 (예시)", centerNo: 900001, userNo: 900001 };
  const response = (data) => Promise.resolve({ data });
  const blockWrite = () => Promise.reject(new Error("더미 모드에서는 저장하거나 삭제할 수 없습니다."));
  // 가용시간 체험만 현재 로그인 세션의 메모리에 반영합니다. 서버 요청은 없습니다.
  let availability = [
    { availabilityNo: 900001, caregiverNo: careworker.careworkerNo, availableDate: date(0), startTime: 9, endTime: 18, status: "가능" },
    { availabilityNo: 900002, caregiverNo: careworker.careworkerNo, availableDate: date(1), startTime: 10, endTime: 16, status: "가능" },
  ];
  let nextAvailabilityNo = 900003;
  const checkAvailability = (body) => {
    if (body.caregiverNo !== careworker.careworkerNo || !body.availableDate || !Number.isInteger(body.startTime) || !Number.isInteger(body.endTime) || body.startTime < 0 || body.endTime > 24 || body.startTime >= body.endTime || !body.status?.trim()) throw new Error("체험 가용시간 입력을 확인해주세요.");
  };
  const api = {
    isDemo: true,
    getProfile: (careworkerNo) => response(careworkerNo === careworker.careworkerNo ? { ...careworker } : null),
    getAvailability: () => response(availability.map((item) => ({ ...item }))),
    demoAvailability: {
      create: (body) => {
        checkAvailability(body);
        availability.push({ ...body, availabilityNo: nextAvailabilityNo++ });
      },
      update: (body) => {
        checkAvailability(body);
        if (!availability.some((item) => item.availabilityNo === body.availabilityNo)) throw new Error("체험 가용시간을 찾을 수 없습니다.");
        availability = availability.map((item) => item.availabilityNo === body.availabilityNo ? { ...body } : item);
      },
      remove: (availabilityNo) => {
        if (!availability.some((item) => item.availabilityNo === availabilityNo)) throw new Error("체험 가용시간을 찾을 수 없습니다.");
        availability = availability.filter((item) => item.availabilityNo !== availabilityNo);
      },
    },
    getCenters: () => response([{ centerNo: careworker.centerNo, centerName: "온케어 체험센터", address: "화면 확인용 센터 예시 주소", phoneNumber: "02-000-0000" }]),
    getSchedule: () => response([
      { scheduleNo: 900001, visitDate: date(0), startTime: "09:00", endTime: "11:00", recipientName: "이예시 어르신", address: "화면 확인용 방문 주소 A", status: "방문 예정 (예시)" },
      { scheduleNo: 900002, visitDate: date(1), startTime: "13:00", endTime: "15:00", recipientName: "박예시 어르신", address: "화면 확인용 방문 주소 B", status: "배정 완료 (예시)" },
    ]),
    getRecords: () => response([{ recordNo: 900001, visitDate: date(-1), recipientName: "이예시 어르신", content: "식사 준비와 생활 공간 정리를 도왔습니다. (예시)", notes: "화면 확인용 업무 기록입니다.", status: "작성 완료 (예시)" }]),
    getAccount: () => response({ phoneNumber: "010-0000-0000" }),
    updateProfile: blockWrite,
    createAvailability: blockWrite,
    updateAvailability: blockWrite,
    deleteAvailability: blockWrite,
    saveRecord: null,
    updatePhone: null,
    changePassword: null,
    withdraw: null,
  };
  return { careworkerNo: careworker.careworkerNo, api };
}
