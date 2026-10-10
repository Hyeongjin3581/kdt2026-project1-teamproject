import {useEffect, useRef, useState} from "react";
import { Client } from "@stomp/stompjs";
import axios from "axios";


export default function ChatRoom({roomId, peerName}){   // peerName : 상대방 표시 이름 (없으면 서버가 준 sender 를 그대로 보여 준다)
    const [messages, setMessages] = useState([]); // 받을 메시지 목록
    const [input, setInput] = useState("");    // 입력창 내용
    const [connected, setConnected] = useState(false);
    const [myUserNo, setMyUserNo] = useState(null); // 내 회원 번호
    const clientRef = useRef(null);     // STOMP 클라이언트 보관 (화면에 다시 그려도 유지)

    // 내가 누군지 알아오기
    useEffect(() => {
        axios.get("http://localhost:8080/user/me",  {withCredentials: true})
            .then(function (res){
                setMyUserNo(res.data.userNo);
            })

    }, []);

    /*
    new Client({
        brokerURL: "ws://localhost:8080/ws-chat",   // ① 어디에 연결할지 (주소)
        onConnect: function () { ... },             // ② 연결이 성공하면 실행할 일 (메모)
        onDisconnect: function () { ... },          // ③ 연결이 끊기면 실행할 일 (메모)
    });
    */

    // 1. 접속 : 연결 -> 구독
    function connect() {
        const client = new Client({
            brokerURL: "ws://localhost:8080/ws-chat",   // 스프링 addEndpoint 주소
            onConnect: function () {                    // 연결이 성공하면
                setConnected(true);
                // 내 방 구독 : 이 주소로 오는 메시지를 듣는다
                client.subscribe(`/sub/chat/room/${roomId}`, function (message) {
                    const newMessage = JSON.parse(message.body)
                    setMessages((prev) => {
                        if (prev.some((m)=> m.messageNo === newMessage.messageNo)) return prev;
                        return [...prev, newMessage]
                    });
                });
                loadHistory(); // 구독한 뒤에 과거 대화 불러옴
            },
            onDisconnect: function () {
                setConnected(false);
            },
        });
        client.activate();            // 실제 연결 시작
        clientRef.current = client;   // 다른 함수에서도 쓰도록 ref 에 저장
    }

    // 2. 종료 : 소켓 닫기
    function disconnect(){
        if (clientRef.current){
            clientRef.current.deactivate();
        }
    }

    // 3. 화면 열리고 접속하고, 화면을 벗어나면 종료
    useEffect(function () {
        connect();
        return function (){
            disconnect();
        }
    }, [roomId]);

    // 4. 전송 : 발행
    function send(){
        const client = clientRef.current;
        if (!client || !client.connected || input.trim()===""){
            return;
        }
        client.publish({
            destination : "/pub/chat/message",
            body : JSON.stringify({
                roomId,
                content : input,
            })
        })
        setInput(""); // 전송 후 입력창 비우기
    }

    // 5. 과거 대화 불러오기
    function loadHistory(){
        axios.get("http://localhost:8080/chat/messages", {
            params:{roomId},
            withCredentials: true
        }).then(function (res){
            if (!Array.isArray(res.data)) return;
            // 불러오는 동안 이미 도착한 새 메시지 중, 과거 목록에 없는 것마 남김
            setMessages((prev)=>{
                const received =prev.filter((m)=> !res.data.some((h)=> h.messageNo === m.messageNo));
                return [...res.data, ...received];  // 과거 대화 + 새로 온 것
            })
        })
    }
    function handleChange(e){
        setInput(e.target.value)
    }
    function handleKeyDown(e){
        if (e.key==="Enter"){
            send();
        }
    }
    return(
        <div className="mx-auto mt-10 flex h-[70vh] w-full max-w-md flex-col rounded-2xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-4 py-3 text-sm font-bold text-slate-800">
                {connected ? "🟢 연결됨" : "⚪ 연결 중"}
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto p-4">
                {messages.map((m) => (
                    <div key={m.messageNo} className={m.senderNo === myUserNo ? "flex justify-end" : "flex justify-start"}>
                        <div className={`max-w-[70%] rounded-2xl px-3 py-2 text-sm ${m.senderNo === myUserNo ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-800"}`}>
                            {m.senderNo !== myUserNo && <p className="mb-0.5 text-[11px] font-bold text-slate-500">{peerName ?? m.sender}</p>}
                            <p>{m.content}</p>
                            <p className="mt-0.5 text-right text-[10px] opacity-60">{m.date}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex gap-2 border-t border-slate-200 p-3">
                <input
                    value={input}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder="메시지를 입력하세요"
                    className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                <button onClick={send} className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-bold text-white">전송</button>
            </div>
        </div>
    );
}