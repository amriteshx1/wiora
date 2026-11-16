"use client";

import { useState } from "react";
import { toast } from "sonner";
import { UploadIcon, XIcon } from "lucide-react";
import { useMutation } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { useTRPC } from "@/trpc/client";
import { cn } from "@/lib/utils";

import type { DocumentSlot } from "../../types";

export type ReadyFile = {
  id: string;
  fileName: string;
  slot: DocumentSlot;
  file?: File;
};

interface Props {
  preparationId?: string | null;
  slot: DocumentSlot;
  label: string;
  multiple: boolean;
  files: ReadyFile[];
  onUploaded: (file: ReadyFile) => void;
  onRemoved: (documentId: string) => void;
}

export function putFile(url: string, file: File, contentType: string, onProgress: (value: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("PUT", url);
    request.setRequestHeader("Content-Type", contentType);
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    request.onload = () => {
      if (request.status >= 200 && request.status < 300) resolve();
      else reject(new Error("The upload did not finish"));
    };
    request.onerror = () => reject(new Error("The upload did not finish"));
    request.send(file);
  });
}

function isLocalFile(id: string) {
  return id.startsWith("local:");
}

export function FileDropzone({
  preparationId,
  slot,
  label,
  multiple,
  files,
  onUploaded,
  onRemoved,
}: Props) {
  const trpc = useTRPC();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const slotFiles = files.filter((file) => file.slot === slot);
  const createUpload = useMutation(trpc.preparations.createUpload.mutationOptions({}));
  const confirmUpload = useMutation(trpc.preparations.confirmUpload.mutationOptions({}));
  const removeDocument = useMutation(trpc.preparations.removeDocument.mutationOptions({}));
  const blocked = uploading || (!multiple && slotFiles.length > 0);

  const onSelect = async (list: FileList | null) => {
    if (!list || list.length === 0) return;
    const selected = multiple ? Array.from(list) : [list[0]];
    if (!preparationId) {
      for (const file of selected) {
        onUploaded({
          id: `local:${crypto.randomUUID()}`,
          fileName: file.name,
          slot,
          file,
        });
      }
      return;
    }
    setUploading(true);
    setProgress(0);
    try {
      for (const file of selected) {
        const created = await createUpload.mutateAsync({
          preparationId,
          fileName: file.name,
          contentType: file.type || "application/octet-stream",
          byteSize: file.size,
        });
        await putFile(
          created.uploadUrl,
          file,
          file.type || "application/octet-stream",
          setProgress,
        );
        await confirmUpload.mutateAsync({ documentId: created.documentId });
        onUploaded({
          id: created.documentId,
          fileName: file.name,
          slot,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed";
      toast.error(message);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-sm">{label}</p>
      <div className="overflow-hidden rounded-xl border border-dashed">
        <label
          className={cn(
            "flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 px-4 py-6 text-sm text-muted-foreground",
            dragOver && "bg-muted",
            blocked && "cursor-not-allowed opacity-60",
          )}
          onDragOver={(event) => {
            event.preventDefault();
            if (!blocked) setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragOver(false);
            if (!blocked) void onSelect(event.dataTransfer.files);
          }}
        >
          <input
            className="hidden"
            type="file"
            multiple={multiple}
            disabled={blocked}
            onChange={(event) => {
              void onSelect(event.target.files);
              event.target.value = "";
            }}
          />
          <UploadIcon className="size-4" />
          <span>{uploading ? "Uploading" : "Drop a file here, or choose one"}</span>
        </label>
        {uploading ? (
          <div className="h-px w-full bg-border">
            <div
              className="h-px bg-foreground transition-[width] duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
        ) : null}
      </div>
      {slotFiles.map((file) => (
        <div key={file.id} className="flex items-center justify-between rounded-xl border px-3 py-2 text-sm">
          <span className="truncate">{file.fileName}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={removeDocument.isPending}
            onClick={async () => {
              try {
                if (preparationId && !isLocalFile(file.id)) {
                  await removeDocument.mutateAsync({ documentId: file.id });
                }
                onRemoved(file.id);
              } catch (error) {
                const message = error instanceof Error ? error.message : "Could not remove the file";
                toast.error(message);
              }
            }}
          >
            <XIcon className="size-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}
