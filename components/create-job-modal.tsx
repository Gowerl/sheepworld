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

      // Vollständiges Mapping basierend auf der neuen 7-Flow-Struktur
      const jobData = {
        job_id: customId,
        status: "created",
        createdAt: serverTimestamp(),
        
        // Shop & Produkt Info
        product_shop_title: formData.get("product_shop_title"),
        product_shop_description: formData.get("product_shop_description"),
        product_shop_url: formData.get("product_shop_url"),
        brand: formData.get("brand") || "Sheepworld",
        
        // Physische Maße
        product_width_cm: formData.get("width"),
        product_height_cm: formData.get("height"),
        mascot_size_in_cm: "170",
        
        // Media Assets
        product_image: productGCS,
        product_image_http: productHTTP,
        
        // KI & Creative Settings
        environment: formData.get("environment"),
        mood: formData.get("mood"),
        voiceover_style: formData.get("mood"), 
        character: "sheep mascot",
        
        // Technische Settings
        resolution: formData.get("resolution"),
        aspect_ratio: formData.get("resolution") === "2048x1152" ? "16:9" : "9:16",
        
        // Platzhalter für n8n Flows & Assets
        scene_version: 1,
        scene_prompt_final: "",
        scene_image_http: "",
        scene_image_with_product_http: "",
        scene_image_endframe_http: "",
        video_url_without_sound_http: "",
        audio_file_http: "",
        video_url_with_sound_http: "",

        // Angepasster flowStatus für 7 Schritte
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

      // Trigger für den ersten Workflow (Scene Generation)
      await fetch("https://myc3.app.n8n.cloud/webhook-test/generate-scene", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: customId }),
      });

      setOpen(false);
    } catch (error) {
      console.error("Fehler:", error);
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 shadow-md">+ Neuer Job</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Neuen Video-Job anlegen</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="grid grid-cols-2 gap-4 border-b pb-4">
            <div className="space-y-2">
              <Label htmlFor="customId" className="font-semibold">Eindeutige Job-ID</Label>
              <Input id="customId" name="customId" placeholder="z.B. Tasse-Garten-01" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product_shop_title" className="font-semibold">Shop Titel</Label>
              <Input id="product_shop_title" name="product_shop_title" placeholder="z.B. Becher Einhorn" required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="product_shop_description" className="font-semibold">Shop Beschreibung (KI Kontext)</Label>
            <Textarea 
              id="product_shop_description" 
              name="product_shop_description" 
              placeholder="Kopiere hier den Text von der Homepage hinein..." 
              className="min-h-[100px]"
              required 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="product_shop_url" className="font-semibold">Shop URL</Label>
              <Input id="product_shop_url" name="product_shop_url" type="url" placeholder="https://www.sheepworld.de/..." required />
            </div>
            <div className="space-y-2">
              <Label className="font-semibold">Auflösung / Format</Label>
              <Select name="resolution" required defaultValue="2048x1152">
                <SelectTrigger><SelectValue placeholder="Wählen..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="2048x1152">2048x1152 (Landscape 16:9)</SelectItem>
                  <SelectItem value="1152x2048">1152x2048 (Portrait 9:16)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 border-t pt-4">
             <div className="space-y-2">
              <Label className="font-semibold">Umgebung</Label>
              <Select name="environment" required>
                <SelectTrigger><SelectValue placeholder="Wählen..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="kitchen">Küche</SelectItem>
                  <SelectItem value="living_room">Wohnzimmer</SelectItem>
                  <SelectItem value="garden">Garten</SelectItem>
                  <SelectItem value="pool_side">Pool</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="font-semibold">Stimmung</Label>
              <Select name="mood" required>
                <SelectTrigger><SelectValue placeholder="Wählen..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cozy">Gemütlich</SelectItem>
                  <SelectItem value="bright_airy">Hell</SelectItem>
                  <SelectItem value="cinematic">Cinematic</SelectItem>
                </SelectContent>
              </Select>
            </div>
             <div className="space-y-2">
              <Label htmlFor="productImage" className="font-semibold">Produktbild</Label>
              <Input id="productImage" name="productImage" type="file" accept="image/*" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="width" className="font-semibold">Produkt-Breite (cm)</Label>
              <Input id="width" name="width" type="number" placeholder="8" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height" className="font-semibold">Produkt-Höhe (cm)</Label>
              <Input id="height" name="height" type="number" placeholder="12" required />
            </div>
          </div>

          {loading && (
            <div className="space-y-2 pt-2 border-t">
              <div className="flex justify-between text-sm font-bold text-blue-600">
                <span>{uploadProgress < 100 ? "Bild wird übertragen..." : "Job wird gestartet..."}</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3">
                <div 
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(37,99,235,0.5)]"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          <Button type="submit" className="w-full h-12 text-lg font-bold" disabled={loading}>
            {loading ? "Bitte warten..." : "Job jetzt absenden"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}