interface Props{
    title: string;
    description: string;
};

export const LoadingState = ({
    title,
    description
}: Props) => {
    return (
        <div className="flex flex-1 items-center justify-center px-8 py-16">
            <div className="flex max-w-sm flex-col items-start gap-4">
                <div className="h-px w-24 overflow-hidden bg-border">
                    <div className="research-fill h-px w-full bg-foreground" />
                </div>
                <div className="space-y-1">
                    <h6 className="text-lg font-medium">{title}</h6>
                    <p className="text-sm text-muted-foreground">{description}</p>
                </div>
            </div>
        </div>
    );
};
