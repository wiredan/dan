import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useTranslation } from "react-i18next";
interface DisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}
export function DisputeModal({ isOpen, onClose, onSubmit }: DisputeModalProps) {
  const { t } = useTranslation();
  const [reason, setReason] = useState("");
  const handleSubmit = () => {
    if (reason.trim()) {
      onSubmit(reason);
    }
  };
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('orderTracking.disputeModal.title')}</DialogTitle>
          <DialogDescription>
            {t('orderTracking.disputeModal.description')}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="reason" className="text-right">
              {t('orderTracking.disputeModal.reasonLabel')}
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="col-span-3"
              placeholder={t('orderTracking.disputeModal.reasonPlaceholder')}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t('orderTracking.disputeModal.cancel')}</Button>
          <Button onClick={handleSubmit} disabled={!reason.trim()}>{t('orderTracking.disputeModal.submit')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}