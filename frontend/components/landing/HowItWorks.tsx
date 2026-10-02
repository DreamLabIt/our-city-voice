
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { steps } from "@/data/mock-data";
import SectionContainer from "../common/SectionContainer";

export default function HowItWorks(): React.ReactNode {
    return (
        <section className="w-full py-12 my-8">
            <SectionContainer>

                <div className="text-center max-w-xl mx-auto space-y-3 mb-10">

                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
                        How <span className="text-primary">OurCityVoice</span> Works
                    </h2>

                    <p className="text-sm sm:text-base text-muted-foreground font-medium">
                        Empowering citizens to report municipal problems and collaborate with authorities for a cleaner, safer city.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 relative">
                    {steps.map((item, index) => {
                        const IconComponent = item.icon;

                        return (
                            <Card
                                key={item.step}
                                className="relative border-0! shadow-none! bg-primary/2 group overflow-hidden"                        >
                                <div className="absolute top-4 right-6 text-5xl sm:text-6xl font-black text-foreground/5 group-hover:text-primary/10 transition-colors pointer-events-none select-none">
                                    {String(index + 1).padStart(2, "0")}
                                </div>

                                <CardHeader className="space-y-4 pt-6 px-6">
                                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-primary/10 text-tag-green-text flex items-center justify-center group-hover:bg-primary/80 group-hover:text-white transition-all duration-300 shadow-sm">
                                        <IconComponent className="w-7 h-7 sm:w-8 sm:h-8 stroke-2" />
                                    </div>

                                    <Badge
                                        variant="secondary"
                                        className="w-fit text-xs font-semibold px-3 py-1 rounded-lg border-0"
                                    >
                                        {item.badgeText}
                                    </Badge>

                                    <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
                                        {item.title}
                                    </CardTitle>
                                </CardHeader>

                                <CardContent className="px-6 pb-6 pt-0">
                                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                                        {item.description}
                                    </p>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </SectionContainer>
        </section>
    );
}