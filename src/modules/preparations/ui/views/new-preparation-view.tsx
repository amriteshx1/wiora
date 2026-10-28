"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useTRPC } from "@/trpc/client";

import { conversationTypes, preparationPacks } from "../../types";

export const NewPreparationView = () => {
  const trpc = useTRPC();
  const router = useRouter();
  const createPreparation = useMutation(
    trpc.preparations.create.mutationOptions({}),
  );

  const onChoose = async (conversationType: (typeof conversationTypes)[number]) => {
    const pack = preparationPacks[conversationType];
    try {
      const created = await createPreparation.mutateAsync({
        conversationType,
        title: pack.label,
      });
      router.push(`/preparations/${created.id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not create the preparation";
      toast.error(message);
    }
  };

  return (
    <div className="flex-1 px-4 pb-8 md:px-8">
      <div className="py-4">
        <h5 className="font-medium text-xl">New preparation</h5>
        <p className="mt-1 max-w-xl text-sm text-muted-foreground">
          Pick the conversation you are preparing for. You can fill in the details on the next page.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {conversationTypes.map((type) => {
          const pack = preparationPacks[type];
          return (
            <Button
              key={type}
              type="button"
              variant="outline"
              disabled={createPreparation.isPending}
              className="h-auto items-start justify-start whitespace-normal px-4 py-4 text-left"
              onClick={() => void onChoose(type)}
            >
              <span className="flex flex-col gap-1">
                <span className="font-medium">{pack.label}</span>
                <span className="text-sm font-normal text-muted-foreground">
                  {pack.description}
                </span>
              </span>
            </Button>
          );
        })}
      </div>
    </div>
  );
};
