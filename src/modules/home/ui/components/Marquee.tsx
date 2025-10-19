
import Marquee from "react-fast-marquee";
import { BotIcon } from "lucide-react";
import { DramaIcon } from "lucide-react";
import { ZapIcon } from "lucide-react";
import { HeadsetIcon } from "lucide-react";
import { TabletSmartphoneIcon } from "lucide-react";
import { FlameKindlingIcon } from "lucide-react";
import { BookOpenTextIcon } from "lucide-react";
import { FileTextIcon } from "lucide-react";
import { FileVideoIcon } from "lucide-react";
import { SparklesIcon } from "lucide-react";

const FeatureMarquee = () => {
  return (
    <div className="relative lg:mx-[5vh] mx-[3vh] lg:p-2 p-1">

      <Marquee
        gradient={true}
        gradientColor= "white"
        gradientWidth={80}
        speed={40}
        pauseOnHover={true}
      >
        <div className="flex lg:text-lg text-base lg:gap-8 gap-6 hover:cursor-default lg:mr-8 mr-6 font-light">
          <div className="flex items-center gap-2"><BotIcon strokeWidth={0.8} />Live AI Agents</div>
          <div className="flex items-center gap-2"><DramaIcon strokeWidth={0.8} />Custom Roles</div>
          <div className="flex items-center gap-2"><ZapIcon strokeWidth={0.8} />Instant Meetings</div>
          <div className="flex items-center gap-2"><HeadsetIcon strokeWidth={0.8} />Crystal-Clear Calls</div>
          <div className="flex items-center gap-2"><BookOpenTextIcon strokeWidth={0.8} />Instant Summaries</div>
          <div className="flex items-center gap-2"><FileTextIcon strokeWidth={0.8} />Searchable Transcripts</div>
          <div className="flex items-center gap-2"><FileVideoIcon strokeWidth={0.8} />Meeting Replays</div>
          <div className="flex items-center gap-2"><SparklesIcon strokeWidth={0.8} />Chat With AI</div>
          <div className="flex items-center gap-2"><TabletSmartphoneIcon strokeWidth={0.8} />Mobile-Ready</div>
          <div className="flex items-center gap-2"><FlameKindlingIcon strokeWidth={0.8} />Sleek Modern UI</div>
        </div>
      </Marquee>
    </div>
  );
};

export default FeatureMarquee;