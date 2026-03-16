'use client';

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { db } from "@/src/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Loader2, Sparkles, ZoomIn, Play, Image as ImageIcon,
  Film, Mic, RefreshCcw, Download, Box, MapPin, Ruler,
  ArrowLeft, Activity, Code2, FileText
} from "lucide-react";

export default function JobDetailClient() {
  const { id } = useParams();
  const router = useRouter();
  const [job, setJob] = useState<any>(null);
  const [zoomImage, setZoomImage] = useState<{src: string, title: string} | null>(null);
  const [isTriggering, setIsTriggering] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  const steps = [
    { key: 'flow1_scene', label: '1. Scene', webhook: "https://myc3.app.n8n.cloud/webhook-test/generate-scene", color: "bg-blue-500", glow: "#3b82f6" },
    { key: 'flow2_startframe', label: '2. Startframe', webhook: "https://myc3.app.n8n.cloud/webhook-test/generate-startframe", color: "bg-cyan-500", glow: "#06b6d4" },
    { key: 'flow3_endframe', label: '3. Endframe', webhook: "https://myc3.app.n8n.cloud/webhook-test/generate-endframe", color: "bg-indigo-500", glow: "#6366f1" },
    { key: 'flow4_video_silent', label: '4. Video', webhook: "https://myc3.app.n8n.cloud/webhook-test/generate-video-silent", color: "bg-purple-500", glow: "#a855f7" },
    { key: 'flow5_voiceover', label: '5. Voiceover', webhook: "https://myc3.app.n8n.cloud/webhook-test/generate-voiceover", color: "bg-pink-500", glow: "#ec4899" },
    { key: 'flow6_muxing', label: '6. Final Video', webhook: "https://myc3.app.n8n.cloud/webhook-test/mux-video", color: "bg-green-500", glow: "#22c55e" }
  ];

  useEffect(() => {
    setIsClient(true);
    if (!id || id === 'index') return;
    
    const unsubscribe = onSnapshot(doc(db, "jobs", id as string), (docSnapshot) => {
      if (docSnapshot.exists()) setJob(docSnapshot.data());
    });
    return () => unsubscribe();
  }, [id]);

  const activeStepKey = (() => {
    if (!job?.flowStatus) return null;
    for (const step of steps) {
      if (job.flowStatus[step.key] === 'waiting') return step.key;
    }
    return null;
  })();

  const triggerFlow = async (flowKey: string, webhookUrl: string) => {
    setIsTriggering(flowKey);
    try {
      await fetch(webhookUrl, { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ jobId: id }) 
      });
    } catch (error) {
      console.error("Flow Trigger Error:", error);
    } finally { 
      setIsTriggering(null); 
    }
  };

  const AssetCard = ({ title, src, type, jobKey, icon: Icon, colorClass, glowColor }: any) => (
    <Card className={`relative group border-zinc-800 bg-zinc-900/40 backdrop-blur-md overflow-hidden transition-all duration-500 hover:border-zinc-400 shadow-2xl ${src ? `hover:shadow-[0_0_20px_${glowColor}33]` : ''}`}>
      {job?.flowStatus?.[jobKey] === 'processing' && (
        <div className="absolute inset-0 z-10 pointer-events-none">
          <div className={`w-full h-[2px] ${colorClass} shadow-[0_0_15px_${glowColor}] animate-scan opacity-70`} />
        </div>
      )}
      <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0 bg-black/20 text-left">
        <CardTitle className="text-[10px] uppercase tracking-[0.2em] font-black text-zinc-500 flex items-center gap-2">
          {Icon && <Icon size={14} className="opacity-50" />} {title}
        </CardTitle>
        {src && <div className={`w-2 h-2 rounded-full ${colorClass} animate-pulse`} />}
      </CardHeader>
      <CardContent className="p-0 relative aspect-video bg-zinc-950 flex items-center justify-center overflow-hidden">
        {src ? (
          type === 'video' ? (
            <video src={src} controls className="w-full h-full object-cover bg-black" />
          ) : (
            <div className="cursor-zoom-in w-full h-full group/img" onClick={() => setZoomImage({src, title})}>
              <img 
                src={src} 
                className={`w-full h-full ${title.includes('PRODUCT') ? 'object-contain p-6' : 'object-cover'} transition-transform duration-700 group-hover/img:scale-105`} 
                alt={title} 
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                <ZoomIn className="text-white w-6 h-6" />
              </div>
            </div>
          )
        ) : (
          <div className="flex flex-col items-center gap-2 opacity-20">
            {job?.flowStatus?.[jobKey] === 'processing' ? <Loader2 className="animate-spin text-blue-500 w-6 h-6" /> : <Activity className="w-6 h-6" />}
            <span className="text-[8px] font-black uppercase tracking-widest italic">Awaiting Stream</span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (!job) return (
    <div className="p-20 text-center bg-[#030303] min-h-screen text-white flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-blue-600" />
      <p className="text-xs uppercase tracking-widest opacity-50">Loading Node Data...</p>
    </div>
  );

  return (
    <main className="p-8 max-w-[1800px] mx-auto space-y-10 min-h-screen bg-[#030303] text-white selection:bg-blue-500/30 text-left">
      <style jsx global>{`
        @keyframes scan { 0% { transform: translateY(-100%); } 100% { transform: translateY(400%); } }
        .animate-scan { animation: scan 3s linear infinite; }
      `}</style>

      {zoomImage && (
        <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-8 cursor-zoom-out" onClick={() => setZoomImage(null)}>
          <img src={zoomImage.src} className="max-w-full max-h-[90vh] rounded-xl shadow-2xl border border-white/5" alt="Zoom" />
        </div>
      )}

      <div className="flex justify-between items-end border-b border-zinc-900 pb-10 text-left">
        <div className="space-y-4 text-left">
          <Button onClick={() => router.push('/')} variant="ghost" className="text-zinc-600 hover:text-white p-0 h-auto gap-2 text-[9px] uppercase tracking-[0.3em] font-black transition-all">
            <ArrowLeft size={14} /> [ DISCONNECT_FROM_FLEET ]
          </Button>
          <div className="space-y-1 text-left">
            <div className="flex items-center gap-4 mb-2">
              <Badge className="bg-blue-500/5 text-blue-500 border-blue-500/20 font-mono px-3 uppercase tracking-tighter text-left">NODE_ID: {id}</Badge>
              <div className="flex items-center gap-2 text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Stream_Active
              </div>
            </div>
            <h1 className="text-7xl font-black tracking-tighter bg-gradient-to-b from-white to-zinc-600 bg-clip-text text-transparent italic text-left">
              {job?.product_shop_title || "ALPHA_SEQUENCE"}
            </h1>
          </div>
        </div>
        {job?.video_url_with_sound_http && (
          <Button onClick={() => window.open(job.video_url_with_sound_http, '_blank')} className="bg-white text-black hover:bg-zinc-200 font-black h-16 px-12 rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.1)] transition-all active:scale-95 group">
            <Download size={22} className="mr-3 group-hover:animate-bounce" /> DOWNLOAD_FINAL_MASTER
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-6 gap-10">
        <div className="lg:col-span-1 space-y-8">
          <section className="space-y-4 text-left">
            <h3 className="text-[10px] uppercase tracking-[0.4em] font-black text-zinc-700 px-1 text-left">Command_Protocol</h3>
            <div className="space-y-2">
              {steps.map((s) => {
                const stat = job?.flowStatus?.[s.key] || 'waiting';
                const isActive = activeStepKey === s.key || stat === 'done';
                return (
                  <Button key={s.key} onClick={() => triggerFlow(s.key, s.webhook)} disabled={!isActive || !!isTriggering} className={`w-full h-auto p-4 justify-between border-none rounded-2xl transition-all duration-300 ${stat === 'done' ? 'bg-zinc-900 text-zinc-500' : isActive ? 'bg-blue-600 text-white shadow-xl shadow-blue-950/50' : 'bg-zinc-950/20 text-zinc-800 opacity-20'}`}>
                    <span className="text-[10px] font-black uppercase text-left">{s.label}</span>
                    {stat === 'processing' || isTriggering === s.key ? <Loader2 className="animate-spin w-4 h-4" /> : stat === 'done' ? <RefreshCcw size={14} /> : <Play size={14} />}
                  </Button>
                );
              })}
            </div>
          </section>
        </div>

        <div className="lg:col-span-5 space-y-12 text-left">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AssetCard title="01_BASE_PRODUCT" src={job?.product_image_http} jobKey="none" icon={Box} colorClass="bg-orange-500" glowColor="#f97316" />
            <AssetCard title="02_CREATIVE_SCENE" src={job?.scene_image_http} jobKey="flow1_scene" icon={Sparkles} colorClass="bg-blue-500" glowColor="#3b82f6" />
            <AssetCard title="03_START_FRAME" src={job?.scene_image_with_product_http} jobKey="flow2_startframe" icon={ImageIcon} colorClass="bg-cyan-500" glowColor="#06b6d4" />
            <AssetCard title="04_END_FRAME" src={job?.scene_image_endframe_http} jobKey="flow3_endframe" icon={ImageIcon} colorClass="bg-indigo-500" glowColor="#6366f1" />
            <AssetCard title="05_SILENT_RENDER" src={job?.video_url_without_sound_http} jobKey="flow4_video_silent" type="video" icon={Film} colorClass="bg-purple-500" glowColor="#a855f7" />
            <AssetCard title="06_FINAL_MASTER" src={job?.video_url_with_sound_http} jobKey="flow6_muxing" type="video" icon={Play} colorClass="bg-green-500" glowColor="#22c55e" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <Card className="bg-zinc-950 border border-zinc-900 rounded-3xl overflow-hidden shadow-2xl text-left">
              <CardHeader className="py-4 px-6 bg-zinc-900/30 border-b border-zinc-900 flex flex-row items-center justify-between text-left">
                <div className="flex items-center gap-3">
                  <Mic size={14} className="text-pink-500 animate-pulse"/>
                  <span className="text-[10px] uppercase font-black text-zinc-500 tracking-widest text-left">Aural_Processing</span>
                </div>
                {job?.audio_file_http && <Badge className="bg-pink-500/10 text-pink-500 border-none text-[8px]">SYNTH_DONE</Badge>}
              </CardHeader>
              <CardContent className="p-8 space-y-6 text-left">
                <div className="flex items-end gap-[2px] h-12 justify-center opacity-30">
                  {[...Array(20)].map((_, i) => (
                    <div 
                      key={i} 
                      className="w-1 bg-pink-500 rounded-full animate-bounce" 
                      style={{ 
                        height: isClient ? `${Math.random() * 100}%` : '50%', 
                        animationDelay: `${i * 0.1}s` 
                      }} 
                    />
                  ))}
                </div>
                {job?.audio_file_http ? (
                  <audio src={job.audio_file_http} controls className="w-full h-10 accent-pink-500" />
                ) : <div className="text-center text-[9px] text-zinc-800 uppercase font-bold tracking-widest italic text-left">Awaiting Sonic DNA...</div>}
              </CardContent>
            </Card>

            <Card className="bg-zinc-950 border border-zinc-900 rounded-3xl overflow-hidden lg:col-span-2 shadow-2xl text-left">
              <CardHeader className="py-4 px-6 bg-zinc-900/30 border-b border-zinc-900 flex items-center gap-3 text-left">
                <Code2 size={14} className="text-orange-500"/>
                <span className="text-[10px] uppercase font-black text-zinc-500 tracking-widest text-left">Metadata_Pointers</span>
              </CardHeader>
              <CardContent className="p-0 text-left">
                <div className="grid grid-cols-3 divide-x divide-zinc-900 border-b border-zinc-900 bg-black/40 text-left">
                  <div className="p-6 text-left">
                    <p className="text-[9px] text-zinc-700 font-black uppercase mb-2 flex items-center gap-2 text-left"><MapPin size={12}/> World</p>
                    <p className="text-xs font-bold text-zinc-400 text-left">{job?.environment || "UNDEFINED"}</p>
                  </div>
                  <div className="p-6 text-left">
                    <p className="text-[9px] text-zinc-700 font-black uppercase mb-2 flex items-center gap-2 text-left"><Sparkles size={12}/> Mood</p>
                    <p className="text-xs font-bold text-zinc-400 text-left">{job?.mood || "UNDEFINED"}</p>
                  </div>
                  <div className="p-6 text-left">
                    <p className="text-[9px] text-zinc-700 font-black uppercase mb-2 flex items-center gap-2 text-left"><Ruler size={12}/> Units</p>
                    <p className="text-xs font-bold text-zinc-400 text-left">{job?.product_width_cm}x{job?.product_height_cm}</p>
                  </div>
                </div>
                <div className="p-8 space-y-4 text-left">
                  <p className="text-[9px] text-zinc-700 font-black uppercase tracking-widest flex items-center gap-2 text-left"><FileText size={12}/> Injected_Prompt_DNA</p>
                  <div className="text-[11px] font-mono text-zinc-500 leading-relaxed bg-black/60 p-5 rounded-2xl border border-zinc-900 italic max-h-32 overflow-y-auto scrollbar-hide text-left">
                    {job?.scene_prompt_final || "// NO_SEQUENCE_DATA_FOUND"}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}