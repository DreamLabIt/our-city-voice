import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface SectionContainerProps {
    children: ReactNode;
    className?: string;
}

const SectionContainer = ({
    children,
    className,
}: SectionContainerProps) => {
    return (
        <div
            className={cn(
                "max-w-[1940px] mx-auto px-4 sm:px-8 md:px-10 w-full",
                className
            )}
        >
            {children}
        </div>
    );
};

export default SectionContainer;