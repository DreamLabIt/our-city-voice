import { MapPin, Clock, Users, BarChart3 } from "lucide-react";

export default function WhyChooseUsSection() {
    return (
        <section className="bg-section border border-border-custom rounded-3xl p-8 sm:p-12 md:p-16 space-y-12">
            <div className="text-center max-w-3xl mx-auto space-y-3">
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                    Why Choose OurCityVoice?
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground max-w-150 mx-auto">
                    Designed with ease-of-use and speed in mind, providing an end-to-end workflow for civic problem reporting.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="space-y-3 text-center sm:text-left pr-2">
                    <div className="w-10 h-10 bg-card border border-border-custom text-primary rounded-lg flex items-center justify-center mx-auto sm:mx-0 shadow-sm">
                        <MapPin className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-base text-foreground">Geo-Tagged Reporting</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        Pinpoint exact locations of damages, road cracks, or broken street lights directly on an interactive map.
                    </p>
                </div>

                <div className="space-y-3 text-center sm:text-left border-l-2 border-border-custom -ml-10 pl-8 pr-2">
                    <div className="w-10 h-10 bg-card border border-border-custom text-primary rounded-lg flex items-center justify-center mx-auto sm:mx-0 shadow-sm">
                        <Clock className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-base text-foreground">Real-Time Status Tracking</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        Receive instant email or in-app updates as your reported issue moves from submitted to resolved.
                    </p>
                </div>

                <div className="space-y-3 text-center sm:text-left lg:border-l-2 border-border-custom -ml-8 pl-8 pr-2">
                    <div className="w-10 h-10 bg-card border border-border-custom text-primary rounded-lg flex items-center justify-center mx-auto sm:mx-0 shadow-sm">
                        <Users className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-base text-foreground">Community Upvoting</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        Neighbors can upvote critical issues to highlight urgent repairs to local authorities faster.
                    </p>
                </div>

                <div className="space-y-3 text-center sm:text-left border-l-2 border-border-custom -ml-8 pl-8">
                    <div className="w-10 h-10 bg-card border border-border-custom text-primary rounded-lg flex items-center justify-center mx-auto sm:mx-0 shadow-sm">
                        <BarChart3 className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-base text-foreground">Open Data Analytics</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        Transparent dashboards showing city-wide resolution rates and active maintenance progress.
                    </p>
                </div>
            </div>
        </section>
    );
}