import { HelpCircle } from "lucide-react";
import { MINI_FAQS } from "@/data/mock-data";
import { Card, CardContent } from "@/components/ui/card";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

export default function HowIssuesAreSolvedFaqCard() {
    return (
        <Card className="bg-card border border-border-custom rounded-2xl p-6 space-y-4 shadow-sm">
            <CardContent className="p-0 space-y-4">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-border-custom pb-3 uppercase tracking-wide">
                    <HelpCircle className="w-4 h-4 text-primary" />
                    <span>How Issues Are Solved</span>
                </h3>

                <Accordion className="space-y-2">
                    {MINI_FAQS.map((faq, idx) => (
                        <AccordionItem
                            key={idx}
                            value={`faq-${idx}`}
                            className="bg-section border border-border-custom rounded-xl px-3 border-b-0 overflow-hidden"
                        >
                            <AccordionTrigger className="text-left text-xs font-bold text-foreground hover:text-primary transition-colors py-3 hover:no-underline">
                                {faq.q}
                            </AccordionTrigger>
                            <AccordionContent className="text-xs text-muted-foreground leading-relaxed border-t border-border-custom/40 pt-2 pb-3">
                                {faq.a}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </CardContent>
        </Card>
    );
}