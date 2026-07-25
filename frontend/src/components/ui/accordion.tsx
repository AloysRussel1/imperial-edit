"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

export interface AccordionItemData {
  question: string;
  answer: string;
}

interface AccordionProps {
  items: AccordionItemData[];
  className?: string;
}

export function Accordion({ items, className }: AccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className={cn("divide-y divide-imperial-black/10 border-y border-imperial-black/10", className)}>
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div key={item.question}>
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : index)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 py-5 text-left"
            >
              <span className="font-medium text-imperial-black">{item.question}</span>
              <ChevronDown
                className={cn("h-4 w-4 shrink-0 text-imperial-gold transition-transform", isOpen && "rotate-180")}
              />
            </button>
            {isOpen ? <p className="pb-5 text-sm text-imperial-black/65">{item.answer}</p> : null}
          </div>
        );
      })}
    </div>
  );
}
