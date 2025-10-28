"use client";

import Link from "next/link";
import Image from "next/image";

import { motion } from "framer-motion";

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

const MotionCard = motion(Card);

export const HomeView = () => {

  return (
    <div className="w-full flex flex-col md:gap-12 gap-8 relative">
      <Card className="overflow-hidden lg:px-2 md:px-1 px-0.5 lg:py-3 py-2 lg:mx-[5vh] md:mx-[3vh] mx-[1vh] rounded-none">
        <CardContent className="flex justify-between items-center lg:px-6 md:px-4 px-2">
          <div className='lg:w-[40%] w-[20%] flex justify-start items-center'>
                <Image src="/logo-black.svg" alt="Image" width={32} height={32} className="h-[32px] w-[32px]" />
            </div>

            <div className='lg:w-[50%] w-[70%] flex lg:gap-[4vh] md:gap-[3vh] gap-[1vh] justify-end items-center'>
                <p  className='lg:text-[1.05vw] md:block hidden text-[1.1vh] cursor-pointer'>About</p>
                <p  
                  onClick={() => {
                    const el = document.getElementById("features");
                    if (el) {
                      el.scrollIntoView({ behavior: "smooth", block: "start" });
                    }
                  }}
                  className='lg:text-[1.05vw] md:block hidden text-[1.1vh] cursor-pointer'>
                    Features
                </p>
                <p 
                  onClick={() => {
                    const el = document.getElementById("workflow");
                    if (el) {
                      el.scrollIntoView({ behavior: "smooth", block: "start" });
                    }
                  }}
                  className='lg:text-[1.05vw] lg:block hidden text-[1vh] cursor-pointer'>
                    How it works
                </p>
                <Link href="/sign-in">
                  <Button className="bg-white md:text-sm text-xs text-black border border-black hover:bg-neutral-100 rounded-none">Sign in</Button>
                </Link>
                <Link href="/sign-up">
                  <Button className="rounded-none md:text-sm text-xs">Get Started</Button>
                </Link>
            </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden lg:px-2 px-1 py-2 lg:mx-[5vh] md:mx-[3vh] mx-[1vh] rounded-none">
        <CardContent className="flex justify-between items-center">
          <div className="lg:w-[60%] w-full flex flex-col gap-6 md:py-20 py-10">
            <div className="flex md:gap-5 gap-2">
                <div className="flex md:text-sm text-[10px] gap-1 font-medium border-b border-l border-black p-1"><SquareCheck size={20} />Customizable AI Roles</div>
                <div className="flex md:text-sm text-[10px] gap-1 font-medium border-b border-black p-1"><SquareCheck size={20} />Context-Aware Responses</div>
                <div className="flex md:text-sm text-[10px] gap-1 font-medium border-b border-r border-black p-1"><SquareCheck size={20} />Post-Call Intelligence</div>
            </div>
            <p className="lg:text-6xl md:text-5xl text-4xl font-semibold">Conversations Reimagined.</p>
            <p className="lg:text-6xl md:text-5xl text-4xl font-semibold">Intelligence Included.</p>
            <p className="lg:text-xl md:text-lg text-base font-medium">AI agents that join, listen, and contribute in real time.</p>
            <div className="flex md:gap-5 gap-2.5">
              <Link href="/sign-up">
                <Button className="lg:text-base md:text-sm text-xs rounded-none">Create a meeting</Button>
              </Link>
              <Button className="bg-white lg:text-base md:text-sm text-xs text-black border border-black hover:bg-neutral-100 rounded-none">Learn more</Button>
            </div>
          </div>

          <div className="w-[40%] lg:flex hidden flex-col relative py-8">
            <motion.div 
              className="w-[70%] h-[60%] self-start border-l border-b p-3 relative z-10 transform -rotate-6 shadow-xl"
              initial={{ rotate: 0 }}
              animate={{ rotate: [0, -13, 0] }}
              transition={{ duration: 1, ease: "easeInOut" }}
              >
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
           </motion.div>

           <motion.div 
            className="w-[70%] h-[60%] self-end border-t border-l p-3 -mt-25 relative z-30 bg-white transform rotate-6 shadow-lg"
            initial={{ rotate: 0 }}
            animate={{ rotate: [0, 13, 0] }}
            transition={{ duration: 1, ease: "easeInOut" }}
            >
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
                  className="pointer-events-none"
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
           </motion.div>
          </div>
        </CardContent>
      </Card>

      <FeatureMarquee />

      <div id="features" className="flex flex-col justify-center items-center lg:gap-14 md:gap-10 gap-8 lg:py-10 py-5 lg:mx-[5vh] md:mx-[3vh] mx-[1vh]">
                <p className="lg:text-[40px] md:text-3xl text-2xl font-semibold lg:p-3 md:p-2 p-1 border-b-2">Features</p>

                <div className="flex lg:flex-row flex-col lg:gap-14 md:gap-10 gap-8">
                  <Card className="rounded-none lg:px-2 md:px-5 px-1 lg:py-10 md:py-5 py-3 flex-1">
                    <CardContent className="flex items-center lg:gap-4 md:gap-14 gap-8">
                      <Image src="/brain.svg" alt="Brain" width={100} height={100} className="lg:h-[100px] md:h-[82px] h-[62px] lg:w-[100px] md:w-[82px] w-[62px]" />
                      <div className="flex flex-col lg:gap-4 md:gap-3 gap-2">
                        <p className="lg:text-xl md:text-lg text-base font-medium">Intelligent by Design</p>
                        <p className="lg:text-base md:text-sm text-xs">Join meetings with AI agents that actively understand, assist, and enhance collaboration.</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="rounded-none lg:px-2 md:px-5 px-1 lg:py-10 md:py-5 py-3 flex-1">
                    <CardContent className="flex items-center lg:gap-4 md:gap-14 gap-8">
                      <Image src="/flow.svg" alt="Flow" width={100} height={100} className="lg:h-[100px] md:h-[82px] h-[62px] lg:w-[100px] md:w-[82px] w-[62px]" />
                      <div className="flex flex-col lg:gap-4 md:gap-3 gap-2">
                        <p className="lg:text-xl md:text-lg text-base font-medium">Built for Flow</p>
                        <p className="lg:text-base md:text-sm text-xs">Real-time chat, crystal-clear calls, and seamless sync across all your devices.</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="rounded-none lg:px-2 md:px-5 px-1 lg:py-10 md:py-5 py-3 flex-1">
                    <CardContent className="flex items-center lg:gap-4 md:gap-14 gap-8">
                      <Image src="/notes.svg" alt="Notes" width={100} height={100} className="lg:h-[100px] md:h-[82px] h-[62px] lg:w-[100px] md:w-[82px] w-[62px]" />
                      <div className="flex flex-col lg:gap-4 md:gap-3 gap-2">
                        <p className="lg:text-xl md:text-lg text-base font-medium">Beyond the Call</p>
                        <p className="lg:text-base md:text-sm text-xs">Get instant summaries, searchable transcripts, and contextual insights that keep work moving.</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

            </div>

      <div id="workflow" className="flex flex-col justify-center items-center lg:gap-14 md:gap-12 gap-10 py-5 lg:mx-[5vh] md:mx-[3vh] mx-[1vh]">
          <p className="lg:text-[40px] md:text-3xl text-2xl font-semibold lg:p-3 md:p-2 p-1 border-b-2">Workflow</p>

          <div className="flex md:flex-row flex-col md:justify-between justify-center items-center w-full lg:px-32 px-2 md:pb-0 pb-6">
            <div className="flex justify-center items-center rounded-none md:w-[45%] w-[90%] border-b-2 md:px-4 px-2 transform lg:scale-100 md:scale-95 scale-75 overflow-hidden">
              <MotionCard 
                className="rounded-none lg:w-[80%] w-[90%] lg:py-3 md:py-2 py-1"
                initial={{ opacity: 0, y: 80 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                >
              <CardContent className="flex items-center lg:px-3 px-2">
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
              </MotionCard>
            </div>
            <div className="flex flex-col text-center md:gap-4 gap-2 md:mt-0 mt-3">
              <p className="lg:text-xl md:text-lg text-base font-medium">1. Create Your AI Agent</p>
              <p className="lg:text-base md:text-sm text-xs">
                Define your agent’s role, tone, and purpose - from tutor to mentor to sales coach.
              </p>
            </div>
          </div>

          <div className="flex md:flex-row flex-col-reverse md:justify-between justify-center items-center w-full lg:px-32 px-2 md:pb-0 pb-6">
            <div className="flex flex-col text-center md:gap-4 gap-2 lg:pl-20 pl-5 md:mt-0 mt-3">
              <p className="lg:text-xl md:text-lg text-base font-medium">2. Schedule a Meeting</p>
              <p className="lg:text-base md:text-sm text-xs">
                Set up a meeting, select your AI agent, and join the call.
              </p>
            </div>
            <div className="flex justify-center items-center rounded-none md:w-[45%] w-[90%] border-b-2 md:px-4 px-2 transform lg:scale-100 md:scale-95 scale-75 overflow-hidden">
            <MotionCard 
              className="rounded-none lg:w-[80%] w-[90%] lg:py-3 md:py-2 py-1"
              initial={{ opacity: 0, y: 80 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              >
              <CardContent className="flex items-center lg:px-3 px-2">
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
                      className="pointer-events-none"
                    />
                    <p className="lg:text-sm text-xs text-muted-foreground">
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
            </MotionCard>
            </div>
          </div>

          <div className="flex md:flex-row flex-col md:justify-between justify-center items-center w-full lg:px-32 px-2 md:pb-0 pb-6">
            <div className="flex justify-center items-center rounded-none md:w-[45%] w-[90%] border-b-2 md:px-4 px-2 transform lg:scale-100 md:scale-95 scale-75 overflow-hidden">
            <MotionCard 
              className="rounded-none lg:w-[80%] w-[90%] lg:py-3 md:py-2 py-1"
              initial={{ opacity: 0, y: 80 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              >
              <CardContent className="flex flex-col space-y-2 items-center px-2">
                <div className="lg:h-[15vh] h-[8vh] w-[80%] border border-gray-400 flex flex-col justify-center items-center gap-1">
                  <BotIcon size={32} strokeWidth={1} className="border border-gray-800 rounded-full p-1" />
                  <p className="text-xs font-light">Product Analyst Agent</p>
                </div>
                <div className="flex justify-center items-center border">
                  <div className="lg:h-[6vh] h-[4vh] w-[10vh] border border-gray-400 flex flex-col justify-center items-center gap-0">
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
            </MotionCard>
            </div>
            <div className="flex flex-col text-center md:gap-4 gap-2 md:mt-0 mt-3">
              <p className="lg:text-xl md:text-lg text-base font-medium">3. Join and Interact</p>
              <p className="lg:text-base md:text-sm text-xs">
                Collaborate in real time as your agent listens, responds, and participates naturally.
              </p>
            </div>
          </div>
          <div className="flex md:flex-row flex-col-reverse md:justify-between justify-center items-center w-full lg:px-32 px-2 md:pb-0 pb-6">
            <div className="flex flex-col text-center md:gap-4 gap-2 lg:pl-20 pl-5 md:mt-0 mt-3">
              <p className="lg:text-xl md:text-lg text-base font-medium">4. Get Post-Call Intelligence</p>
              <p className="lg:text-base md:text-sm text-xs">
                Access summaries, searchable transcripts, and replays - all generated automatically.
              </p>
            </div>
            <div className="flex justify-center items-center rounded-none md:w-[45%] w-[90%] border-b-2 md:px-4 px-2 transform lg:scale-100 md:scale-95 scale-75 overflow-hidden">
            <MotionCard 
              className="rounded-none lg:w-[80%] w-[90%] lg:py-6 md:py-3 py-2"
              initial={{ opacity: 0, y: 80 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              >
              <CardContent className="flex flex-wrap items-center lg:px-6 px-3">
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
            </MotionCard>
            </div>
          </div>

      </div>

      <div className="flex flex-col justify-center items-center lg:gap-14 md:gap-12 gap-10 py-5 lg:mx-[5vh] md:mx-[3vh] mx-[1vh]">
          <p className="lg:text-[40px] md:text-3xl text-2xl font-semibold lg:p-3 md:p-2 p-1 border-b-2 md:mb-4 mb-2">Pricing Plans</p>

          <div className="flex md:flex-row flex-col justify-center items-center w-full lg:gap-4 gap-0 relative">
            <Card className="rounded-none lg:w-[25%] md:w-[30%] w-[75%] transform md:scale-100 scale-95 relative z-10">
              <CardContent className="flex flex-col justify-center items-center lg:gap-8 gap-4 md:px-6 px-2">
                <div className="flex justify-center items-center lg:gap-8 gap-4">
                  <div className="flex flex-col items-start">
                    <h6 className="font-medium lg:text-xl md:text-lg text-base">Monthly</h6>
                    <p className="text-xs text-neutral-700">For individuals getting started</p>
                  </div>
                  <h4 className="lg:text-3xl md:text-2xl text-xl font-medium flex">12$ <span className="text-xs self-end">/month</span></h4>
                </div>
                <Link href="/sign-up" className="w-full">
                  <Button type="button" className="w-full">Select Plan</Button>
                </Link>
                <div className="flex flex-col items-start w-full gap-y-2.5">
                  <p className="font-medium text-sm mb-4">FEATURES</p>
                  <p className="text-xs font-medium flex items-center gap-x-2.5"><CircleCheckIcon className="size-4 fill-primary text-white" />Unlimited Agents</p>
                  <p className="text-xs font-medium flex items-center gap-x-2.5"><CircleCheckIcon className="size-4 fill-primary text-white" />Unlimited Meetings</p>
                  <p className="text-xs font-medium flex items-center gap-x-2.5"><CircleCheckIcon className="size-4 fill-primary text-white" />Up to 300 minutes total</p>
                  <p className="text-xs font-medium flex items-center gap-x-2.5"><CircleCheckIcon className="size-4 fill-primary text-white" />Full Summaries + Transcripts</p>
                  <p className="text-xs font-medium flex items-center gap-x-2.5"><CircleCheckIcon className="size-4 fill-primary text-white" />Real-time chat & Recording playback</p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-none lg:w-[25%] md:w-[33%] w-[80%] bg-black text-white transform lg:scale-105 md:scale-110 scale-95 relative z-30">
              <CardContent className="flex flex-col justify-center items-center lg:gap-8 gap-4 md:px-6 px-2">
                <div className="flex justify-center items-center lg:gap-8 gap-4">
                  <div className="flex flex-col items-start">
                    <h6 className="font-medium lg:text-xl md:text-lg text-base">Yearly</h6>
                    <p className="text-xs text-neutral-300">For small teams and focused peers</p>
                  </div>
                  <h4 className="lg:text-3xl md:text-2xl text-xl font-medium flex">110$ <span className="text-xs self-end">/year</span></h4>
                </div>
                <Link href="/sign-up" className="w-full">
                  <Button type="button" className="w-full bg-white text-black hover:bg-white/95">Select Plan</Button>
                </Link>
                <div className="flex flex-col items-start w-full gap-y-2.5">
                  <p className="font-medium text-sm mb-4">FEATURES</p>
                  <p className="text-xs font-medium flex items-center gap-x-2.5"><CircleCheckIcon className="size-4 fill-white text-black" />Unlimited Agents</p>
                  <p className="text-xs font-medium flex items-center gap-x-2.5"><CircleCheckIcon className="size-4 fill-white text-black" />Unlimited Meetings</p>
                  <p className="text-xs font-medium flex items-center gap-x-2.5"><CircleCheckIcon className="size-4 fill-white text-black" />Upto 400 minutes total/month</p>
                  <p className="text-xs font-medium flex items-center gap-x-2.5"><CircleCheckIcon className="size-4 fill-white text-black" />Full Summaries + Transcripts</p>
                  <p className="text-xs font-medium flex items-center gap-x-2.5"><CircleCheckIcon className="size-4 fill-white text-black" />Real-time chat & Recording playback</p>
                  <p className="text-xs font-medium flex items-center gap-x-2.5"><CircleCheckIcon className="size-4 fill-white text-black" />Priority background processing</p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-none lg:w-[25%] md:w-[30%] w-[75%] transform md:scale-100 scale-95 relative z-10">
              <CardContent className="flex flex-col justify-center items-center lg:gap-8 gap-4 md:px-6 px-2">
                <div className="flex justify-center items-center lg:gap-8 gap-4">
                  <div className="flex flex-col items-start">
                    <h6 className="font-medium lg:text-xl md:text-lg text-base">Enterprise</h6>
                    <p className="text-xs text-neutral-700">For startups, orgs and educators</p>
                  </div>
                  <h4 className="lg:text-3xl md:text-2xl text-xl font-medium flex">749$ <span className="text-xs self-end">/year</span></h4>
                </div>
                <Link href="/sign-up" className="w-full">
                  <Button type="button" className="w-full">Select Plan</Button>
                </Link>
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

      <div className="flex flex-col justify-center items-center lg:gap-4 gap-2 lg:py-20 py-10 lg:mx-[5vh] md:mx-[2vh] mx-[1vh]">
          <p className="lg:text-[40px] md:text-3xl text-2xl font-semibold text-center flex md:flex-row flex-col-reverse justify-center items-center lg:gap-4 md:gap-3 gap-2">Experience the future of conversations with Wiora <Image src="/ai-voice.svg" alt="Ai" height={38} width={38} className="lg:h-[38px] lg:w-[38px] h-[27px] w-[27px]" /></p>
          <p className="lg:text-lg md:text-base text-sm font-medium text-center text-black/75">Start your first AI-Powered meeting today and see how effortless collaboration can be.</p>
          <Link href="/sign-up" className="md:w-[20%] w-[40%] lg:h-[6vh] h-[3.5vh]">
            <Button className="w-full h-full lg:text-base text-xs">Get Started for Free</Button>
          </Link>
      </div>

      <Card className=" px-2 py-3 lg:mx-[5vh] md:mx-[3vh] mx-[1vh] rounded-none mb-6">
        <CardContent className="flex justify-between md:px-6 px-2">
          <p className="md:text-lg text-base font-medium cursor-pointer">Wiora <span className="font-normal md:text-xs text-[10px] cursor-default">© All Rights Reserved.</span></p>
          <div className="w-[40%] flex justify-end items-center md:gap-x-8 gap-x-3">
            <p className="text-xs cursor-pointer">Docs</p>
            <p className="text-xs cursor-pointer">Privacy</p>
            <p className="text-xs cursor-pointer md:block hidden">Terms</p>
            <p className="text-xs cursor-pointer md:block hidden">Help</p>
            <p className="text-xs cursor-pointer">Contact</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
};
