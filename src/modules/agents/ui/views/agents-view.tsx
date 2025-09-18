"use client";

import { useQuery } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";
import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/loading-state";

export const AgentsView = () => {
    const trpc = useTRPC();
    const { data, isLoading, isError } = useQuery(trpc.agents.getMany.queryOptions());

    if(isLoading){
        return (
            <LoadingState 
              title="Loading Agents"
              description="This may take a few seconds"
            />
        )
    };

    if(isError){
        return(
            <ErrorState
              title="Error Loading Agents"
              description="Please try again later"
            />
        )
    };
    
    return (
        <div>
            {JSON.stringify(data, null, 2)}
        </div>
    );
};
