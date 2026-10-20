import { useEffect, useState } from "react";
import { StreamTheme, useCall } from "@stream-io/video-react-sdk";
import { CallLobby } from "./call-lobby";
import { CallActive } from "./call-active";
import { CallEnded } from "./call-ended";

interface Props{
    meetingName: string;
    userId: string;
};

export const CallUI = ({ meetingName, userId }: Props) => {
    const call = useCall();
    const [show, setShow] = useState<"lobby" | "call" | "ended">("lobby");

    const handleJoin = async () => {
        if(!call) return;

        await call.join();

        setShow("call");
    };

    const handleLeave = () => {
        if(!call) return;

        call.endCall();
        setShow("ended");
    };

    useEffect(() => {
      if (!call) return;
  
      const unsubscribe = call.on("callEnded", () => {
        setShow("ended");
      });
  
      return () => {
        unsubscribe?.();
      };
    }, [call]);

    return (
        <StreamTheme className="h-full">
            {show === "lobby" && <CallLobby onJoin={handleJoin} />}
            {show === "call" && <CallActive onLeave={handleLeave} meetingName={meetingName} />}
            {show === "ended" && <CallEnded userId={userId} />}
        </StreamTheme>
    );
};