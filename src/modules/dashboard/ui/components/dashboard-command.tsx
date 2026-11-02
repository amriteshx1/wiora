import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Dispatch, SetStateAction, useState } from "react";

import { CommandResponsiveDialog, CommandInput, CommandItem, CommandList, CommandGroup, CommandEmpty } from "@/components/ui/command";
import { useTRPC } from "@/trpc/client";

interface Props {
    open: boolean;
    setOpen: Dispatch<SetStateAction<boolean>>;
}

export const DashboardCommand = ({ open, setOpen }: Props) => {
    const router = useRouter();
    const [search, setSearch] = useState("");
    const trpc = useTRPC();
    const preparations = useQuery(
        trpc.preparations.getMany.queryOptions({
            search,
            pageSize: 100,
        })
    );

    return (
        <CommandResponsiveDialog shouldFilter={false} open={open} onOpenChange={setOpen}>
            <CommandInput
             placeholder="Find a preparation..."
             value={search}
             onValueChange={(value) => setSearch(value)}
            />
            <CommandList>
                <CommandGroup heading="Preparations">
                    <CommandEmpty>
                        <span className="text-muted-foreground text-sm">
                            No preparations found
                        </span>
                    </CommandEmpty>
                    {preparations.data?.items.map((preparation) => (
                        <CommandItem
                          onSelect={() => {
                            router.push(`/preparations/${preparation.id}`);
                            setOpen(false);
                          }}
                          key={preparation.id}
                        >
                            {preparation.title}
                        </CommandItem>
                    ))}
                </CommandGroup>
            </CommandList>
        </CommandResponsiveDialog>
    );
};
