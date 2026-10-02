import { HelpCircle } from "lucide-react";
import { faqs } from "@/data/mock-data";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

export default function FaqSection() {
    return (
        <section className="space-y-10">
            <div className="text-center max-w-3xl mx-auto space-y-3">
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                    Frequently Asked Questions
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground max-w-140 mx-auto">
                    Find quick answers to common questions about how our platform works and how you can participate.
                </p>
            </div>

            <div className="max-w-4xl mx-auto space-y-4">
                <Accordion defaultValue={["item-0"]} className="space-y-4">
                    {faqs.map((faq, index) => (
                        <AccordionItem
                            key={index}
                            value={`item-${index}`}
                            className="bg-card border border-border-custom rounded-2xl transition-all duration-200 overflow-hidden px-6 border-b"
                        >
                            <AccordionTrigger className="w-full py-5 text-left flex items-center justify-between gap-4 font-semibold text-foreground text-base sm:text-lg hover:text-primary transition-colors hover:no-underline">
                                <span className="flex items-center gap-3">
                                    <HelpCircle className="w-5 h-5 text-primary shrink-0" />
                                    {faq.question}
                                </span>
                            </AccordionTrigger>
                            <AccordionContent className="pb-6 text-sm text-muted-foreground leading-relaxed border-t border-border-custom/50 pt-4">
                                {faq.answer}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </div>
        </section>
    );
}