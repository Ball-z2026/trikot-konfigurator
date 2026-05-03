import { useState, useRef, useCallback } from "react";
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Loader2, RotateCcw, RotateCw, ZoomIn, Crop as CropIcon, Undo2 } from "lucide-react";

interface LogoCropEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  sponsorName: string;
  onSave: (croppedBlob: Blob) => void;
  isSaving?: boolean;
}

function centerAspectCrop(mediaWidth: number, mediaHeight: number) {
  return centerCrop(
    makeAspectCrop(
      { unit: "%", width: 90 },
      undefined as any,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

/**
 * Erzeugt ein Canvas mit dem zugeschnittenen Bild.
 */
async function getCroppedCanvas(
  image: HTMLImageElement,
  crop: PixelCrop,
  rotation: number,
  scale: number
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context nicht verfügbar");

  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  const pixelCrop = {
    x: crop.x * scaleX,
    y: crop.y * scaleY,
    width: crop.width * scaleX,
    height: crop.height * scaleY,
  };

  // Rotation berücksichtigen
  const rotRad = (rotation * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rotRad));
  const sin = Math.abs(Math.sin(rotRad));

  // Canvas-Größe = zugeschnittener Bereich
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // Transparenter Hintergrund
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Transformation anwenden
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(rotRad);
  ctx.scale(scale, scale);
  ctx.translate(-canvas.width / 2, -canvas.height / 2);

  // Bild zeichnen (verschoben um den Crop-Bereich)
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  ctx.restore();
  return canvas;
}

export function LogoCropEditor({
  open,
  onOpenChange,
  imageUrl,
  sponsorName,
  onSave,
  isSaving = false,
}: LogoCropEditorProps) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const newCrop = centerAspectCrop(width, height);
    setCrop(newCrop);
  }, []);

  const handleReset = () => {
    setScale(1);
    setRotation(0);
    if (imgRef.current) {
      const { width, height } = imgRef.current;
      const newCrop = centerAspectCrop(width, height);
      setCrop(newCrop);
    }
  };

  const handleSave = async () => {
    if (!imgRef.current || !completedCrop) return;

    try {
      const canvas = await getCroppedCanvas(imgRef.current, completedCrop, rotation, scale);
      canvas.toBlob(
        (blob) => {
          if (blob) onSave(blob);
        },
        "image/png",
        1
      );
    } catch (err) {
      console.error("Fehler beim Zuschneiden:", err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CropIcon className="w-5 h-5" />
            Logo zuschneiden: {sponsorName}
          </DialogTitle>
          <DialogDescription>
            Ziehen Sie den Auswahlrahmen, um den gewünschten Bereich auszuwählen. Passen Sie Zoom und Rotation nach Bedarf an.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Crop-Bereich */}
          <div className="flex items-center justify-center bg-muted/30 rounded-lg p-2 min-h-[300px] max-h-[400px] overflow-hidden">
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompletedCrop(c)}
              className="max-h-[380px]"
            >
              <img
                ref={imgRef}
                src={imageUrl}
                alt={sponsorName}
                onLoad={onImageLoad}
                style={{
                  transform: `scale(${scale}) rotate(${rotation}deg)`,
                  maxHeight: "380px",
                  objectFit: "contain",
                }}
                crossOrigin="anonymous"
              />
            </ReactCrop>
          </div>

          {/* Steuerungen */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Zoom */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm">
                <ZoomIn className="w-4 h-4" />
                Zoom: {Math.round(scale * 100)}%
              </Label>
              <Slider
                value={[scale]}
                min={0.5}
                max={3}
                step={0.05}
                onValueChange={([v]) => setScale(v)}
              />
            </div>

            {/* Rotation */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm">
                <RotateCw className="w-4 h-4" />
                Rotation: {rotation}°
              </Label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setRotation((r) => r - 90)}
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
                <Slider
                  value={[rotation]}
                  min={-180}
                  max={180}
                  step={1}
                  onValueChange={([v]) => setRotation(v)}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setRotation((r) => r + 90)}
                >
                  <RotateCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleReset} className="gap-2">
            <Undo2 className="w-4 h-4" />
            Zurücksetzen
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button
              onClick={handleSave}
              disabled={!completedCrop || isSaving}
              className="gap-2"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CropIcon className="w-4 h-4" />
              )}
              {isSaving ? "Wird gespeichert..." : "Zuschnitt speichern"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
