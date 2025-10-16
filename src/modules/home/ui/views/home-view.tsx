"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SquareCheck } from "lucide-react";
import FeatureMarquee from "../components/Marquee";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { GeneratedAvatar } from "@/components/generated-avatar";
import { CommandSelect } from "@/components/command-select";
import { GpuIcon } from "lucide-react";
import { CameraOffIcon } from "lucide-react";
import { MicOffIcon } from "lucide-react";
import { BotIcon } from "lucide-react";
import { UserRoundIcon } from "lucide-react";
import { BookOpenTextIcon } from "lucide-react";
import { FileTextIcon } from "lucide-react";
import { FileVideoIcon } from "lucide-react";
import { SparklesIcon } from "lucide-react";
import { CircleCheckIcon } from "lucide-react";

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
                <Button className="bg-white text-black border border-black hover:bg-neutral-100 rounded-none">Sign in</Button>
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
              <Button className="bg-white text-base text-black border border-black hover:bg-neutral-100 rounded-none">Learn more</Button>
            </div>
          </div>

          <div className="w-[40%] flex flex-col relative py-8">
            <div className="w-[70%] h-[60%] self-start border-l border-b p-3 relative z-10 transform -rotate-6 shadow-xl">
              <form className="space-y-2">
                <GeneratedAvatar 
                  seed="X"
                  variant="botttsNeutral"
                  className="border size-10"
                />
                 <div className="space-y-2">
                   <Label>Agent Name</Label>
                   <Input placeholder="e.g. Product analyst" />
                 </div>
       
                 <div className="space-y-2">
                   <Label>Instructions</Label>
                   <Textarea placeholder="You provide clear, structured insights on product ideas, user feedback, and feature decisions." />
                 </div>
       
                 <div className="flex justify-between gap-x-2">
                   <Button variant="ghost" type="button">
                     Cancel
                   </Button>
                   <Button type="button">
                     Create
                   </Button>
                 </div>
             </form>
           </div>

           <div className="w-[70%] h-[60%] self-end border-t border-l p-3 -mt-25 relative z-30 bg-white transform rotate-6 shadow-lg">
            <form className="space-y-2">
              <GpuIcon size="30px" color="#5D1712" />
              <div className="space-y-2">
                <Label>Meeting Name</Label>
                <Input placeholder="e.g. Product Discussion" />
              </div>
    
              <div className="space-y-2">
                <Label>Agent</Label>
                <CommandSelect
                  options={[
                  ]}
                  value=""           
                  onSelect={() => {}}  
                  onSearch={() => {}}  
                  placeholder="Select an agent"
                />
                <p className="text-sm text-muted-foreground">
                  Not found what you&apos;re looking for?{" "}
                  <button
                    type="button"
                    className="text-primary hover:underline"
                  >
                    Create a new agent
                  </button>
                </p>
              </div>

              <div className="flex justify-between gap-x-2">
                <Button variant="ghost" type="button">
                  Cancel
                </Button>
                <Button type="button">Create</Button>
              </div>
            </form>
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

          <div className="flex justify-between items-center w-full px-32">
            <div className="flex justify-center items-center rounded-none w-[45%] border-b-2 px-4">
              <Card className="rounded-none w-[80%] py-3">
              <CardContent className="flex items-center px-3">
                <form className="space-y-2">
                  <GeneratedAvatar 
                    seed="X"
                    variant="botttsNeutral"
                    className="border size-8"
                  />
                   <div className="space-y-2">
                     <Label className="text-xs font-medium">Agent Name</Label>
                     <Input placeholder="e.g. Product analyst" className="h-6 text-xs placeholder:text-xs"/>
                   </div>
         
                   <div className="space-y-2">
                     <Label className="text-xs font-medium">Instructions</Label>
                     <Textarea className="text-xs placeholder:text-xs" placeholder="You provide clear, structured insights on product ideas, user feedback, and feature decisions." />
                   </div>
         
                   <div className="flex justify-between gap-x-2">
                     <Button variant="ghost" type="button" className="text-xs p-0 h-6">
                       Cancel
                     </Button>
                     <Button type="button" className="text-xs h-6 px-2">
                       Create
                     </Button>
                   </div>
                </form>
              </CardContent>
              </Card>
            </div>
            <div className="flex flex-col gap-4">
              <p className="text-xl font-medium">1. Create Your AI Agent</p>
              <p className="text-base">
                Define your agent’s role, tone, and purpose - from tutor to mentor to sales coach.
              </p>
            </div>
          </div>

          <div className="flex justify-between items-center w-full px-32">
            <div className="flex flex-col gap-4 pl-20">
              <p className="text-xl font-medium">2. Schedule a Meeting</p>
              <p className="text-base">
                Set up a meeting, select your AI agent, and join the call.
              </p>
            </div>
            <div className="flex justify-center items-center rounded-none w-[45%] border-b-2 px-4">
            <Card className="rounded-none w-[80%] py-3">
              <CardContent className="flex items-center px-3">
                <form className="space-y-2">
                  <GpuIcon size="28px" color="#5D1712" />
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Meeting Name</Label>
                    <Input placeholder="e.g. Product Discussion" className="h-6 text-xs placeholder:text-xs"/>
                  </div>
        
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Agent</Label>
                    <CommandSelect
                      options={[
                      ]}
                      value=""           
                      onSelect={() => {}}  
                      onSearch={() => {}}  
                      placeholder="Select an agent"
                    />
                    <p className="text-sm text-muted-foreground">
                      Not found what you&apos;re looking for?{" "}
                      <button
                        type="button"
                        className="text-primary hover:underline"
                      >
                        Create a new agent
                      </button>
                    </p>
                  </div>
    
                  <div className="flex justify-between gap-x-2">
                    <Button variant="ghost" type="button" className="text-xs h-0 px-2">
                      Cancel
                    </Button>
                    <Button type="button" className="text-xs h-6 px-2">Create</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
            </div>
          </div>

          <div className="flex justify-between items-center w-full px-32">
            <div className="flex justify-center items-center rounded-none w-[45%] border-b-2 px-4">
            <Card className="rounded-none w-[80%] py-3">
              <CardContent className="flex flex-col space-y-2 items-center px-2">
                <div className="h-[15vh] w-[80%] border border-gray-400 flex flex-col justify-center items-center gap-1">
                  <BotIcon size={32} strokeWidth={1} className="border border-gray-800 rounded-full p-1" />
                  <p className="text-xs font-light">Product Analyst Agent</p>
                </div>
                <div className="flex justify-center items-center border">
                  <div className="h-[6vh] w-[10vh] border border-gray-400 flex flex-col justify-center items-center gap-0">
                    <UserRoundIcon size={16} strokeWidth={1} className="border border-gray-800 rounded-full p-0.5" />
                    <p className="text-[10px] font-light">You</p>
                  </div>
                </div>
                <div className="flex justify-center items-center gap-3">
                  <CameraOffIcon size={14} strokeWidth={1}/>
                  <MicOffIcon size={14} strokeWidth={1} />
                  <Button type="button" className="text-[10px] h-4 px-1 bg-red-600 text-white">End</Button>
                </div>
              </CardContent>
            </Card>
            </div>
            <div className="flex flex-col gap-4">
              <p className="text-xl font-medium">3. Join and Interact</p>
              <p className="text-base">
                Collaborate in real time as your agent listens, responds, and participates naturally.
              </p>
            </div>
          </div>
          <div className="flex justify-between items-center w-full px-32">
            <div className="flex flex-col gap-4 pl-20">
              <p className="text-xl font-medium">4. Get Post-Call Intelligence</p>
              <p className="text-base">
                Access summaries, searchable transcripts, and replays - all generated automatically.
              </p>
            </div>
            <div className="flex justify-center items-center rounded-none w-[45%] border-b-2 px-4">
            <Card className="rounded-none w-[80%] py-6">
              <CardContent className="flex flex-wrap items-center px-6">
                <div className="w-[50%] flex flex-col justify-center items-center border p-6">
                  <BookOpenTextIcon size={18} strokeWidth={1} />
                  <p className="text-xs font-normal">Summary</p>
                </div>
                <div className="w-[50%] flex flex-col justify-center items-center border p-6">
                  <FileTextIcon size={18} strokeWidth={1} />
                  <p className="text-xs font-normal">Transcript</p>
                </div>
                <div className="w-[50%] flex flex-col justify-center items-center border p-6">
                  <FileVideoIcon size={18} strokeWidth={1} />
                  <p className="text-xs font-normal">Recording</p>
                </div>
                <div className="w-[50%] flex flex-col justify-center items-center border p-6">
                  <SparklesIcon size={18} strokeWidth={1} />
                  <p className="text-xs font-normal">Ask AI</p>
                </div>
              </CardContent>
            </Card>
            </div>
          </div>

      </div>

      <div className="flex flex-col justify-center items-center gap-14 py-5 mx-[5vh]">
          <p className="text-4xl font-semibold p-4 border-b-2 mb-4">Pricing Plans</p>

          <div className="flex justify-center items-center w-full gap-4">
            <Card className="rounded-none w-[25%]">
              <CardContent className="flex flex-col justify-center items-center gap-8">
                <div className="flex justify-center items-center gap-8">
                  <div className="flex flex-col items-start">
                    <h6 className="font-medium text-xl">Monthly</h6>
                    <p className="text-xs text-neutral-700">For individuals getting started</p>
                  </div>
                  <h4 className="text-3xl font-medium flex">12$ <span className="text-xs self-end">/month</span></h4>
                </div>
                <Button type="button" className="w-full">Select Plan</Button>
                <div className="flex flex-col items-start w-full gap-y-2.5">
                  <p className="font-medium text-sm mb-4">FEATURES</p>
                  <p className="text-xs font-medium flex items-center gap-x-2.5"><CircleCheckIcon className="size-4 fill-primary text-white" />Unlimited Agents</p>
                  <p className="text-xs font-medium flex items-center gap-x-2.5"><CircleCheckIcon className="size-4 fill-primary text-white" />Unlimited Meetings</p>
                  <p className="text-xs font-medium flex items-center gap-x-2.5"><CircleCheckIcon className="size-4 fill-primary text-white" />Upto 300 minutes total</p>
                  <p className="text-xs font-medium flex items-center gap-x-2.5"><CircleCheckIcon className="size-4 fill-primary text-white" />Full Summaries + Transcripts</p>
                  <p className="text-xs font-medium flex items-center gap-x-2.5"><CircleCheckIcon className="size-4 fill-primary text-white" />Real-time chat & Recording Playback</p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-none w-[25%] bg-black text-white transform scale-105">
              <CardContent className="flex flex-col justify-center items-center gap-8">
                <div className="flex justify-center items-center gap-8">
                  <div className="flex flex-col items-start">
                    <h6 className="font-medium text-xl">Yearly</h6>
                    <p className="text-xs text-neutral-300">For small teams or focused peers</p>
                  </div>
                  <h4 className="text-3xl font-medium flex">110$ <span className="text-xs self-end">/year</span></h4>
                </div>
                <Button type="button" className="w-full bg-white text-black hover:bg-white/95">Select Plan</Button>
                <div className="flex flex-col items-start w-full gap-y-2.5">
                  <p className="font-medium text-sm mb-4">FEATURES</p>
                  <p className="text-xs font-medium flex items-center gap-x-2.5"><CircleCheckIcon className="size-4 fill-white text-black" />Unlimited Agents</p>
                  <p className="text-xs font-medium flex items-center gap-x-2.5"><CircleCheckIcon className="size-4 fill-white text-black" />Unlimited Meetings</p>
                  <p className="text-xs font-medium flex items-center gap-x-2.5"><CircleCheckIcon className="size-4 fill-white text-black" />Upto 400 minutes total/month</p>
                  <p className="text-xs font-medium flex items-center gap-x-2.5"><CircleCheckIcon className="size-4 fill-white text-black" />Full Summaries + Transcripts</p>
                  <p className="text-xs font-medium flex items-center gap-x-2.5"><CircleCheckIcon className="size-4 fill-white text-black" />Real-time chat & Recording Playback</p>
                  <p className="text-xs font-medium flex items-center gap-x-2.5"><CircleCheckIcon className="size-4 fill-white text-black" />Priority background processing</p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-none w-[25%]">
              <CardContent className="flex flex-col justify-center items-center gap-8">
                <div className="flex justify-center items-center gap-8">
                  <div className="flex flex-col items-start">
                    <h6 className="font-medium text-xl">Enterprise</h6>
                    <p className="text-xs text-neutral-700">For startups, orgs or educators</p>
                  </div>
                  <h4 className="text-3xl font-medium flex">Custom</h4>
                </div>
                <Button type="button" className="w-full">Select Plan</Button>
                <div className="flex flex-col items-start w-full gap-y-2.5">
                  <p className="font-medium text-sm mb-4">FEATURES</p>
                  <p className="text-xs font-medium flex items-center gap-x-2.5"><CircleCheckIcon className="size-4 fill-primary text-white" />2 months free</p>
                  <p className="text-xs font-medium flex items-center gap-x-2.5"><CircleCheckIcon className="size-4 fill-primary text-white" />Unlimited Agents + Meetings</p>
                  <p className="text-xs font-medium flex items-center gap-x-2.5"><CircleCheckIcon className="size-4 fill-primary text-white" />Unlimited duration & usage</p>
                  <p className="text-xs font-medium flex items-center gap-x-2.5"><CircleCheckIcon className="size-4 fill-primary text-white" />Custom Organizational Dashboard</p>
                  <p className="text-xs font-medium flex items-center gap-x-2.5"><CircleCheckIcon className="size-4 fill-primary text-white" />Dedicated Discord Support</p>
                </div>
              </CardContent>
            </Card>
          </div>
      </div>

      <div className="flex flex-col justify-center items-center gap-4 py-20 mx-[5vh]">
          <p className="text-4xl font-semibold">Experience the future of meetings - powered by AI</p>
          <p className="text-lg font-medium text-black/75">Turn every conversation into insights, actions, and clarity.</p>
          <Button className="w-[20%] h-[6vh] text-base">Get Started for Free</Button>
      </div>

      <Card className=" px-2 py-3 mx-[5vh] rounded-none mb-6">
        <CardContent className="flex justify-between">
          <p className="text-lg font-medium">Wiora <span className="font-normal text-xs">© All Rights Reserved.</span></p>
          <div className="w-[40%] flex justify-end items-center gap-x-8">
            <p className="text-xs">Docs</p>
            <p className="text-xs">Privacy</p>
            <p className="text-xs">Terms</p>
            <p className="text-xs">Help</p>
            <p className="text-xs">Contact</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
};
