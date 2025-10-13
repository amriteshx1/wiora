"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SquareCheck } from "lucide-react";
import { BrainIcon } from "lucide-react";
import { WaypointsIcon } from "lucide-react";
import { ScrollTextIcon } from "lucide-react";
import FeatureMarquee from "../components/Marquee";

export const HomeView = () => {

  return (
    <div className="w-full flex flex-col gap-12 relative">
      <Card className="overflow-hidden px-2 py-3 mx-[5vh] rounded-none">
        <CardContent className="flex justify-between items-center">
          <div className='lg:w-[40%] w-[20%] flex justify-start items-center'>
                <img src="/logo-black.svg" alt="Image" className="h-[32px] w-[32px]" />
            </div>

            <div className='lg:w-[50%] w-[70%] flex lg:gap-[4vh] md:gap-[3vh] gap-[2vh] justify-end items-center'>
                <p  className='lg:text-[1.05vw] md:block hidden text-[1.1vh] cursor-pointer'>About</p>
                <p  className='lg:text-[1.05vw] md:block hidden text-[1.1vh] cursor-pointer'>Features</p>
                <p className='lg:text-[1.05vw] lg:block hidden text-[1vh] cursor-pointer'>How it works</p>
                <Button className="bg-white text-black border border-black rounded-none">Sign in</Button>
                <Button className="rounded-none">Get Started</Button>
            </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden py-20 px-2 mx-[5vh] rounded-none">
        <CardContent className="flex justify-between items-center">
          <div className="w-[60%] flex flex-col gap-6">
            <div className="flex gap-5">
                <div className="flex text-sm gap-1 font-medium border-b border-l border-black p-1"><SquareCheck size={20} />Customizable AI Roles</div>
                <div className="flex text-sm gap-1 font-medium border-b border-black p-1"><SquareCheck size={20} />Context-Aware Responses</div>
                <div className="flex text-sm gap-1 font-medium border-b border-r border-black p-1"><SquareCheck size={20} />Post-Call Intelligence</div>
            </div>
            <p className="text-6xl font-semibold">Conversations Reimagined.</p>
            <p className="text-6xl font-semibold">Intelligence Included.</p>
            <p className="text-xl font-medium">AI agents that join, listen, and contribute in real time.</p>
            <div className="flex gap-5">
              <Button className="text-base rounded-none">Create a meeting</Button>
              <Button className="bg-white text-base text-black border border-black rounded-none">Learn more</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <FeatureMarquee />

      
    </div>
  )
};
