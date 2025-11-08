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
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
interface DisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string, evidenceUrl: string) => void;
}
const MAX_FILE_SIZE_KB = 301;
export function DisputeModal({ isOpen, onClose, onSubmit }: DisputeModalProps) {
  const { t } = useTranslation();
  const [reason, setReason] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  useEffect(() => {
    if (!isOpen) {
      setReason("");
      setFile(null);
      setPreview(null);
      setFileError(null);
    }
  }, [isOpen]);
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith('image/')) {
        setFileError(t('orderTracking.disputeModal.fileErrorType'));
        setFile(null);
        setPreview(null);
        return;
      }
      if (selectedFile.size > MAX_FILE_SIZE_KB * 1024) {
        setFileError(t('orderTracking.disputeModal.fileErrorSize', { size: MAX_FILE_SIZE_KB }));
        setFile(null);
        setPreview(null);
        return;
      }
      setFileError(null);
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };
  const handleSubmit = () => {
    if (reason.trim() && !fileError) {
      // In a real app, you'd upload the file and get a URL.
      // For this mock, we'll just use the local preview URL.
      onSubmit(reason, preview || 'https://images.unsplash.com/photo-1615485925576-3453de16da64?q=80&w=800');
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
          <div className="space-y-2">
            <Label htmlFor="reason">{t('orderTracking.disputeModal.reasonLabel')}</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t('orderTracking.disputeModal.reasonPlaceholder')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="evidence">{t('orderTracking.disputeModal.evidenceLabel')}</Label>
            <Input id="evidence" type="file" accept="image/*" onChange={handleFileChange} />
            {fileError && <p className="text-sm text-destructive">{fileError}</p>}
            {preview && <img src={preview} alt="Evidence preview" className="mt-2 rounded-md max-h-40 w-full object-contain" />}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t('orderTracking.disputeModal.cancel')}</Button>
          <Button onClick={handleSubmit} disabled={!reason.trim() || !!fileError}>{t('orderTracking.disputeModal.submit')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}