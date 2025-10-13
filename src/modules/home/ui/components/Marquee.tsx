
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
        gradientWidth={60}
        speed={40}
        pauseOnHover={true}
      >
        <div className="flex text-lg gap-8 hover:cursor-default mr-8 font-normal">
          <div className="flex items-center gap-2"><BotIcon strokeWidth={1.5} />Live AI Agents</div>
          <div className="flex items-center gap-2"><DramaIcon strokeWidth={1.5} />Custom Roles</div>
          <div className="flex items-center gap-2"><ZapIcon strokeWidth={1.5} />Instant Meetings</div>
          <div className="flex items-center gap-2"><HeadsetIcon strokeWidth={1.5} />Crystal-Clear Calls</div>
          <div className="flex items-center gap-2"><MessageCircleMoreIcon strokeWidth={1.5} />Real-Time Messaging</div>
          <div className="flex items-center gap-2"><ScrollTextIcon strokeWidth={1.5} />Instant Summaries</div>
          <div className="flex items-center gap-2"><TextSearchIcon strokeWidth={1.5} />Searchable Transcripts</div>
          <div className="flex items-center gap-2"><TabletSmartphoneIcon strokeWidth={1.5} />Mobile-Ready</div>
          <div className="flex items-center gap-2"><RefreshCcwIcon strokeWidth={1.5} />Always Synced</div>
          <div className="flex items-center gap-2"><FlameKindlingIcon strokeWidth={1.5} />Sleek Modern UI</div>
        </div>
      </Marquee>
    </div>
  );
};

export default FeatureMarquee;