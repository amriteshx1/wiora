"use client";

import Link from "next/link";
import { useSuspenseQuery } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";
import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/loading-state";

export const UpgradeView = () => {
    const trpc = useTRPC();
    const { data: products } = useSuspenseQuery(trpc.premium.getSessionProducts.queryOptions());

    return (
        <div className="flex-1 py-4 px-4 md:px-8 flex flex-col gap-y-10">
            <div className="mt-4 flex-1 flex flex-col gap-y-6 items-center">
                <h5 className="font-medium text-2xl md:text-3xl">Practice sessions</h5>
                <p className="max-w-xl text-center text-sm text-muted-foreground">
                    Pay for one session from a preparation. 30 minutes is $2, 45 minutes is $3, and 60 minutes is $4.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {products.map((product) => (
                        <div key={product.minutes} className="rounded-lg border bg-background p-6">
                            <p className="text-lg font-medium">{product.minutes} minutes</p>
                            <p className="mt-2 text-2xl">{product.price}</p>
                        </div>
                    ))}
                </div>
                <Link href="/preparations" className="text-sm underline">Open a preparation</Link>
            </div>
        </div>
    );
};

export const UpgradeViewLoading = () => {
    return (
        <LoadingState title="Loading" description="This may take a few seconds" />
    );
};

export const UpgradeViewError = () => {
    return (
        <ErrorState title="Error" description="Please try again later" />
    );
};
