export type CadetAccountRecord = {
  id: number;
  memberId: number;
  bankName: string;
  accountNumberText: string;
  duitNowIdText: string | null;
  qrCodePath: string | null;
  createdAt: string;
  updatedAt: string;
};
