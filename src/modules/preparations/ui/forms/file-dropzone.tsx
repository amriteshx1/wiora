"use client";

import { useState } from "react";
import { toast } from "sonner";
import { XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";

import type { DocumentSlot } from "../../types";

type ReadyFile = {
  id: string;
  fileName: string;
  slot: DocumentSlot;
};

interface Props {
  preparationId: string;
  slot: DocumentSlot;
  label: string;
  multiple: boolean;
  files: ReadyFile[];
  onUploaded: (file: ReadyFile) => void;
  onRemoved: (documentId: string) => void;
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
  const slotFiles = files.filter((file) => file.slot === slot);
  const createUpload = useMutation(trpc.preparations.createUpload.mutationOptions({}));
  const confirmUpload = useMutation(trpc.preparations.confirmUpload.mutationOptions({}));
  const removeDocument = useMutation(trpc.preparations.removeDocument.mutationOptions({}));

  const onSelect = async (list: FileList | null) => {
    if (!list || list.length === 0) {
      return;
    }

    const selected = multiple ? Array.from(list) : [list[0]];
    setUploading(true);

    try {
      for (const file of selected) {
        const created = await createUpload.mutateAsync({
          preparationId,
          fileName: file.name,
          contentType: file.type || "application/octet-stream",
          byteSize: file.size,
        });

        const response = await fetch(created.uploadUrl, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type || "application/octet-stream" },
        });

        if (!response.ok) {
          throw new Error("The upload did not finish");
        }

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
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium">{label}</p>
        <label className="text-sm">
          <input
            className="hidden"
            type="file"
            multiple={multiple}
            disabled={uploading || (!multiple && slotFiles.length > 0)}
            onChange={(event) => {
              void onSelect(event.target.files);
              event.target.value = "";
            }}
          />
          <span className="inline-flex h-8 cursor-pointer items-center rounded-md border px-3">
            {uploading ? "Uploading" : "Upload"}
          </span>
        </label>
      </div>
      {slotFiles.map((file) => (
        <div key={file.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
          <span className="truncate">{file.fileName}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={removeDocument.isPending}
            onClick={async () => {
              try {
                await removeDocument.mutateAsync({ documentId: file.id });
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
