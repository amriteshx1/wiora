"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SquareCheck } from "lucide-react";
import { BrainIcon } from "lucide-react";
import { WaypointsIcon } from "lucide-react";
import { ScrollTextIcon } from "lucide-react";
import FeatureMarquee from "../components/Marquee";
import { Form } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { GeneratedAvatar } from "@/components/generated-avatar";
import { CommandSelect } from "@/components/command-select";
import { GpuIcon } from "lucide-react";

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

      <Card className="overflow-hidden px-2 py-2 mx-[5vh] rounded-none">
        <CardContent className="flex justify-between items-center">
          <div className="w-[60%] flex flex-col gap-6 py-20">
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

      <div className="flex flex-col justify-center items-center gap-14 py-10 mx-[5vh]">
                <p className="text-4xl font-semibold p-4 border-b-2">Features</p>

                <div className="flex gap-14">
                  <Card className="rounded-none px-2 py-10 flex-1">
                    <CardContent className="flex items-center gap-4">
                      <img src="/brain.svg" alt="Brain" className="h-[102px] w-[102px]" />
                      <div className="flex flex-col gap-4">
                        <p className="text-xl font-medium">Intelligent by Design</p>
                        <p className="text-base">Join meetings with AI agents that actively understand, assist, and enhance collaboration.</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="rounded-none px-2 py-10 flex-1">
                    <CardContent className="flex items-center gap-4">
                      <img src="/flow.svg" alt="Flow" className="h-[102px] w-[102px]" />
                      <div className="flex flex-col gap-4">
                        <p className="text-xl font-medium">Built for Flow</p>
                        <p className="text-base">Real-time chat, crystal-clear calls, and seamless sync across all your devices.</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="rounded-none px-2 py-10 flex-1">
                    <CardContent className="flex items-center gap-4">
                      <img src="/notes.svg" alt="Notes" className="h-[102px] w-[102px]" />
                      <div className="flex flex-col gap-4">
                        <p className="text-xl font-medium">Beyond the Call</p>
                        <p className="text-base">Get instant summaries, searchable transcripts, and contextual insights that keep work moving.</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

            </div>

      <div className="flex flex-col justify-center items-center gap-14 py-5 mx-[5vh]">
          <p className="text-4xl font-semibold p-4 border-b-2">Workflow</p>

          <div className="flex justify-between items-center">
            <Card className="rounded-none px-2">
              <CardContent className="flex items-center">
                
              </CardContent>
            </Card>
            <div className="flex flex-col gap-4">
              <p className="text-xl font-medium">1. Create Your AI Agent</p>
              <p className="text-base">
                Define your agent’s role, tone, and purpose - from tutor to mentor to sales coach.
              </p>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex flex-col gap-4">
              <p className="text-xl font-medium">2. Schedule a Meeting</p>
              <p className="text-base">
                Set up a meeting, select your AI agent, and join the call.
              </p>
            </div>
            <Card className="rounded-none px-2">
              <CardContent>

              </CardContent>
            </Card>
          </div>
          <div className="flex justify-between items-center">
            <Card className="rounded-none px-2">
              <CardContent>

              </CardContent>
            </Card>
            <div className="flex flex-col gap-4">
              <p className="text-xl font-medium">3. Join and Interact</p>
              <p className="text-base">
                Collaborate in real time as your agent listens, responds, and participates naturally.
              </p>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex flex-col gap-4">
              <p className="text-xl font-medium">4. Get Post-Call Intelligence</p>
              <p className="text-base">
                Access summaries, searchable transcripts, and replays - all generated automatically.
              </p>
            </div>
            <Card className="rounded-none px-2">
              <CardContent>

              </CardContent>
            </Card>
          </div>
      </div>
    </div>
  )
};
