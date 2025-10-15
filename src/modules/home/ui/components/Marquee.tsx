
import Marquee from "react-fast-marquee";
import { BotIcon } from "lucide-react";
import { DramaIcon } from "lucide-react";
import { ZapIcon } from "lucide-react";
import { HeadsetIcon } from "lucide-react";
import { MessageCircleMoreIcon } from "lucide-react";
import { ScrollTextIcon } from "lucide-react";
import { TextSearchIcon } from "lucide-react";
import { TabletSmartphoneIcon } from "lucide-react";
import { RefreshCcwIcon } from "lucide-react";
import { FlameKindlingIcon } from "lucide-react";

const FeatureMarquee = () => {
  return (
    <div className="relative mx-[5vh] p-2">

      <Marquee
        gradient={true}
        gradientColor= "white"
        gradientWidth={80}
        speed={40}
        pauseOnHover={true}
      >
        <div className="flex text-lg gap-8 hover:cursor-default mr-8 font-light">
          <div className="flex items-center gap-2"><BotIcon strokeWidth={0.8} />Live AI Agents</div>
          <div className="flex items-center gap-2"><DramaIcon strokeWidth={0.8} />Custom Roles</div>
          <div className="flex items-center gap-2"><ZapIcon strokeWidth={0.8} />Instant Meetings</div>
          <div className="flex items-center gap-2"><HeadsetIcon strokeWidth={0.8} />Crystal-Clear Calls</div>
          <div className="flex items-center gap-2"><MessageCircleMoreIcon strokeWidth={0.8} />Real-Time Messaging</div>
          <div className="flex items-center gap-2"><ScrollTextIcon strokeWidth={0.8} />Instant Summaries</div>
          <div className="flex items-center gap-2"><TextSearchIcon strokeWidth={0.8} />Searchable Transcripts</div>
          <div className="flex items-center gap-2"><TabletSmartphoneIcon strokeWidth={0.8} />Mobile-Ready</div>
          <div className="flex items-center gap-2"><RefreshCcwIcon strokeWidth={0.8} />Always Synced</div>
          <div className="flex items-center gap-2"><FlameKindlingIcon strokeWidth={0.8} />Sleek Modern UI</div>
        </div>
      </Marquee>
    </div>
  );
};

export default FeatureMarquee;