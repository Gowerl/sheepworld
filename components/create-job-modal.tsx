'use client';

import { useState } from "react";
import { db, storage } from "../src/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function CreateJobModal() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setUploadProgress(0);

    const formData = new FormData(e.currentTarget);
    const customId = formData.get("customId") as string;
    const productImageFile = formData.get("productImage") as File;
    
    try {
      let productGCS = "";
      let productHTTP = "";

      if (productImageFile && productImageFile.size > 0) {
        const storagePath = `jobs/${customId}/productimage/${productImageFile.name}`;
        const storageRef = ref(storage, storagePath);
        const uploadTask = uploadBytesResumable(storageRef, productImageFile);

        await new Promise((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(progress);
            },
            (error) => reject(error),
            async () => {
              productGCS = `gs://${uploadTask.snapshot.metadata.bucket}/${uploadTask.snapshot.metadata.fullPath}`;
              productHTTP = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(true);
            }
          );
        });
      }

      const jobData = {
        job_id: customId,
        status: "created",
        createdAt: serverTimestamp(),
        
        product_shop_title: formData.get("product_shop_title"),
        product_shop_description: formData.get("product_shop_description"),
        product_shop_url: formData.get("product_shop_url"),
        brand: formData.get("brand") || "Sheepworld",
        
        product_width_cm: formData.get("width"),
        product_height_cm: formData.get("height"),
        mascot_size_in_cm: "170",
        
        product_image: productGCS,
        product_image_http: productHTTP,
        
        environment: formData.get("environment"),
        mood: formData.get("mood"),
        voiceover_style: formData.get("mood"), 
        character: "sheep mascot",
        
        resolution: formData.get("resolution"),
        aspect_ratio: formData.get("resolution") === "2048x1152" ? "16:9" : "9:16",
        
        scene_version: 1,
        scene_prompt_final: "",
        scene_image_http: "",
        scene_image_with_product_http: "",
        scene_image_endframe_http: "",
        video_url_without_sound_http: "",
        audio_file_http: "",
        video_url_with_sound_http: "",

        flowStatus: {
          flow1_scene: "waiting",
          flow2_startframe: "waiting",
          flow3_endframe: "waiting",
          flow4_video_silent: "waiting",
          flow5_voiceover: "waiting",
          flow6_muxing: "waiting",
          flow7_export: "waiting"
        }
      };

      await setDoc(doc(db, "jobs", customId), jobData);

      // PROXY TRIGGER: Nutzt die interne API statt direkten n8n-Aufruf
      // Wir nutzen hier /webhook/ für Production oder /webhook-test/ falls du noch entwickelst
      await fetch("/api/trigger-n8n", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          jobId: customId,
          webhookUrl: "https://myc3.app.n8n.cloud/webhook-test/generate-scene" 
        }),
      });

      setOpen(false);
    } catch (error) {
      console.error("Fehler beim Erstellen des Jobs:", error);
      alert("Fehler beim Webhook-Trigger. Bitte prüfe die Konsole.");
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 shadow-md transition-all uppercase font-black italic tracking-widest text-[10px] h-10 px-6">+ Create Node</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[95vh] overflow-y-auto bg-black text-white border-zinc-800">
        <DialogHeader>
          <DialogTitle className="text-3xl font-black italic tracking-tighter uppercase text-blue-500">Initialize Production Node</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="grid grid-cols-2 gap-4 border-b border-zinc-900 pb-6">
            <div className="space-y-2">
              <Label htmlFor="customId" className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">Job ID (Unique)</Label>
              <Input id="customId" name="customId" className="bg-zinc-900 border-zinc-800 focus:border-blue-500 transition-all text-white font-mono" placeholder="SW-XXXXX" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product_shop_title" className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">Product Hero Title</Label>
              <Input id="product_shop_title" name="product_shop_title" className="bg-zinc-900 border-zinc-800 text-white" placeholder="e.g. Magic Mug" required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="product_shop_description" className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">AI Context Description</Label>
            <Textarea 
              id="product_shop_description" 
              name="product_shop_description" 
              className="min-h-[100px] bg-zinc-900 border-zinc-800 text-white text-xs leading-relaxed"
              placeholder="Paste shop text for AI training..." 
              required 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="product_shop_url" className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">Reference URL</Label>
              <Input id="product_shop_url" name="product_shop_url" type="url" className="bg-zinc-900 border-zinc-800 text-white text-xs" placeholder="https://..." required />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">Format</Label>
              <Select name="resolution" required defaultValue="2048x1152">
                <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white"><SelectValue placeholder="Format..." /></SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                  <SelectItem value="2048x1152">Landscape (16:9)</SelectItem>
                  <SelectItem value="1152x2048">Portrait (9:16)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 border-t border-zinc-900 pt-6">
             <div className="space-y-2">
              <Label className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">Environment</Label>
              <Select name="environment" required>
                <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white"><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                  <SelectItem value="kitchen">Kitchen</SelectItem>
                  <SelectItem value="living_room">Living Room</SelectItem>
                  <SelectItem value="garden">Garden</SelectItem>
                  <SelectItem value="pool_side">Pool</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">Mood</Label>
              <Select name="mood" required>
                <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white"><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                  <SelectItem value="cozy">Cozy</SelectItem>
                  <SelectItem value="bright_airy">Bright</SelectItem>
                  <SelectItem value="cinematic">Cinematic</SelectItem>
                </SelectContent>
              </Select>
            </div>
             <div className="space-y-2">
              <Label htmlFor="productImage" className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">Base Image</Label>
              <Input id="productImage" name="productImage" type="file" accept="image/*" className="bg-zinc-900 border-zinc-800 text-white text-[10px] file:text-blue-500 file:bg-transparent file:border-none" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="width" className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">Width (cm)</Label>
              <Input id="width" name="width" type="number" className="bg-zinc-900 border-zinc-800 text-white" placeholder="8" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height" className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">Height (cm)</Label>
              <Input id="height" name="height" type="number" className="bg-zinc-900 border-zinc-800 text-white" placeholder="12" required />
            </div>
          </div>

          {loading && (
            <div className="space-y-2 pt-2 border-t border-zinc-900">
              <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-blue-400">
                <span>{uploadProgress < 100 ? "Syncing Assets..." : "Triggering Pipeline..."}</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <div className="w-full bg-zinc-900 rounded-full h-1">
                <div 
                  className="bg-blue-600 h-1 rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(37,99,235,0.8)]"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          <Button type="submit" className="w-full h-12 text-sm font-black uppercase italic tracking-[0.2em] bg-blue-600 hover:bg-white hover:text-black transition-all rounded-xl" disabled={loading}>
            {loading ? "Initializing..." : "Engage Pipeline"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}