import { useSearchParams } from "react-router-dom";
import ChatRoom from "./ChatRoom";

export default function ChatTest() {
    const [params] = useSearchParams();
    return <ChatRoom roomId={params.get("room") ?? "1"}/>;
}