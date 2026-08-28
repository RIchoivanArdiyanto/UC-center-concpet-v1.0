"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConsultationModal } from "@/components/public/consultation-modal";
import { Download, Send } from "lucide-react";

interface CenterDetailActionsProps {
  centerId: string;
  centerName: string;
  profilePdfUrl?: string | null;
}

export function CenterDetailActions({
  centerId,
  centerName,
  profilePdfUrl,
}: CenterDetailActionsProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="flex flex-wrap gap-3 pt-4">
        <Button onClick={() => setIsOpen(true)}>
          <Send className="w-4 h-4 mr-2" />
          <span>Ajukan Kerja Sama</span>
        </Button>

        {profilePdfUrl && (
          <a href={profilePdfUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              <span>Unduh Profil (PDF)</span>
            </Button>
          </a>
        )}
      </div>

      <ConsultationModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        centerId={centerId}
        centerName={centerName}
        source="CENTER_DETAIL"
      />
    </>
  );
}
