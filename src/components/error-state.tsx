interface Props{
    title: string;
    description: string;
};

export const ErrorState = ({
    title,
    description
}: Props) => {
    return (
        <div className="flex min-h-[60vh] flex-1 items-center justify-center px-8 py-16">
            <div className="flex max-w-sm flex-col items-center gap-1 text-center">
                <h6 className="text-lg font-medium">{title}</h6>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>
        </div>
    );
};
