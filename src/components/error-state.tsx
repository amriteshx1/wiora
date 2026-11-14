interface Props{
    title: string;
    description: string;
};

export const ErrorState = ({
    title,
    description
}: Props) => {
    return (
        <div className="flex flex-1 items-center justify-center px-8 py-16">
            <div className="flex max-w-sm flex-col items-start gap-1">
                <h6 className="text-lg font-medium">{title}</h6>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>
        </div>
    );
};
