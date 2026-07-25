"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function SearchDialog() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setOpen(false);
    const params = new URLSearchParams(query ? { q: query } : {});
    router.push(`/products${params.toString() ? `?${params.toString()}` : ""}`);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label="Rechercher"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md transition-colors hover:text-imperial-gold"
        >
          <Search className="h-4 w-4" />
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rechercher dans la collection</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            autoFocus
            placeholder="Un sac, une paire, un parfum…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <Button type="submit" variant="gold">
            Rechercher
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
